/** @format */
'use client';

import React from 'react';
import FieldAnalyticsCard from './FieldAnalyticsCard';
import type { ServerAnalytics } from '@/lib/types';

type Props = {
	formId: string;
	title: string;
	analytics: ServerAnalytics | null;
};

export default function AnalyticsDashboard({
	formId,
	title,
	analytics,
}: Props) {
	const total = analytics?.responseCount ?? 0;
	const last = analytics?.lastResponseMs ?? 0;

	return (
		<div className='flex flex-col gap-6'>
			<div className='border rounded-lg p-4 bg-zinc-900 border-zinc-700'>
				<div className='flex items-center justify-between flex-wrap gap-2'>
					<div className='text-lg font-semibold text-zinc-100'>
						Analytics — {title}
					</div>
					<div className='text-xs text-zinc-300'>
						{total} response{total === 1 ? '' : 's'}
						{last ? ` · updated ${new Date(last).toLocaleTimeString()}` : ''}
					</div>
				</div>
				<div className='text-xs text-zinc-400 mt-1'>
					Live via long-poll (real-time).
				</div>
				<div className='text-xs text-zinc-400 mt-1'>
					Form URL: <code className='px-1'>/form/{formId}</code>
				</div>
			</div>

			{!analytics && (
				<div className='text-sm text-zinc-400 border rounded p-4 bg-zinc-900 border-zinc-700'>
					Loading analytics…
				</div>
			)}

			{analytics && (
				<>
					{analytics.perField.length === 0 ? (
						<div className='text-sm text-zinc-400 border rounded p-4 bg-zinc-900 border-zinc-700'>
							No fields in this form.
						</div>
					) : (
						<div className='grid grid-cols-1 gap-4'>
							{analytics.perField.map((m) => (
								<FieldAnalyticsCard
									key={m.fieldId}
									metric={m}
								/>
							))}
						</div>
					)}

					{total === 0 && (
						<div className='text-sm text-zinc-400 border rounded p-4 bg-zinc-900 border-zinc-700'>
							No responses yet.
						</div>
					)}
				</>
			)}
		</div>
	);
}
