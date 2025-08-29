/** @format */
'use client';

import React from 'react';
import { BarDatum } from '@/lib/analytics';

type Props = { data: BarDatum[]; total?: number };

export default function BarChart({ data, total }: Props) {
	const max = Math.max(1, ...data.map((d) => d.value));
	return (
		<div className='flex flex-col gap-2'>
			{data.map((d) => {
				const pct = total
					? Math.round((d.value / Math.max(total, 1)) * 100)
					: 0;
				const widthPct = Math.round((d.value / max) * 100);
				return (
					<div
						key={d.label}
						className='grid grid-cols-[140px_1fr_60px] items-center gap-3 text-sm'>
						<div
							className='truncate text-zinc-300'
							title={d.label}>
							{d.label}
						</div>
						<div className='h-3 rounded bg-zinc-800 overflow-hidden'>
							<div
								className='h-full rounded bg-zinc-200'
								style={{ width: `${widthPct}%` }}
							/>
						</div>
						<div className='text-right tabular-nums text-zinc-400'>
							{d.value}
							{total !== undefined ? ` · ${pct}%` : ''}
						</div>
					</div>
				);
			})}
		</div>
	);
}
