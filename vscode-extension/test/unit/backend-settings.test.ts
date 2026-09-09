import './vscode-shim-register';
import test from 'node:test';
import * as assert from 'node:assert/strict';

import * as vscode from 'vscode';

import { getBackendSettings, isBackendConfigured, shouldPromptToSetSharedKey } from '../../src/backend/settings';

test('shouldPromptToSetSharedKey gates on authMode/storageAccount/sharedKey presence', () => {
	assert.equal(shouldPromptToSetSharedKey('entraId', 'acct', undefined), false);
	assert.equal(shouldPromptToSetSharedKey('sharedKey', '', undefined), false);
	assert.equal(shouldPromptToSetSharedKey('sharedKey', '   ', undefined), false);
	assert.equal(shouldPromptToSetSharedKey('sharedKey', 'acct', undefined), true);
	assert.equal(shouldPromptToSetSharedKey('sharedKey', 'acct', '   '), true);
	assert.equal(shouldPromptToSetSharedKey('sharedKey', 'acct', 'key'), false);
});

test('getBackendSettings reads config defaults and clamps lookbackDays', () => {
	(vscode as any).__mock.reset();
	(vscode as any).__mock.setConfig({
		'tokenmetrics.backend.enabled': true,
		'tokenmetrics.backend.backend': 'storageTables',
		'tokenmetrics.backend.authMode': 'entraId',
		'tokenmetrics.backend.datasetId': '  myds  ',
		'tokenmetrics.backend.shareWithTeam': false,
		'tokenmetrics.backend.shareWorkspaceMachineNames': false,
		'tokenmetrics.backend.shareConsentAt': '',
		'tokenmetrics.backend.userIdentityMode': 'pseudonymous',
		'tokenmetrics.backend.userId': '  ',
		'tokenmetrics.backend.userIdMode': 'alias',
		'tokenmetrics.backend.subscriptionId': 'sub',
		'tokenmetrics.backend.resourceGroup': 'rg',
		'tokenmetrics.backend.storageAccount': 'sa',
		'tokenmetrics.backend.aggTable': 'agg',
		'tokenmetrics.backend.eventsTable': 'events',
		'tokenmetrics.backend.lookbackDays': 999,
		'tokenmetrics.backend.includeMachineBreakdown': true
	});

	const s = getBackendSettings();
	assert.equal(s.enabled, true);
	assert.equal(s.datasetId, 'myds');
	assert.equal(s.userId, '');
	assert.equal(s.sharingProfile, 'teamAnonymized');
	assert.equal(s.shareWorkspaceMachineNames, false);
	assert.equal(s.lookbackDays, 90);
});

test('getBackendSettings sharingProfile is off when backend disabled', () => {
	(vscode as any).__mock.reset();
	(vscode as any).__mock.setConfig({
		'tokenmetrics.backend.enabled': false,
		'tokenmetrics.backend.shareWithTeam': true,
		'tokenmetrics.backend.userIdentityMode': 'alias',
	});
	const s = getBackendSettings();
	assert.equal(s.sharingProfile, 'off');
});

test('getBackendSettings sharingProfile is teamIdentified when shareWithTeam and non-pseudonymous', () => {
	(vscode as any).__mock.reset();
	(vscode as any).__mock.setConfig({
		'tokenmetrics.backend.enabled': true,
		'tokenmetrics.backend.shareWithTeam': true,
		'tokenmetrics.backend.userIdentityMode': 'alias',
	});
	const s = getBackendSettings();
	assert.equal(s.sharingProfile, 'teamIdentified');
});

test('getBackendSettings sharingProfile is teamPseudonymous when shareWithTeam and pseudonymous', () => {
	(vscode as any).__mock.reset();
	(vscode as any).__mock.setConfig({
		'tokenmetrics.backend.enabled': true,
		'tokenmetrics.backend.shareWithTeam': true,
		'tokenmetrics.backend.userIdentityMode': 'pseudonymous',
	});
	const s = getBackendSettings();
	assert.equal(s.sharingProfile, 'teamPseudonymous');
});

test('getBackendSettings clamps lookbackDays to minimum', () => {
	(vscode as any).__mock.reset();
	(vscode as any).__mock.setConfig({
		'tokenmetrics.backend.lookbackDays': 0,
	});
	const s = getBackendSettings();
	assert.ok(s.lookbackDays >= 1);
});

test('getBackendSettings defaults empty datasetId to "default"', () => {
	(vscode as any).__mock.reset();
	(vscode as any).__mock.setConfig({
		'tokenmetrics.backend.datasetId': '   ',
	});
	const s = getBackendSettings();
	assert.equal(s.datasetId, 'default');
});

test('isBackendConfigured checks required fields', () => {
	assert.equal(
		isBackendConfigured({
			enabled: true,
			backend: 'storageTables',
			authMode: 'entraId',
			datasetId: 'default',
			sharingProfile: 'off',
			shareWithTeam: false,
			shareWorkspaceMachineNames: false,
			shareConsentAt: '',
			userIdentityMode: 'pseudonymous',
			userId: '',
			userIdMode: 'alias',
			subscriptionId: 'sub',
			resourceGroup: 'rg',
			storageAccount: 'sa',
			aggTable: 'agg',
			eventsTable: 'events',
			lookbackDays: 30,
			includeMachineBreakdown: true,
	blobUploadEnabled: false,
	blobContainerName: "copilot-session-logs",
	blobUploadFrequencyHours: 24,
	blobCompressFiles: true,
	sharingServerEnabled: false,
		sharingServerEndpointUrl: ''
		}),
		true
	);

	assert.equal(
		isBackendConfigured({
			enabled: true,
			backend: 'storageTables',
			authMode: 'entraId',
			datasetId: 'default',
			sharingProfile: 'off',
			shareWithTeam: false,
			shareWorkspaceMachineNames: false,
			shareConsentAt: '',
			userIdentityMode: 'pseudonymous',
			userId: '',
			userIdMode: 'alias',
			subscriptionId: '',
			resourceGroup: 'rg',
			storageAccount: 'sa',
			aggTable: 'agg',
			eventsTable: 'events',
			lookbackDays: 30,
			includeMachineBreakdown: true,
	blobUploadEnabled: false,
	blobContainerName: "copilot-session-logs",
	blobUploadFrequencyHours: 24,
	blobCompressFiles: true,
	sharingServerEnabled: false,
		sharingServerEndpointUrl: ''
		}),
		false
	);
});
