/**
 * Webview localization support.
 * This module provides localized strings for webview components.
 * The localized strings are passed from the extension when the webview is created.
 */

// Type for localized strings that can be passed to webviews
export interface WebviewLocalization {
	// Navigation button labels
	'nav.btnRefresh': string;
	'nav.btnDetails': string;
	'nav.btnChart': string;
	'nav.btnUsage': string;
	'nav.btnDiagnostics': string;
	'nav.btnMaturity': string;
	'nav.btnDashboard': string;
	'nav.btnLevelViewer': string;
	'nav.btnEnvironmental': string;
	'nav.btnEfficiency': string;
	
	// Add other webview-localizable strings here as needed
	[key: string]: string;
}

// Default English strings (fallback)
const DEFAULT_LOCALIZATION: WebviewLocalization = {
	'nav.btnRefresh': 'Refresh',
	'nav.btnDetails': 'Details',
	'nav.btnChart': 'Chart',
	'nav.btnUsage': 'Usage Analysis',
	'nav.btnDiagnostics': 'Diagnostics',
	'nav.btnMaturity': 'Fluency Score',
	'nav.btnDashboard': 'Team Dashboard',
	'nav.btnLevelViewer': 'Level Viewer',
	'nav.btnEnvironmental': 'Environmental Impact',
	'nav.btnEfficiency': 'Efficiency',
	'copilotInsights.title': 'GitHub Copilot Insights',
	'copilotInsights.subtitle': 'A focused view of how you use Copilot and what to improve next.',
	'copilotInsights.localOnly': 'Local Copilot analysis',
	'copilotInsights.period': 'Period',
	'copilotInsights.today': 'Today',
	'copilotInsights.last30Days': 'Last 30 days',
	'copilotInsights.scopeNote': 'VS Code and Copilot CLI session logs only. No cloud or team sync.',
	'copilotInsights.summary': 'Usage summary',
	'copilotInsights.sessions': 'Sessions',
	'copilotInsights.localSessions': 'Local Copilot sessions',
	'copilotInsights.interactions': 'Interactions',
	'copilotInsights.requestsToCopilot': 'Requests sent to Copilot',
	'copilotInsights.tokens': 'Tokens',
	'copilotInsights.reportedTokens': 'reported by the model',
	'copilotInsights.localLogs': 'Reported and estimated from local logs',
	'copilotInsights.toolCalls': 'Tool calls',
	'copilotInsights.intentionalAndAgentTools': 'Tools used during Copilot sessions',
	'copilotInsights.insightsTitle': 'Insights for you',
	'copilotInsights.insightsSubtitle': 'The three most relevant observations from your recent Copilot activity.',
	'copilotInsights.trendTitle': 'Usage trend',
	'copilotInsights.trendSubtitle': 'Daily token activity in the selected period.',
	'copilotInsights.tokenTrend': 'Daily Copilot token trend',
	'copilotInsights.modesTitle': 'How you work',
	'copilotInsights.modesSubtitle': 'The Copilot interaction modes you use most.',
	'copilotInsights.toolsTitle': 'Top tools',
	'copilotInsights.toolsSubtitle': 'The tools Copilot called most often.',
	'copilotInsights.sessionsTitle': 'Recent sessions',
	'copilotInsights.sessionsSubtitle': 'Open a recent session for more detail.',
	'copilotInsights.noTrend': 'No trend data is available for this period.',
	'copilotInsights.noActivity': 'No Copilot interaction modes were detected.',
	'copilotInsights.noTools': 'No tool calls were detected.',
	'copilotInsights.noSessions': 'No Copilot sessions were detected.',
	'copilotInsights.noInsights': 'Keep using Copilot. Insights appear when there is enough activity to support them.',
	'copilotInsights.untitledSession': 'Untitled session',
	'copilotInsights.footer': 'Analyzed locally',
	'copilotInsights.loading': 'Loading GitHub Copilot insights…',
	'copilotInsights.refreshing': 'Refreshing GitHub Copilot insights…',
	'copilotInsights.loadError': 'Could not load Copilot insights. Try refreshing.',
	'copilotInsights.mode.ask': 'Ask',
	'copilotInsights.mode.edit': 'Edit',
	'copilotInsights.mode.agent': 'Agent',
	'copilotInsights.mode.plan': 'Plan',
	'copilotInsights.mode.customAgent': 'Custom agent',
	'copilotInsights.mode.cli': 'Copilot CLI'
};

// Current localization strings, initialized with defaults
let currentLocalization: WebviewLocalization = { ...DEFAULT_LOCALIZATION };

/**
 * Initialize webview localization with strings from the extension.
 * This should be called when the webview receives its initial state/data.
 * Entries whose value equals their key are raw localization keys passed
 * through unresolved (bundle load failure on the extension side) — ignore
 * them so the built-in defaults are used instead of showing raw keys.
 */
export function initializeWebviewLocalization(localization: Partial<WebviewLocalization>): void {
	const resolved: Record<string, string> = {};
	for (const [key, value] of Object.entries(localization)) {
		if (typeof value === 'string' && value !== key) {
			resolved[key] = value;
		}
	}
	currentLocalization = { ...DEFAULT_LOCALIZATION, ...resolved } as WebviewLocalization;
}

/**
 * Get a localized string for the webview.
 * Falls back to the default English string if not found.
 */
export function localize(key: string): string {
	return currentLocalization[key] || DEFAULT_LOCALIZATION[key] || key;
}

/**
 * Get the current language identifier (e.g., 'en', 'zh-cn')
 * This is set when the webview receives its initial state.
 */
let currentLanguage: string = 'en';

export function setCurrentLanguage(language: string): void {
	currentLanguage = language;
}

export function getCurrentLanguage(): string {
	return currentLanguage;
}

/**
 * Check if the current language is right-to-left (RTL)
 */
export function isRTL(): boolean {
	const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'ps', 'dv', 'yi'];
	return rtlLanguages.some(lang => currentLanguage.startsWith(lang));
}
