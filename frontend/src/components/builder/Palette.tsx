/** @format */
'use client';

import React from 'react';
import { FieldType } from '@/lib/types';
import { DND_FIELD_TYPE } from '@/lib/constants';

type Props = { onAdd: (type: FieldType) => void };

export default function Palette({ onAdd }: Props) {
	const btn = (type: FieldType, label: string) => (
		<button
			key={type}
			type='button'
			className='px-2 py-1 rounded border border-zinc-700 text-zinc-200 hover:bg-zinc-800'
			draggable
			onDragStart={(e) => {
				e.dataTransfer.effectAllowed = 'copy';
				e.dataTransfer.setData(DND_FIELD_TYPE, type);
			}}
			onClick={() => onAdd(type)}>
			{label}
		</button>
	);

	return (
		<div className='sticky top-4 h-fit'>
			<div className='border rounded-lg p-3 bg-zinc-900 border-zinc-700'>
				<div className='font-medium mb-2 text-zinc-100'>Add field</div>
				<div className='grid grid-cols-2 gap-2'>
					{btn('text', 'Text')}
					{btn('multipleChoice', 'Multiple')}
					{btn('checkboxes', 'Checkboxes')}
					{btn('rating', 'Rating')}
				</div>
				<div className='mt-3 text-xs text-zinc-500'>
					Click to add or drag into a specific position.
				</div>
			</div>
		</div>
	);
}
