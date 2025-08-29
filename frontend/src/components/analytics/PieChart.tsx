/** @format */
'use client';

import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	ChartOptions,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type Props = {
	labels: string[];
	values: number[];
	title?: string;
};

const COLORS = [
	'#60a5fa',
	'#34d399',
	'#f87171',
	'#fbbf24',
	'#a78bfa',
	'#f472b6',
	'#22d3ee',
	'#c084fc',
	'#fb7185',
	'#4ade80',
];

export default function PieChart({ labels, values }: Props) {
	const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);

	const data = useMemo(
		() => ({
			labels,
			datasets: [
				{
					data: values,
					backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
					borderColor: '#18181b', // zinc-900
					borderWidth: 2,
				},
			],
		}),
		[labels, values],
	);

	const options: ChartOptions<'pie'> = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'bottom',
					labels: { color: '#e5e7eb' }, // zinc-200
				},
				tooltip: {
					callbacks: {
						label: (ctx) => {
							const value = Number(ctx.raw || 0);
							const pct = total ? Math.round((value / total) * 100) : 0;
							return ` ${ctx.label}: ${value} (${pct}%)`;
						},
					},
				},
			},
		}),
		[total],
	);

	return (
		<div className='h-64'>
			<Pie
				data={data}
				options={options}
			/>
		</div>
	);
}
