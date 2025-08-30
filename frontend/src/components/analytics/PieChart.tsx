/** @format */
'use client';

import React, { useEffect, useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	ChartOptions,
} from 'chart.js';
import { useTheme } from '@/components/theme/ThemeProvider';

ChartJS.register(ArcElement, Tooltip, Legend);

/** Accessible palette that keeps contrast in both themes */
const COLORS = [
	'#2563eb', // blue-600
	'#16a34a', // green-600
	'#dc2626', // red-600
	'#f59e0b', // amber-500
	'#7c3aed', // violet-600
	'#db2777', // pink-600
	'#0891b2', // cyan-600
	'#9333ea', // purple-600
	'#ea580c', // orange-600
	'#22c55e', // green-500
];

function cssVar(name: string, fallback: string) {
	if (typeof window === 'undefined') return fallback;
	const v = getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
	return v || fallback;
}

type Props = {
	labels: string[];
	values: number[];
};

export default function PieChart({ labels, values }: Props) {
	const { theme } = useTheme(); // forces recompute on toggle

	const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);

	// Pull current theme colors (re-evaluates when theme changes)
	const fg = cssVar('--fg', theme === 'dark' ? '#e5e7eb' : '#0f172a');
	const cardBg = cssVar('--card-bg', theme === 'dark' ? '#0f1115' : '#ffffff');
	const cardBorder = cssVar(
		'--card-border',
		theme === 'dark' ? '#3f3f46' : '#e5e7eb',
	);

	// Keep global defaults in sync with theme (axes/labels/tooltip default text color)
	useEffect(() => {
		ChartJS.defaults.color = fg;
		ChartJS.defaults.font.family =
			'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial';
	}, [fg]);

	const data = useMemo(
		() => ({
			labels,
			datasets: [
				{
					data: values,
					backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
					borderColor: cardBg, // crisp wedge separation against card
					borderWidth: 2,
					hoverOffset: 6,
				},
			],
		}),
		[labels, values, cardBg],
	);

	const options: ChartOptions<'pie'> = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			layout: { padding: 0 },
			plugins: {
				legend: {
					position: 'right',
					labels: {
						color: fg,
						boxWidth: 14,
						boxHeight: 14,
						padding: 12,
						usePointStyle: false,
					},
				},
				tooltip: {
					backgroundColor: cardBg, // theme-aware tooltip surface
					borderColor: cardBorder,
					borderWidth: 1.5,
					titleColor: fg,
					bodyColor: fg,
					displayColors: true,
					cornerRadius: 6,
					caretSize: 6,
					callbacks: {
						// Color of the small square in the tooltip
						labelColor: (ctx) => {
							const color =
								(ctx.dataset?.backgroundColor as string[] | undefined)?.[
									ctx.dataIndex
								] ??
								(ctx.dataset?.backgroundColor as string) ??
								'#2563eb';
							return {
								backgroundColor: color,
								borderColor: cardBorder,
								borderWidth: 1.5,
							};
						},
						labelTextColor: () => fg,
						label: (ctx) => {
							const value = Number(ctx.raw || 0);
							const pct = total ? Math.round((value / total) * 100) : 0;
							return ` ${ctx.label}: ${value} (${pct}%)`;
						},
					},
				},
			},
			elements: {
				arc: {
					borderWidth: 2,
				},
			},
			animation: { duration: 200 },
			devicePixelRatio:
				typeof window !== 'undefined' ? window.devicePixelRatio : 1,
		}),
		[fg, cardBg, cardBorder, total],
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
