/** @format */

export type BarDatum = { label: string; value: number; hint?: string };

export function average(nums: number[]) {
	if (!nums.length) return 0;
	return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function clamp(n: number, lo: number, hi: number) {
	return Math.max(lo, Math.min(hi, n));
}

export const TEXT_LENGTH_BINS = [
	{ label: '0–20', min: 0, max: 20 },
	{ label: '21–50', min: 21, max: 50 },
	{ label: '51–100', min: 51, max: 100 },
	{ label: '101–200', min: 101, max: 200 },
	{ label: '200+', min: 201, max: Infinity },
];
