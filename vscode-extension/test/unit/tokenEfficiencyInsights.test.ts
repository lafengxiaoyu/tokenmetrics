import test from 'node:test';
import * as assert from 'node:assert/strict';
import { buildTokenEfficiencySummary } from '../../../src/tokenEfficiencyInsights';
import type { TokenEfficiencyMetricId, UsageAnalysisPeriod } from '../../../src/types';

function period(overrides: Partial<UsageAnalysisPeriod> = {}): UsageAnalysisPeriod {
	return {
		sessions: 12,
		toolCalls: { total: 100, byTool: {} },
		modelEfficiency: {
			'gpt-5': {
				calls: 20,
				toolCalls: 100,
				editTurns: 10,
				oneShotEditTurns: 8,
				retries: 1,
				selfCorrections: 1,
				editToolCalls: 20,
				inputTokens: 1_000,
				outputTokens: 200,
				cachedReadTokens: 400,
				cost: 0,
			},
		},
		corrections: {
			userCorrections: 0,
			editRetries: 1,
			editSelfCorrections: 1,
			toolErrors: 4,
			toolErrorsRetried: 2,
			agentSelfCorrections: 0,
			escalatedUserCorrections: 0,
			sessionsWithMoments: 2,
		},
		contextWindow: {
			maxRequestInputTokens: 60_000,
			maxRequestModels: ['gpt-5'],
			tierCounts: {},
			maxReachedTokens: 60_000,
			maxReachedWindowLimit: 100_000,
		},
		...overrides,
	} as UsageAnalysisPeriod;
}

function value(summary: ReturnType<typeof buildTokenEfficiencySummary>, id: TokenEfficiencyMetricId) {
	const result = summary.metrics.find(metric => metric.id === id);
	assert.ok(result, `missing metric ${id}`);
	return result;
}

test('buildTokenEfficiencySummary derives explainable ratios from existing aggregates', () => {
	const summary = buildTokenEfficiencySummary(period());

	assert.equal(summary.sessions, 12);
	assert.equal(summary.modelCallsCovered, 20);
	assert.equal(value(summary, 'oneShotEditRate').value, 0.8);
	assert.equal(value(summary, 'oneShotEditRate').status, 'healthy');
	assert.equal(value(summary, 'reworkRate').value, 0.1);
	assert.equal(value(summary, 'reworkRate').status, 'healthy');
	assert.equal(value(summary, 'toolErrorRate').value, 0.04);
	assert.equal(value(summary, 'cacheReuseRate').value, 0.4);
	assert.equal(value(summary, 'cacheReuseRate').status, 'informational');
	assert.equal(value(summary, 'contextPressure').value, 0.6);
});

test('buildTokenEfficiencySummary reports unavailable instead of judging tiny samples', () => {
	const summary = buildTokenEfficiencySummary(period({
		toolCalls: { total: 2, byTool: {} },
		modelEfficiency: {
			'gpt-5': {
				calls: 1, toolCalls: 2, editTurns: 1, oneShotEditTurns: 0,
				retries: 1, selfCorrections: 0, editToolCalls: 2,
				inputTokens: 0, outputTokens: 0, cachedReadTokens: 0, cost: 0,
			},
		},
		contextWindow: undefined,
	}));

	for (const id of ['oneShotEditRate', 'reworkRate', 'toolErrorRate', 'cacheReuseRate', 'contextPressure'] as TokenEfficiencyMetricId[]) {
		assert.equal(value(summary, id).value, null, `${id} should not infer a ratio`);
		assert.equal(value(summary, id).status, 'unavailable');
	}
});

test('buildTokenEfficiencySummary caps malformed ratios while preserving evidence', () => {
	const summary = buildTokenEfficiencySummary(period({
		modelEfficiency: {
			'gpt-5': {
				calls: 5, toolCalls: 5, editTurns: 5, oneShotEditTurns: 6,
				retries: 4, selfCorrections: 4, editToolCalls: 5,
				inputTokens: 100, outputTokens: 0, cachedReadTokens: 150, cost: 0,
			},
		},
	}));

	assert.equal(value(summary, 'oneShotEditRate').value, 1);
	assert.equal(value(summary, 'reworkRate').value, 1);
	assert.equal(value(summary, 'cacheReuseRate').value, 1);
	assert.equal(value(summary, 'reworkRate').numerator, 8);
});
