import test from 'node:test';
import * as assert from 'node:assert/strict';
import { aggregateHourlyActivity, buildHourlyInteractionBuckets } from '../../../src/hourlyActivity';
import type { SessionFileCache } from '../../../src/types';

function localDayKey(date: Date): string {
	return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function cache(hourlyInteractions?: Record<string, number[]>): SessionFileCache {
	return { tokens: 0, interactions: 0, modelUsage: {}, mtime: 0, hourlyInteractions };
}

test('buildHourlyInteractionBuckets groups exact timestamps by local day and hour', () => {
	const morning = new Date(2026, 8, 14, 9, 15);
	const later = new Date(2026, 8, 14, 9, 45);
	const evening = new Date(2026, 8, 14, 20, 0);
	const buckets = buildHourlyInteractionBuckets([morning.getTime(), later.getTime(), evening.getTime(), Number.NaN]);

	assert.equal(buckets[localDayKey(morning)][9], 2);
	assert.equal(buckets[localDayKey(morning)][20], 1);
	assert.equal(buckets[localDayKey(morning)].reduce((sum, count) => sum + count, 0), 3);
});

test('aggregateHourlyActivity merges sessions and reports timestamp coverage', () => {
	const date = '2026-09-14';
	const first = Array<number>(24).fill(0); first[9] = 2;
	const second = Array<number>(24).fill(0); second[9] = 1; second[17] = 4;
	const result = aggregateHourlyActivity([
		cache({ [date]: first }),
		cache({ [date]: second }),
		cache(),
	]);

	assert.equal(result.coveredSessions, 2);
	assert.equal(result.totalInteractions, 7);
	assert.equal(result.days.length, 1);
	assert.equal(result.days[0].hours[9], 3);
	assert.equal(result.days[0].hours[17], 4);
	assert.ok(result.timeZone.length > 0);
});

test('aggregateHourlyActivity ignores invalid and negative bucket values', () => {
	const hours = Array<number>(24).fill(0);
	hours[2] = -3;
	hours[3] = Number.NaN;
	hours[4] = 2;
	const result = aggregateHourlyActivity([cache({ '2026-09-14': hours })]);

	assert.equal(result.totalInteractions, 2);
	assert.equal(result.days[0].hours[2], 0);
	assert.equal(result.days[0].hours[3], 0);
	assert.equal(result.days[0].hours[4], 2);
});
