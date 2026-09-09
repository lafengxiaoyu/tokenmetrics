import type { IEcosystemAdapter } from './ecosystemAdapter';

export type MonitoringScope = 'githubCopilot' | 'allSupported';

const GITHUB_COPILOT_ADAPTER_IDS = new Set([
	'copilotchat',
	'copilotcli',
	'jetbrains',
	'visualstudio',
]);

export function normalizeMonitoringScope(value: unknown): MonitoringScope {
	return value === 'allSupported' ? 'allSupported' : 'githubCopilot';
}

export function isAdapterEnabledForScope(
	adapter: Pick<IEcosystemAdapter, 'id'>,
	scope: MonitoringScope,
): boolean {
	return scope === 'allSupported' || GITHUB_COPILOT_ADAPTER_IDS.has(adapter.id);
}

export function isWindsurfEnabledForScope(scope: MonitoringScope): boolean {
	return scope === 'allSupported';
}
