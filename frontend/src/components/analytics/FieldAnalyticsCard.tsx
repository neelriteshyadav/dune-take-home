/** @format */
'use client';

import React, { useMemo } from 'react';
import { AnyField, FormResponse } from '@/lib/types';
import { BarDatum, TEXT_LENGTH_BINS, average, clamp } from '@/lib/analytics';
import BarChart from './BarChart';

type Props = { field: AnyField; responses: FormResponse[] };

export default function FieldAnalyticsCard({ field, responses }: Props) {
	const values = useMemo(
		() =>
			responses
				.map((r) => r.answers[field.id])
				.filter((v) => v !== undefined && v !== null),
		[responses, field.id],
	);
	const total = values.length;

	let subtitle = '';
	let data: BarDatum[] = [];

	if (field.type === 'multipleChoice') {
		subtitle = 'Multiple choice';
		const counts: Record<string, number> = Object.fromEntries(
			field.options.map((o) => [o, 0]),
		);
		let other = 0;
		values.forEach((v) => {
			if (typeof v === 'string' && counts[v] !== undefined) counts[v] += 1;
			else other += 1;
		});
		data = [
			...field.options.map((o) => ({ label: o, value: counts[o] })),
			...(other ? [{ label: 'Other', value: other }] : []),
		];
	} else if (field.type === 'checkboxes') {
		const counts: Record<string, number> = Object.fromEntries(
			field.options.map((o) => [o, 0]),
		);
		let sumSelected = 0;
		values.forEach((v) => {
			const arr = Array.isArray(v) ? (v as string[]) : [];
			sumSelected += arr.length;
			arr.forEach((s) => {
				if (counts[s] !== undefined) counts[s] += 1;
			});
		});
		const avgSel = total ? sumSelected / total : 0;
		subtitle = `Checkboxes · avg selected: ${avgSel.toFixed(2)}`;
		data = field.options.map((o) => ({ label: o, value: counts[o] }));
	} else if (field.type === 'rating') {
		const scale = clamp(field.scale || 5, 1, 10);
		const buckets = Array.from({ length: scale }, () => 0);
		const nums = values
			.map((v) => (typeof v === 'number' ? v : NaN))
			.filter((n) => !Number.isNaN(n))
			.map((n) => clamp(Math.round(n), 1, scale));
		nums.forEach((n) => (buckets[n - 1] += 1));
		const avg = average(nums);
		subtitle = `Rating · average: ${avg.toFixed(2)} / ${scale}`;
		data = buckets.map((c, i) => ({ label: String(i + 1), value: c }));
	} else {
		const lens = values.map((v) => String(v).length);
		const counts = TEXT_LENGTH_BINS.map(
			(b) =>
				lens.filter((n) => n >= b.min && n <= (b.max === Infinity ? n : b.max))
					.length,
		);
		subtitle = 'Text · length distribution';
		data = TEXT_LENGTH_BINS.map((b, i) => ({
			label: b.label,
			value: counts[i],
		}));
	}

	return (
		<div className='border rounded-lg p-4 bg-zinc-900 border-zinc-700'>
			<div className='flex items-center justify-between gap-3 mb-3'>
				<div>
					<div className='font-medium text-zinc-100'>{field.label}</div>
					<div className='text-xs text-zinc-400'>{subtitle}</div>
				</div>
				<div className='text-xs text-zinc-300'>N = {total}</div>
			</div>
			<BarChart
				data={data}
				total={total}
			/>
		</div>
	);
}
