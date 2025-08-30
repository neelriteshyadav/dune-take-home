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

const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE &&
	process.env.NEXT_PUBLIC_API_BASE.length > 0
		? process.env.NEXT_PUBLIC_API_BASE
		: 'http://localhost:8080';

export default function AnalyticsDashboard({
	formId,
	title,
	analytics,
}: Props) {
	const total = analytics?.responseCount ?? 0;
	const last = analytics?.lastResponseMs ?? 0;

	const csvUrl = `${API_BASE}/api/forms/${formId}/responses/export.csv`;
	const pdfUrl = `${API_BASE}/api/forms/${formId}/responses/export.pdf`;

	return (
		<div className='flex flex-col gap-6'>
			{/* Header / Summary */}
			<div className='border rounded-lg p-4 card'>
				<div className='flex items-center justify-between flex-wrap gap-3'>
					<div>
						<div className='text-lg font-semibold text-app'>
							Analytics — {title}
						</div>
						<div className='text-xs text-muted mt-1'>
							{total} response{total === 1 ? '' : 's'}
							{last ? ` · updated ${new Date(last).toLocaleTimeString()}` : ''}
							{' · '}
							live via long-poll
						</div>
						<div className='text-xs text-muted mt-1'>
							Form URL: <code className='px-1'>/form/{formId}</code>
						</div>
					</div>

					<div className='flex items-center gap-2'>
						<a
							className='px-3 py-1 rounded border hover:opacity-90 border-app text-app'
							href={csvUrl}
							target='_blank'
							rel='noreferrer'>
							Download CSV
						</a>
						<a
							className='px-3 py-1 rounded border hover:opacity-90 border-app text-app'
							href={pdfUrl}
							target='_blank'
							rel='noreferrer'>
							Download PDF
						</a>
					</div>
				</div>
			</div>

			{/* Loading */}
			{!analytics && (
				<div className='text-sm text-muted border rounded p-4 card'>
					Loading analytics…
				</div>
			)}

			{/* Empty states */}
			{analytics && analytics.perField.length === 0 && (
				<div className='text-sm text-muted border rounded p-4 card'>
					No fields in this form.
				</div>
			)}

			{/* Per-field breakdowns */}
			{analytics && analytics.perField.length > 0 && (
				<div className='grid grid-cols-1 gap-4'>
					{analytics.perField.map((m) => (
						<FieldAnalyticsCard
							key={m.fieldId}
							metric={m}
						/>
					))}
				</div>
			)}

			{/* No responses yet */}
			{analytics && total === 0 && (
				<div className='text-sm text-muted border rounded p-4 card'>
					No responses yet.
				</div>
			)}
		</div>
	);
}
