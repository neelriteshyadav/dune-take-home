/** @format */
'use client';

import React from 'react';
import { TextField, AnyField } from '@/lib/types';

type Props = {
	field: TextField;
	onChange: (partial: Partial<AnyField>) => void;
};

export default function TextEditor({ field, onChange }: Props) {
	return (
		<div className='grid grid-cols-2 gap-2 text-sm'>
			<input
				className='border rounded px-2 py-1'
				placeholder='Placeholder'
				value={field.placeholder ?? ''}
				onChange={(e) => onChange({ placeholder: e.target.value })}
			/>
			<input
				className='border rounded px-2 py-1'
				placeholder='Min length'
				value={field.minLength ?? ''}
				onChange={(e) =>
					onChange({
						minLength: e.target.value ? Number(e.target.value) : undefined,
					})
				}
			/>
			<input
				className='border rounded px-2 py-1'
				placeholder='Max length'
				value={field.maxLength ?? ''}
				onChange={(e) =>
					onChange({
						maxLength: e.target.value ? Number(e.target.value) : undefined,
					})
				}
			/>
		</div>
	);
}
