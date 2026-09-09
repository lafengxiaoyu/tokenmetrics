import test from 'node:test';
import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

test('Sample test', () => {
	assert.strictEqual(-1, [1, 2, 3].indexOf(5));
	assert.strictEqual(-1, [1, 2, 3].indexOf(0));
});

test('Extension should be present', () => {
	const extension = vscode.extensions.getExtension('lafengxiaoyu.tokenmetrics');
	assert.ok(extension, 'Extension should be installed');
});

test('Commands should be registered', async () => {
	const extension = vscode.extensions.getExtension('lafengxiaoyu.tokenmetrics');
	if (extension && !extension.isActive) {
		await extension.activate();
	}

	const commands = await vscode.commands.getCommands(true);
	
	const expectedCommands = [
		'tokenmetrics.refresh',
		'tokenmetrics.showDetails',
		'tokenmetrics.showChart',
		'tokenmetrics.showMaturity',
		'tokenmetrics.showFluencyLevelViewer',
		'tokenmetrics.runLocalViewRegression',
		'tokenmetrics.generateDiagnosticReport'
	];

	for (const expectedCommand of expectedCommands) {
		assert.ok(
			commands.includes(expectedCommand),
			`Command ${expectedCommand} should be registered`
		);
	}
});
