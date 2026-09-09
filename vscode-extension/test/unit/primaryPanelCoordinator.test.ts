import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
	disposeOtherPrimaryPanels,
	getPrimaryPanelNavigationTarget,
	type DisposablePanel,
} from '../../src/primaryPanelCoordinator';

function trackedPanel(id: string, disposed: string[]): DisposablePanel {
	return { dispose: () => disposed.push(id) };
}

test('primary navigation commands resolve to one shared panel slot', () => {
	assert.equal(getPrimaryPanelNavigationTarget('showUsageAnalysis'), 'usage');
	assert.equal(getPrimaryPanelNavigationTarget('showChart'), 'chart');
	assert.equal(getPrimaryPanelNavigationTarget('refresh'), undefined);
});

test('switching primary navigation disposes every panel except the destination', () => {
	const disposed: string[] = [];
	disposeOtherPrimaryPanels({
		details: trackedPanel('details', disposed),
		chart: trackedPanel('chart', disposed),
		usage: trackedPanel('usage', disposed),
	}, 'usage');

	assert.deepEqual(disposed.sort(), ['chart', 'details']);
});
