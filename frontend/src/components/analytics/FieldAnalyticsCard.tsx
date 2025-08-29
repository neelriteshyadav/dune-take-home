/** @format */
'use client';

import React from 'react';
import type { ServerFieldAnalytics } from '@/lib/types';
import PieChart from './PieChart';

type Props = { metric: ServerFieldAnalytics };

export default function FieldAnalyticsCard({ metric }: Props) {
	const subtitleParts = [metric.summary];
	if (
		metric.type === 'rating' &&
		typeof metric.average === 'number' &&
		metric.scale
	) {
		subtitleParts.push(`avg: ${metric.average.toFixed(2)} / ${metric.scale}`);
	}
	if (metric.type === 'checkboxes' && typeof metric.average === 'number') {
		subtitleParts.push(`avg selected: ${metric.average.toFixed(2)}`);
	}

	const labels = metric.bars.map((b) => b.label);
	const values = metric.bars.map((b) => b.value);
	const hasData = values.some((v) => v > 0);

	return (
		<div className='border rounded-lg p-4 bg-zinc-900 border-zinc-700'>
			<div className='flex items-center justify-between gap-3 mb-3'>
				<div>
					<div className='font-medium text-zinc-100'>{metric.label}</div>
					<div className='text-xs text-zinc-400'>
						{subtitleParts.join(' · ')}
					</div>
				</div>
				<div className='text-xs text-zinc-300'>N = {metric.responseN}</div>
			</div>

			{hasData ? (
				<PieChart
					labels={labels}
					values={values}
				/>
			) : (
				<div className='text-sm text-zinc-400'>No data yet.</div>
			)}
		</div>
	);
}
