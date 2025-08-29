/** @format */
'use client';

import React from 'react';
import { AnyField } from '@/lib/types';

type Props = {
	field: AnyField;
	value: unknown;
	onChange: (v: unknown) => void;
};

export default function FieldInput({ field, value, onChange }: Props) {
	if (field.type === 'text') {
		return (
			<input
				className='border rounded px-2 py-1 w-full'
				placeholder={field.placeholder}
				value={(value as string) ?? ''}
				onChange={(e) => onChange(e.target.value)}
			/>
		);
	}

	if (field.type === 'multipleChoice') {
		return (
			<div className='flex flex-col gap-2'>
				{field.options.map((opt) => (
					<label
						key={opt}
						className='flex items-center gap-2 text-sm'>
						<input
							type='radio'
							name={field.id}
							checked={value === opt}
							onChange={() => onChange(opt)}
						/>
						{opt}
					</label>
				))}
			</div>
		);
	}

	if (field.type === 'checkboxes') {
		const selected = Array.isArray(value) ? (value as string[]) : [];
		const toggle = (opt: string) => {
			const next = selected.includes(opt)
				? selected.filter((o) => o !== opt)
				: [...selected, opt];
			onChange(next);
		};
		return (
			<div className='flex flex-col gap-2'>
				{field.options.map((opt) => (
					<label
						key={opt}
						className='flex items-center gap-2 text-sm'>
						<input
							type='checkbox'
							checked={selected.includes(opt)}
							onChange={() => toggle(opt)}
						/>
						{opt}
					</label>
				))}
			</div>
		);
	}

	// rating
	const current = typeof value === 'number' ? value : 0;
	const stars = Array.from({ length: field.scale }, (_, i) => i + 1);
	return (
		<div className='flex items-center gap-1'>
			{stars.map((n) => (
				<button
					key={n}
					type='button'
					className={`text-2xl leading-none ${
						current >= n ? 'text-yellow-500' : 'text-gray-400'
					}`}
					onClick={() => onChange(n)}
					aria-label={`Rate ${n}`}>
					★
				</button>
			))}
			<span className='ml-2 text-sm text-gray-600'>
				{current || 0}/{field.scale}
			</span>
		</div>
	);
}
