/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { CheckboxesField, AnyField } from '@/lib/types';

type Props = {
	field: CheckboxesField;
	onChange: (partial: Partial<AnyField>) => void;
};

export default function CheckboxesEditor({ field, onChange }: Props) {
	const [local, setLocal] = useState(field.options.join('\n'));
	useEffect(() => setLocal(field.options.join('\n')), [field.options]);

	const commitOptions = () => {
		const options = local
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
		onChange({ options } as Partial<AnyField>);
	};

	return (
		<div className='grid grid-cols-2 gap-2 text-sm'>
			<div className='col-span-2'>
				<label className='text-xs text-gray-600'>Options (one per line)</label>
				<textarea
					className='w-full border rounded px-2 py-1 mt-1 h-24'
					value={local}
					onChange={(e) => setLocal(e.target.value)}
					onBlur={commitOptions}
				/>
			</div>
			<input
				className='border rounded px-2 py-1'
				placeholder='Min checked'
				value={field.minChecked ?? ''}
				onChange={(e) =>
					onChange({
						minChecked: e.target.value ? Number(e.target.value) : undefined,
					})
				}
			/>
			<input
				className='border rounded px-2 py-1'
				placeholder='Max checked'
				value={field.maxChecked ?? ''}
				onChange={(e) =>
					onChange({
						maxChecked: e.target.value ? Number(e.target.value) : undefined,
					})
				}
			/>
		</div>
	);
}
