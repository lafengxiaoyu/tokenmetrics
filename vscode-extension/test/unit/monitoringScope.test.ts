import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
	isAdapterEnabledForScope,
	isWindsurfEnabledForScope,
	normalizeMonitoringScope,
} from '../../../src/monitoringScope';

test('monitoring scope defaults unknown values to GitHub Copilot', () => {
	assert.equal(normalizeMonitoringScope(undefined), 'githubCopilot');
	assert.equal(normalizeMonitoringScope('unexpected'), 'githubCopilot');
});

test('GitHub Copilot scope includes Copilot surfaces and excludes other agents', () => {
	for (const id of ['copilotchat', 'copilotcli', 'jetbrains', 'visualstudio']) {
		assert.equal(isAdapterEnabledForScope({ id }, 'githubCopilot'), true, id);
	}
	for (const id of ['codexcli', 'claudecode', 'geminicli', 'opencode']) {
		assert.equal(isAdapterEnabledForScope({ id }, 'githubCopilot'), false, id);
	}
	assert.equal(isWindsurfEnabledForScope('githubCopilot'), false);
});

test('all-supported scope preserves the original discovery behavior', () => {
	assert.equal(isAdapterEnabledForScope({ id: 'codexcli' }, 'allSupported'), true);
	assert.equal(isWindsurfEnabledForScope('allSupported'), true);
});
