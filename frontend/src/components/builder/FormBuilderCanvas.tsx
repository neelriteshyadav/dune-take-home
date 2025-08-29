/** @format */
'use client';

import React, { useState } from 'react';
import { AnyField, FieldType } from '@/lib/types';
import { DND_FIELD_TYPE } from '@/lib/constants';
import { createField } from '@/lib/factory';
import FieldEditor from '@/components/fields/FieldEditor';

type Props = {
	fields: AnyField[];
	setFields: React.Dispatch<React.SetStateAction<AnyField[]>>;
};

export default function FormBuilderCanvas({ fields, setFields }: Props) {
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [hoverIndex, setHoverIndex] = useState<number | null>(null);

	const removeField = (id: string) =>
		setFields((prev) => prev.filter((f) => f.id !== id));
	const updateField = (id: string, partial: Partial<AnyField>) =>
		setFields((prev) =>
			prev.map((f) => (f.id === id ? ({ ...f, ...partial } as AnyField) : f)),
		);

	// ----- Reorder drag (card handle) -----
	const onCardDragStart = (
		e: React.DragEvent<HTMLDivElement>,
		index: number,
	) => {
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', String(index)); // used for reorder
		setDragIndex(index);
	};

	const onCardDragOver = (
		e: React.DragEvent<HTMLDivElement>,
		index: number,
	) => {
		// allow both palette->insert and card->reorder
		if (
			e.dataTransfer.types.includes(DND_FIELD_TYPE) ||
			e.dataTransfer.types.includes('text/plain')
		) {
			e.preventDefault();
		}
		if (dragIndex === null || dragIndex === index) return;
		setHoverIndex(index);
	};

	const onCardDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
		e.preventDefault();
		e.stopPropagation(); // 👈 prevent bubbling to canvas onDrop (which caused duplicates)

		// 1) Palette → insert BEFORE this index
		const t = e.dataTransfer.getData(DND_FIELD_TYPE) as FieldType;
		if (t) {
			setFields((prev) => {
				const cp = [...prev];
				cp.splice(index, 0, createField(t));
				return cp;
			});
			setDragIndex(null);
			setHoverIndex(null);
			return;
		}

		// 2) Reorder existing cards
		if (dragIndex === null) return;
		setFields((prev) => {
			const cp = [...prev];
			const [moved] = cp.splice(dragIndex, 1);
			cp.splice(index, 0, moved);
			return cp;
		});
		setDragIndex(null);
		setHoverIndex(null);
	};

	// ----- Canvas background (append) -----
	const onCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		if (e.dataTransfer.types.includes(DND_FIELD_TYPE)) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		}
	};

	const onCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
		// Only handle palette drops that weren't already handled by a card
		const t = e.dataTransfer.getData(DND_FIELD_TYPE) as FieldType;
		if (!t) return;
		e.preventDefault();
		e.stopPropagation(); // 👈 guard against any bubbling paths

		setFields((prev) => [...prev, createField(t)]);
		setHoverIndex(null);
		setDragIndex(null);
	};

	return (
		<div
			onDragOver={onCanvasDragOver}
			onDrop={onCanvasDrop}>
			{fields.length === 0 && (
				<div className='text-sm text-zinc-400 border border-dashed rounded-lg p-6 bg-zinc-900 border-zinc-700'>
					Drag a field from the right, or click a button to add.
				</div>
			)}

			<div className='flex flex-col gap-3 mt-3'>
				{fields.map((f, idx) => (
					<div
						key={f.id}
						className={`rounded-lg border p-3 bg-zinc-900 border-zinc-700 ${
							hoverIndex === idx ? 'ring-2 ring-blue-400' : ''
						}`}
						onDragOver={(e) => onCardDragOver(e, idx)}
						onDrop={(e) => onCardDrop(e, idx)}>
						<div className='flex items-center justify-between mb-2'>
							<input
								className='font-medium bg-transparent border-b px-1 py-0.5
                           border-zinc-700 focus:outline-none focus:border-zinc-300 text-zinc-100'
								value={f.label}
								onChange={(e) => updateField(f.id, { label: e.target.value })}
							/>
							<div className='flex items-center gap-2'>
								<div
									className='text-xs px-2 py-1 rounded border cursor-move select-none
                             border-zinc-700 text-zinc-200'
									draggable
									onDragStart={(e) => onCardDragStart(e, idx)}
									onDragEnd={() => {
										setDragIndex(null);
										setHoverIndex(null);
									}}
									aria-label='Drag to reorder'
									title='Drag to reorder'>
									Drag
								</div>
								<label className='text-xs flex items-center gap-1 text-zinc-300'>
									<input
										type='checkbox'
										checked={f.required}
										onChange={(e) =>
											updateField(f.id, { required: e.target.checked })
										}
									/>
									required
								</label>
								<button
									type='button'
									className='text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-200 hover:bg-zinc-800'
									onClick={() => removeField(f.id)}>
									Delete
								</button>
							</div>
						</div>

						<FieldEditor
							field={f}
							onChange={(partial) => updateField(f.id, partial)}
						/>

						<div className='mt-3 text-xs text-zinc-500'>
							Drop here to insert before this card.
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
