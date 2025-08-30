/** @format */
'use client';

import React from 'react';
import { FieldType } from '@/lib/types';

const DND_FIELD_TYPE = 'application/x-form-field-type';

export default function Palette({ onAdd }: { onAdd: (t: FieldType) => void }) {
	const drag = (t: FieldType) => (e: React.DragEvent<HTMLButtonElement>) => {
		e.dataTransfer.setData(DND_FIELD_TYPE, t);
		e.dataTransfer.effectAllowed = 'copy';
	};

	return (
		<div className='sticky top-4 h-fit'>
			<div className='border rounded p-3 card'>
				<div className='font-medium mb-2 text-app'>Add field</div>
				<div className='grid grid-cols-2 gap-2'>
					<button
						className='btn btn-outline'
						draggable
						onDragStart={drag('text')}
						onClick={() => onAdd('text')}>
						Text
					</button>
					<button
						className='btn btn-outline'
						draggable
						onDragStart={drag('multipleChoice')}
						onClick={() => onAdd('multipleChoice')}>
						Multiple
					</button>
					<button
						className='btn btn-outline'
						draggable
						onDragStart={drag('checkboxes')}
						onClick={() => onAdd('checkboxes')}>
						Checkboxes
					</button>
					<button
						className='btn btn-outline'
						draggable
						onDragStart={drag('rating')}
						onClick={() => onAdd('rating')}>
						Rating
					</button>
				</div>
				<div className='text-xs text-muted mt-3'>
					Click to add or drag into a specific position.
				</div>
			</div>
		</div>
	);
}
