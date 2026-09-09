export type PrimaryPanelId =
	| 'details'
	| 'chart'
	| 'usage'
	| 'maturity'
	| 'efficiency'
	| 'environmental'
	| 'diagnostics'
	| 'dashboard';

export interface DisposablePanel {
	dispose(): unknown;
}

const NAVIGATION_TARGETS: Readonly<Record<string, PrimaryPanelId>> = {
	showDetails: 'details',
	showChart: 'chart',
	showUsageAnalysis: 'usage',
	showMaturity: 'maturity',
	showEfficiency: 'efficiency',
	showEnvironmental: 'environmental',
	showDiagnostics: 'diagnostics',
	showDashboard: 'dashboard',
};

export function getPrimaryPanelNavigationTarget(command: string): PrimaryPanelId | undefined {
	return NAVIGATION_TARGETS[command];
}

export function disposeOtherPrimaryPanels(
	panels: Readonly<Partial<Record<PrimaryPanelId, DisposablePanel>>>,
	keep: PrimaryPanelId,
): void {
	for (const [id, panel] of Object.entries(panels)) {
		if (id !== keep) { panel?.dispose(); }
	}
}
