/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { MultipleChoiceField, AnyField } from '@/lib/types';

type Props = {
	field: MultipleChoiceField;
	onChange: (partial: Partial<AnyField>) => void;
};

export default function MultipleChoiceEditor({ field, onChange }: Props) {
	const [local, setLocal] = useState(field.options.join('\n'));
	useEffect(() => setLocal(field.options.join('\n')), [field.options]);

	const commit = () => {
		const options = local
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
		onChange({ options } as Partial<AnyField>);
	};

	return (
		<div className='text-sm'>
			<label className='text-xs text-gray-600'>Options (one per line)</label>
			<textarea
				className='w-full border rounded px-2 py-1 mt-1 h-24'
				value={local}
				onChange={(e) => setLocal(e.target.value)}
				onBlur={commit}
			/>
		</div>
	);
}
