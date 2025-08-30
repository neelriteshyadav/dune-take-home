/** @format */
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { AnyField, FieldType } from '@/lib/types';
import { createField } from '@/lib/factory';

type Props = {
	fields: AnyField[];
	setFields: React.Dispatch<React.SetStateAction<AnyField[]>>;
};

const DND_FIELD_TYPE = 'application/x-form-field-type';
const DND_REORDER = 'application/x-form-reorder-index';

export default function FormBuilderCanvas({ fields, setFields }: Props) {
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [hoverIndex, setHoverIndex] = useState<number | null>(null);

	const addField = useCallback(
		(type: FieldType) => setFields((prev) => [...prev, createField(type)]),
		[setFields],
	);
	const removeField = useCallback(
		(id: string) => setFields((prev) => prev.filter((f) => f.id !== id)),
		[setFields],
	);
	const updateField = useCallback(
		(id: string, partial: Partial<AnyField>) =>
			setFields((prev) =>
				prev.map((f) => (f.id === id ? ({ ...f, ...partial } as AnyField) : f)),
			),
		[setFields],
	);

	const onContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		if (e.dataTransfer.types.includes(DND_FIELD_TYPE)) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		}
	};
	const onContainerDrop = (e: React.DragEvent<HTMLDivElement>) => {
		if (!e.dataTransfer.types.includes(DND_FIELD_TYPE)) return;
		e.preventDefault();
		e.stopPropagation();
		const t = e.dataTransfer.getData(DND_FIELD_TYPE) as FieldType;
		if (t) addField(t);
	};

	const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData(DND_REORDER, String(index));
		setDragIndex(index);
	};
	const onDragOverCard = (
		e: React.DragEvent<HTMLDivElement>,
		index: number,
	) => {
		if (!e.dataTransfer.types.includes(DND_REORDER)) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		if (dragIndex === null || dragIndex === index) return;
		setHoverIndex(index);
	};
	const onDropCard = (e: React.DragEvent<HTMLDivElement>, index: number) => {
		if (!e.dataTransfer.types.includes(DND_REORDER)) return;
		e.preventDefault();
		const raw = e.dataTransfer.getData(DND_REORDER);
		const from = raw ? Number(raw) : dragIndex;
		if (from === null || Number.isNaN(from)) return;

		setFields((prev) => {
			const cp = [...prev];
			const [moved] = cp.splice(from, 1);
			cp.splice(index, 0, moved);
			return cp;
		});
		setDragIndex(null);
		setHoverIndex(null);
	};
	const onDragEnd = () => {
		setDragIndex(null);
		setHoverIndex(null);
	};

	return (
		<div
			onDragOver={onContainerDragOver}
			onDrop={onContainerDrop}
			className='min-h-[140px]'>
			{fields.length === 0 && (
				<div
					className='text-sm text-muted border border-dashed rounded p-6'
					onDragOver={onContainerDragOver}
					onDrop={onContainerDrop}>
					No fields yet. Drag from the right or click to add.
				</div>
			)}

			<div className='flex flex-col gap-3'>
				{fields.map((f, idx) => (
					<div
						key={f.id}
						className={`rounded-lg border p-3 card ${
							hoverIndex === idx ? 'ring-2 ring-blue-400' : ''
						}`}
						onDragOver={(e) => onDragOverCard(e, idx)}
						onDrop={(e) => onDropCard(e, idx)}>
						<div className='flex items-center justify-between mb-2'>
							<input
								className='font-medium bg-transparent border-b border-app focus:outline-none focus:border-app px-1 py-0.5 text-app'
								value={f.label}
								onChange={(e) => updateField(f.id, { label: e.target.value })}
								placeholder='Question label'
							/>
							<div className='flex items-center gap-2'>
								<div
									className='text-xs px-2 py-1 rounded border cursor-move select-none border-app text-app'
									draggable
									onDragStart={(e) => onDragStart(e, idx)}
									onDragEnd={onDragEnd}
									aria-label='Drag to reorder'
									title='Drag to reorder'>
									Drag
								</div>
								<label className='text-xs flex items-center gap-1 text-app'>
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
									className='btn btn-outline small'
									onClick={() => removeField(f.id)}>
									Delete
								</button>
							</div>
						</div>

						{f.type === 'text' && (
							<div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-sm'>
								<input
									className='input'
									placeholder='Placeholder'
									value={f.placeholder ?? ''}
									onChange={(e) =>
										updateField(f.id, { placeholder: e.target.value })
									}
								/>
								<input
									className='input'
									placeholder='Min length'
									value={f.minLength ?? ''}
									onChange={(e) =>
										updateField(f.id, {
											minLength: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
								/>
								<input
									className='input'
									placeholder='Max length'
									value={f.maxLength ?? ''}
									onChange={(e) =>
										updateField(f.id, {
											maxLength: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
								/>
							</div>
						)}

						{f.type === 'multipleChoice' && (
							<div className='text-sm'>
								<OptionEditor
									options={f.options}
									onChange={(options) =>
										updateField(f.id, { options } as Partial<AnyField>)
									}
								/>
							</div>
						)}

						{f.type === 'checkboxes' && (
							<div className='text-sm grid grid-cols-1 md:grid-cols-3 gap-2'>
								<div className='md:col-span-3'>
									<OptionEditor
										options={f.options}
										onChange={(options) =>
											updateField(f.id, { options } as Partial<AnyField>)
										}
									/>
								</div>
								<input
									className='input'
									placeholder='Min checked'
									value={f.minChecked ?? ''}
									onChange={(e) =>
										updateField(f.id, {
											minChecked: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
								/>
								<input
									className='input'
									placeholder='Max checked'
									value={f.maxChecked ?? ''}
									onChange={(e) =>
										updateField(f.id, {
											maxChecked: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
								/>
							</div>
						)}

						{f.type === 'rating' && (
							<div className='text-sm grid grid-cols-1 md:grid-cols-2 gap-2'>
								<input
									className='input'
									placeholder='Scale (e.g. 5)'
									value={f.scale}
									onChange={(e) =>
										updateField(f.id, { scale: Number(e.target.value || 0) })
									}
								/>
								<input
									className='input'
									placeholder='Min allowed'
									value={f.min ?? ''}
									onChange={(e) =>
										updateField(f.id, {
											min: e.target.value ? Number(e.target.value) : undefined,
										})
									}
								/>
							</div>
						)}

						<div className='mt-3 text-xs text-muted'>Drag card to reorder</div>
					</div>
				))}
			</div>
		</div>
	);
}

function OptionEditor({
	options,
	onChange,
}: {
	options: string[];
	onChange: (next: string[]) => void;
}) {
	const [local, setLocal] = useState(options.join('\n'));
	const joined = useMemo(() => options.join('\n'), [options]);
	useEffectSync(local, setLocal, joined);

	return (
		<div className='w-full'>
			<label className='text-xs text-muted'>Options (one per line)</label>
			<textarea
				className='textarea mt-1 h-24'
				value={local}
				onChange={(e) => setLocal(e.target.value)}
				onBlur={() =>
					onChange(
						local
							.split('\n')
							.map((s) => s.trim())
							.filter(Boolean),
					)
				}
				placeholder={'Option 1\nOption 2'}
			/>
		</div>
	);
}

function useEffectSync<T>(local: T, setLocal: (v: T) => void, upstream: T) {
	const [prev, setPrev] = useState(upstream);
	useMemo(() => {
		if (prev !== upstream) {
			setPrev(upstream);
			setLocal(upstream);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [upstream]);
}
