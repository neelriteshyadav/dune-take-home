/** @format */
'use client';

import React from 'react';
import { RatingField, AnyField } from '@/lib/types';

type Props = {
	field: RatingField;
	onChange: (partial: Partial<AnyField>) => void;
};

export default function RatingEditor({ field, onChange }: Props) {
	return (
		<div className='grid grid-cols-2 gap-2 text-sm'>
			<input
				className='border rounded px-2 py-1'
				placeholder='Scale (e.g. 5)'
				value={field.scale}
				onChange={(e) => onChange({ scale: Number(e.target.value || 0) })}
			/>
			<input
				className='border rounded px-2 py-1'
				placeholder='Min allowed'
				value={field.min ?? ''}
				onChange={(e) =>
					onChange({ min: e.target.value ? Number(e.target.value) : undefined })
				}
			/>
		</div>
	);
}
