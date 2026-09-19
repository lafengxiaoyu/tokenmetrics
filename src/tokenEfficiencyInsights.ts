import type {
	TokenEfficiencyMetric,
	TokenEfficiencyMetricId,
	TokenEfficiencySummary,
	UsageAnalysisPeriod,
} from './types';

type MetricOptions = {
	id: TokenEfficiencyMetricId;
	value: number | null;
	numerator: number;
	denominator: number;
	status: TokenEfficiencyMetric['status'];
	minimumSample: number;
};

function metric(options: MetricOptions): TokenEfficiencyMetric {
	return {
		...options,
		value: options.value === null ? null : Math.max(0, Math.min(1, options.value)),
	};
}

function ratio(numerator: number, denominator: number, minimumSample: number): number | null {
	return denominator >= minimumSample && denominator > 0 ? numerator / denominator : null;
}

function statusForHigherIsBetter(value: number | null, healthy: number, watch: number): TokenEfficiencyMetric['status'] {
	if (value === null) { return 'unavailable'; }
	if (value >= healthy) { return 'healthy'; }
	return value >= watch ? 'watch' : 'attention';
}

function statusForLowerIsBetter(value: number | null, healthy: number, watch: number): TokenEfficiencyMetric['status'] {
	if (value === null) { return 'unavailable'; }
	if (value <= healthy) { return 'healthy'; }
	return value <= watch ? 'watch' : 'attention';
}

/**
 * Derive conservative, explainable efficiency signals from metrics that are already
 * collected by Usage Analysis. This does not alter token counting or session parsing.
 * Thresholds are directional heuristics, not productivity targets.
 */
export function buildTokenEfficiencySummary(period: UsageAnalysisPeriod): TokenEfficiencySummary {
	const modelEfficiency = Object.values(period.modelEfficiency ?? {});
	const totals = modelEfficiency.reduce((sum, entry) => ({
		calls: sum.calls + entry.calls,
		editTurns: sum.editTurns + entry.editTurns,
		oneShotEditTurns: sum.oneShotEditTurns + entry.oneShotEditTurns,
		retries: sum.retries + entry.retries,
		selfCorrections: sum.selfCorrections + entry.selfCorrections,
		editToolCalls: sum.editToolCalls + entry.editToolCalls,
		inputTokens: sum.inputTokens + entry.inputTokens,
		cachedReadTokens: sum.cachedReadTokens + entry.cachedReadTokens,
	}), {
		calls: 0,
		editTurns: 0,
		oneShotEditTurns: 0,
		retries: 0,
		selfCorrections: 0,
		editToolCalls: 0,
		inputTokens: 0,
		cachedReadTokens: 0,
	});

	const oneShotValue = ratio(totals.oneShotEditTurns, totals.editTurns, 3);
	const reworkEvents = totals.retries + totals.selfCorrections;
	const reworkValue = ratio(reworkEvents, totals.editToolCalls, 5);
	const toolErrors = period.corrections?.toolErrors ?? 0;
	const toolErrorValue = period.corrections
		? ratio(toolErrors, period.toolCalls.total, 10)
		: null;
	const cacheReuseValue = ratio(totals.cachedReadTokens, totals.inputTokens, 1);
	const contextReached = period.contextWindow?.maxReachedTokens ?? 0;
	const contextLimit = period.contextWindow?.maxReachedWindowLimit ?? 0;
	const contextPressureValue = ratio(contextReached, contextLimit, 1);

	return {
		periodDays: 30,
		sessions: period.sessions,
		modelCallsCovered: totals.calls,
		metrics: [
			metric({
				id: 'oneShotEditRate', value: oneShotValue,
				numerator: totals.oneShotEditTurns, denominator: totals.editTurns,
				minimumSample: 3,
				status: statusForHigherIsBetter(oneShotValue, 0.75, 0.5),
			}),
			metric({
				id: 'reworkRate', value: reworkValue,
				numerator: reworkEvents, denominator: totals.editToolCalls,
				minimumSample: 5,
				status: statusForLowerIsBetter(reworkValue, 0.1, 0.25),
			}),
			metric({
				id: 'toolErrorRate', value: toolErrorValue,
				numerator: toolErrors, denominator: period.toolCalls.total,
				minimumSample: 10,
				status: statusForLowerIsBetter(toolErrorValue, 0.05, 0.15),
			}),
			metric({
				id: 'cacheReuseRate', value: cacheReuseValue,
				numerator: totals.cachedReadTokens, denominator: totals.inputTokens,
				minimumSample: 1,
				status: cacheReuseValue === null ? 'unavailable' : 'informational',
			}),
			metric({
				id: 'contextPressure', value: contextPressureValue,
				numerator: contextReached, denominator: contextLimit,
				minimumSample: 1,
				status: statusForLowerIsBetter(contextPressureValue, 0.65, 0.85),
			}),
		],
	};
}
