import type { HourlyActivityData, HourlyInteractionBuckets, SessionFileCache } from './types';

const HOURS_PER_DAY = 24;

function localDayKey(date: Date): string {
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, '0'),
		String(date.getDate()).padStart(2, '0'),
	].join('-');
}

/** Bucket exact request timestamps by local calendar day and hour. */
export function buildHourlyInteractionBuckets(timestamps: number[]): HourlyInteractionBuckets {
	const buckets: HourlyInteractionBuckets = {};
	for (const timestamp of timestamps) {
		const date = new Date(timestamp);
		if (!Number.isFinite(timestamp) || Number.isNaN(date.getTime())) { continue; }
		const dayKey = localDayKey(date);
		const hours = buckets[dayKey] ?? Array<number>(HOURS_PER_DAY).fill(0);
		hours[date.getHours()]++;
		buckets[dayKey] = hours;
	}
	return buckets;
}

/** Merge cached per-session buckets into the compact payload sent to the Chart webview. */
export function aggregateHourlyActivity(entries: Iterable<SessionFileCache>): HourlyActivityData {
	const byDay = new Map<string, number[]>();
	let coveredSessions = 0;
	let totalInteractions = 0;
	for (const entry of entries) {
		const sessionBuckets = entry.hourlyInteractions;
		if (!sessionBuckets || Object.keys(sessionBuckets).length === 0) { continue; }
		coveredSessions++;
		for (const [date, rawHours] of Object.entries(sessionBuckets)) {
			const target = byDay.get(date) ?? Array<number>(HOURS_PER_DAY).fill(0);
			for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
				const count = Number(rawHours[hour]) || 0;
				if (count <= 0) { continue; }
				target[hour] += count;
				totalInteractions += count;
			}
			byDay.set(date, target);
		}
	}
	return {
		days: [...byDay.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([date, hours]) => ({ date, hours })),
		coveredSessions,
		totalInteractions,
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'local',
	};
}
