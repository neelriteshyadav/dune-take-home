/** @format */
'use client';

import React from 'react';
import PieChart from './PieChart';
import type { ServerFieldAnalytics } from '@/lib/types';

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

	return (
		<div className='border rounded-lg p-4 card'>
			<div className='flex items-center justify-between gap-3 mb-3'>
				<div>
					<div className='font-medium text-app'>{metric.label}</div>
					<div className='text-xs text-muted'>{subtitleParts.join(' · ')}</div>
				</div>
				<div className='text-xs text-app/80'>N = {metric.responseN}</div>
			</div>
			<PieChart
				labels={labels}
				values={values}
			/>
		</div>
	);
}
