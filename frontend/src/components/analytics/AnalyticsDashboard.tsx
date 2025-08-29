/** @format */
'use client';

import React from 'react';
import { AnyField, FormResponse } from '@/lib/types';
import FieldAnalyticsCard from './FieldAnalyticsCard';

type Props = {
	formId: string;
	title: string;
	fields: AnyField[];
	responses: FormResponse[];
};

export default function AnalyticsDashboard({
	formId,
	title,
	fields,
	responses,
}: Props) {
	const total = responses.length;
	const last = responses.at(-1)?.submittedAt ?? null;

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
					Live updates enabled (polling + storage events). Replace with
					Socket.IO later.
				</div>
				<div className='text-xs text-zinc-400 mt-1'>
					Form URL: <code className='px-1'>/form/{formId}</code>
				</div>
			</div>

			{fields.length === 0 && (
				<div className='text-sm text-zinc-400 border rounded p-4 bg-zinc-900 border-zinc-700'>
					No fields in this form.
				</div>
			)}

			{fields.map((f) => (
				<FieldAnalyticsCard
					key={f.id}
					field={f}
					responses={responses}
				/>
			))}

			{fields.length > 0 && total === 0 && (
				<div className='text-sm text-zinc-400 border rounded p-4 bg-zinc-900 border-zinc-700'>
					No responses yet.
				</div>
			)}
		</div>
	);
}
