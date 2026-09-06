import { getWindowData } from '../../../../src/webview/shared/dataLoader';
import type { ContextReferenceUsage } from '../shared/contextRefUtils';
import { setHtml } from '../shared/domUtils';
import { escapeHtml, formatCompact, formatNumber, setFormatLocale } from '../shared/formatUtils';
import { initializeWebviewLocalization, localize, setCurrentLanguage } from '../shared/localization';
import { registerMessageHandler } from '../shared/messageHandler';
import type { ModeUsage, ToolCallUsage } from '../shared/types';
import { createViewStateManager } from '../shared/viewState';
import themeStyles from '../shared/theme.css';
import styles from './styles.css';

type Period = 'today' | 'last30';

type UsagePeriod = {
	sessions: number;
	toolCalls: ToolCallUsage;
	modeUsage: ModeUsage;
	contextReferences: ContextReferenceUsage;
};

type TokenPeriod = {
	tokens: number;
	actualTokens: number;
	estimatedTokens: number;
};

type DailyStat = {
	date: string;
	tokens: number;
	sessions: number;
	interactions: number;
};

type SessionSummary = {
	title: string | null;
	filePath: string;
	interactions: number;
	toolCalls: number;
	totalTokens: number;
	editor: string;
	lastActivity: string;
};

type Insight = {
	id: string;
	category: string;
	severity: 'tip' | 'opportunity' | 'celebration';
	title: string;
	body: string;
	status: 'new' | 'seen' | 'dismissed' | 'snoozed' | 'done';
};

type InsightsData = {
	today: UsagePeriod;
	last30Days: UsagePeriod;
	recentSessions?: { last30?: SessionSummary[] };
	todaySessions?: SessionSummary[];
	insights?: Insight[];
	tokenStats?: { today: TokenPeriod; last30Days: TokenPeriod } | null;
	dailyStats?: DailyStat[];
	lastUpdated: string;
	locale?: string;
	localization?: Record<string, string>;
};

type ViewState = { period: Period };

declare function acquireVsCodeApi<TState = unknown>(): {
	postMessage: (message: unknown) => void;
	setState: (state: TState) => void;
	getState: () => TState | undefined;
};

const vscode = acquireVsCodeApi<ViewState>();
const viewState = createViewStateManager(vscode, { period: 'last30' as Period });
let selectedPeriod = viewState.restore().period;
let currentData = getWindowData<InsightsData>('__INITIAL_USAGE__');

function initializeLocalization(data: InsightsData | undefined): void {
	if (!data?.localization) { return; }
	initializeWebviewLocalization(data.localization);
	setCurrentLanguage(data.localization.__language__ || 'en');
}

initializeLocalization(currentData);
if (currentData?.locale) { setFormatLocale(currentData.locale); }

function finite(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function periodUsage(data: InsightsData): UsagePeriod {
	return selectedPeriod === 'today' ? data.today : data.last30Days;
}

function periodSessions(data: InsightsData): SessionSummary[] {
	return selectedPeriod === 'today'
		? data.todaySessions ?? []
		: data.recentSessions?.last30 ?? [];
}

function periodTokens(data: InsightsData, sessions: SessionSummary[]): TokenPeriod {
	const exact = selectedPeriod === 'today' ? data.tokenStats?.today : data.tokenStats?.last30Days;
	if (exact) { return exact; }
	return {
		tokens: sessions.reduce((sum, session) => sum + finite(session.totalTokens), 0),
		actualTokens: 0,
		estimatedTokens: 0,
	};
}

function totalInteractions(modeUsage: ModeUsage): number {
	return Object.values(modeUsage).reduce((sum, count) => sum + finite(count), 0);
}

function metricCard(label: string, value: string, detail: string): string {
	return `<div class="metric-card">
		<div class="metric-label">${escapeHtml(label)}</div>
		<div class="metric-value">${escapeHtml(value)}</div>
		<div class="metric-detail">${escapeHtml(detail)}</div>
	</div>`;
}

function buildMetrics(data: InsightsData, usage: UsagePeriod, sessions: SessionSummary[]): string {
	const tokens = periodTokens(data, sessions);
	const tokenDetail = tokens.actualTokens > 0
		? `${formatCompact(tokens.actualTokens)} ${localize('copilotInsights.reportedTokens')}`
		: localize('copilotInsights.localLogs');
	return `<section class="metrics" aria-label="${escapeHtml(localize('copilotInsights.summary'))}">
		${metricCard(localize('copilotInsights.sessions'), formatNumber(usage.sessions), localize('copilotInsights.localSessions'))}
		${metricCard(localize('copilotInsights.interactions'), formatNumber(totalInteractions(usage.modeUsage)), localize('copilotInsights.requestsToCopilot'))}
		${metricCard(localize('copilotInsights.tokens'), formatCompact(tokens.tokens), tokenDetail)}
		${metricCard(localize('copilotInsights.toolCalls'), formatNumber(usage.toolCalls.total), localize('copilotInsights.intentionalAndAgentTools'))}
	</section>`;
}

function visibleDailyStats(data: InsightsData): DailyStat[] {
	const days = (data.dailyStats ?? []).filter(day => day && typeof day.date === 'string');
	return selectedPeriod === 'today' ? days.slice(-1) : days.slice(-30);
}

function buildTrend(data: InsightsData): string {
	const days = visibleDailyStats(data);
	if (days.length === 0) {
		return `<div class="empty-state">${escapeHtml(localize('copilotInsights.noTrend'))}</div>`;
	}
	const max = Math.max(1, ...days.map(day => finite(day.tokens)));
	const bars = days.map(day => {
		const tokens = finite(day.tokens);
		const height = Math.max(tokens > 0 ? 4 : 1, Math.round((tokens / max) * 100));
		return `<div class="trend-column" title="${escapeHtml(day.date)}: ${escapeHtml(formatNumber(tokens))} ${escapeHtml(localize('copilotInsights.tokens').toLowerCase())}">
			<div class="trend-bar" style="height:${height}%"></div>
		</div>`;
	}).join('');
	return `<div class="trend-chart" role="img" aria-label="${escapeHtml(localize('copilotInsights.tokenTrend'))}">${bars}</div>`;
}

function buildModeUsage(modeUsage: ModeUsage): string {
	const total = totalInteractions(modeUsage);
	const rows = [
		{ label: localize('copilotInsights.mode.ask'), count: finite(modeUsage.ask) },
		{ label: localize('copilotInsights.mode.edit'), count: finite(modeUsage.edit) },
		{ label: localize('copilotInsights.mode.agent'), count: finite(modeUsage.agent) },
		{ label: localize('copilotInsights.mode.plan'), count: finite(modeUsage.plan) },
		{ label: localize('copilotInsights.mode.customAgent'), count: finite(modeUsage.customAgent) },
		{ label: localize('copilotInsights.mode.cli'), count: finite(modeUsage.cli) + finite(modeUsage.cliApp) },
	]
		.filter(row => row.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);
	if (rows.length === 0) { return `<div class="empty-state">${escapeHtml(localize('copilotInsights.noActivity'))}</div>`; }
	return rows.map(row => {
		const percentage = total > 0 ? Math.round((row.count / total) * 100) : 0;
		return `<div class="breakdown-row">
			<div class="breakdown-label"><span>${escapeHtml(row.label)}</span><span>${percentage}%</span></div>
			<div class="breakdown-track"><div class="breakdown-fill" style="width:${percentage}%"></div></div>
		</div>`;
	}).join('');
}

function friendlyToolName(name: string): string {
	return name.replace(/^mcp__/, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function buildTopTools(toolCalls: ToolCallUsage): string {
	const tools = Object.entries(toolCalls.byTool ?? {})
		.filter(([, count]) => finite(count) > 0)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);
	if (tools.length === 0) { return `<div class="empty-state">${escapeHtml(localize('copilotInsights.noTools'))}</div>`; }
	const max = Math.max(...tools.map(([, count]) => finite(count)), 1);
	return tools.map(([name, count]) => `<div class="tool-row">
		<span class="tool-name">${escapeHtml(friendlyToolName(name))}</span>
		<span class="tool-meter"><span style="width:${Math.round((finite(count) / max) * 100)}%"></span></span>
		<span class="tool-count">${formatNumber(finite(count))}</span>
	</div>`).join('');
}

function insightIcon(severity: Insight['severity']): string {
	if (severity === 'celebration') { return '✓'; }
	if (severity === 'opportunity') { return '↗'; }
	return 'i';
}

function activeInsights(insights: Insight[] | undefined): Insight[] {
	return (insights ?? [])
		.filter(insight => insight.status !== 'dismissed' && insight.status !== 'done')
		.sort((a, b) => Number(b.status === 'new') - Number(a.status === 'new'))
		.slice(0, 3);
}

function buildInsights(insights: Insight[] | undefined): string {
	const visible = activeInsights(insights);
	if (visible.length === 0) {
		return `<div class="empty-state insight-empty">${escapeHtml(localize('copilotInsights.noInsights'))}</div>`;
	}
	return visible.map(insight => `<article class="insight-card insight-${insight.severity}">
		<div class="insight-icon" aria-hidden="true">${insightIcon(insight.severity)}</div>
		<div>
			<div class="insight-meta">${escapeHtml(insight.category)}</div>
			<h3>${escapeHtml(insight.title)}</h3>
			<p>${escapeHtml(insight.body)}</p>
		</div>
	</article>`).join('');
}

function buildRecentSessions(sessions: SessionSummary[]): string {
	if (sessions.length === 0) { return `<div class="empty-state">${escapeHtml(localize('copilotInsights.noSessions'))}</div>`; }
	return sessions.slice(0, 5).map(session => {
		const title = session.title || localize('copilotInsights.untitledSession');
		const activity = Number.isNaN(Date.parse(session.lastActivity)) ? '' : new Date(session.lastActivity).toLocaleDateString();
		return `<button class="session-row" type="button" data-session-file="${escapeHtml(session.filePath)}">
			<span class="session-main"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(session.editor)}${activity ? ` · ${escapeHtml(activity)}` : ''}</small></span>
			<span class="session-stat"><strong>${formatNumber(session.interactions)}</strong><small>${escapeHtml(localize('copilotInsights.interactions').toLowerCase())}</small></span>
			<span class="session-stat"><strong>${formatCompact(session.totalTokens)}</strong><small>${escapeHtml(localize('copilotInsights.tokens').toLowerCase())}</small></span>
		</button>`;
	}).join('');
}

function section(title: string, subtitle: string, body: string, className = ''): string {
	return `<section class="panel ${className}"><div class="panel-heading"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div></div>${body}</section>`;
}

function render(data: InsightsData): void {
	const root = document.getElementById('root');
	if (!root) { return; }
	const usage = periodUsage(data);
	const sessions = periodSessions(data);
	const periodLabel = selectedPeriod === 'today' ? localize('copilotInsights.today') : localize('copilotInsights.last30Days');
	setHtml(root, `<style>${themeStyles}</style><style>${styles}</style>
		<main class="page-shell">
			<header class="page-header">
				<div><div class="eyebrow">${escapeHtml(localize('copilotInsights.localOnly'))}</div><h1>${escapeHtml(localize('copilotInsights.title'))}</h1><p>${escapeHtml(localize('copilotInsights.subtitle'))}</p></div>
				<div class="header-actions">
					<label for="period-select">${escapeHtml(localize('copilotInsights.period'))}</label>
					<select id="period-select"><option value="today"${selectedPeriod === 'today' ? ' selected' : ''}>${escapeHtml(localize('copilotInsights.today'))}</option><option value="last30"${selectedPeriod === 'last30' ? ' selected' : ''}>${escapeHtml(localize('copilotInsights.last30Days'))}</option></select>
					<vscode-button id="refresh-button" appearance="secondary">${escapeHtml(localize('nav.btnRefresh'))}</vscode-button>
				</div>
			</header>
			<div class="scope-note"><span></span>${escapeHtml(periodLabel)} · ${escapeHtml(localize('copilotInsights.scopeNote'))}</div>
			${buildMetrics(data, usage, sessions)}
			${section(localize('copilotInsights.insightsTitle'), localize('copilotInsights.insightsSubtitle'), `<div id="insights-container" class="insight-grid">${buildInsights(data.insights)}</div>`, 'insights-panel')}
			<div class="two-column">
				${section(localize('copilotInsights.trendTitle'), localize('copilotInsights.trendSubtitle'), buildTrend(data))}
				${section(localize('copilotInsights.modesTitle'), localize('copilotInsights.modesSubtitle'), buildModeUsage(usage.modeUsage))}
			</div>
			<div class="two-column">
				${section(localize('copilotInsights.toolsTitle'), localize('copilotInsights.toolsSubtitle'), buildTopTools(usage.toolCalls))}
				${section(localize('copilotInsights.sessionsTitle'), localize('copilotInsights.sessionsSubtitle'), `<div class="session-list">${buildRecentSessions(sessions)}</div>`)}
			</div>
			<footer>${escapeHtml(localize('copilotInsights.footer'))} · ${escapeHtml(new Date(data.lastUpdated).toLocaleString())}</footer>
		</main>`);
	wireInteractions();
}

function wireInteractions(): void {
	document.getElementById('refresh-button')?.addEventListener('click', () => vscode.postMessage({ command: 'refresh' }));
	document.getElementById('period-select')?.addEventListener('change', event => {
		const value = (event.target as HTMLSelectElement).value;
		selectedPeriod = value === 'today' ? 'today' : 'last30';
		viewState.patch({ period: selectedPeriod });
		if (currentData) { render(currentData); }
	});
	document.querySelectorAll<HTMLButtonElement>('.session-row').forEach(button => {
		button.addEventListener('click', () => {
			const file = button.dataset.sessionFile;
			if (file) { vscode.postMessage({ command: 'openSessionFile', file }); }
		});
	});
}

function renderLoading(messageKey: string): void {
	const root = document.getElementById('root');
	if (!root) { return; }
	setHtml(root, `<style>${themeStyles}</style><style>${styles}</style><div class="loading-state"><div class="loading-mark"></div><strong>${escapeHtml(localize(messageKey))}</strong></div>`);
}

registerMessageHandler<Record<string, unknown>>(message => {
	if (message.command === 'updateStats' && message.data && typeof message.data === 'object') {
		currentData = message.data as InsightsData;
		initializeLocalization(currentData);
		if (currentData.locale) { setFormatLocale(currentData.locale); }
		render(currentData);
		return;
	}
	if (message.command === 'updateInsights' && currentData && Array.isArray(message.insights)) {
		currentData = { ...currentData, insights: message.insights as Insight[] };
		render(currentData);
		return;
	}
	if (message.command === 'usageRefreshing') {
		renderLoading('copilotInsights.refreshing');
		return;
	}
	if (message.command === 'updateStatsError') {
		renderLoading('copilotInsights.loadError');
	}
});

async function bootstrap(): Promise<void> {
	await import('@vscode-elements/elements/dist/vscode-button/index.js');
	if (currentData) { render(currentData); }
	else { renderLoading('copilotInsights.loading'); }
	// Preserve the existing readiness contract so extension-host updates are not buffered indefinitely.
	vscode.postMessage({ command: 'usageWebviewReady', reason: 'copilot-insights-ready', hasGitHubActivityContainers: false });
}

void bootstrap();
