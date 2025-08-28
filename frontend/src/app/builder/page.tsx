/** @format */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	AnyField,
	FieldType,
	FormAnswers,
	FormDraft,
	ValidationErrorMap,
} from './types';
import { clearDraft, loadDraft, saveDraft } from './storage';

const DND_FIELD_TYPE = 'application/x-form-field-type';

function generateId() {
	return Math.random().toString(36).slice(2, 10);
}

function createField(type: FieldType): AnyField {
	const id = generateId();
	if (type === 'text') {
		return {
			id,
			type: 'text',
			label: 'Text',
			required: false,
			placeholder: '',
		};
	}
	if (type === 'multipleChoice') {
		return {
			id,
			type: 'multipleChoice',
			label: 'Multiple Choice',
			required: false,
			options: ['Option 1', 'Option 2'],
		};
	}
	if (type === 'checkboxes') {
		return {
			id,
			type: 'checkboxes',
			label: 'Checkboxes',
			required: false,
			options: ['Option A', 'Option B'],
			minChecked: 0,
		};
	}
	return {
		id,
		type: 'rating',
		label: 'Rating',
		required: false,
		scale: 5,
		min: 0,
	};
}

function validateAnswers(
	fields: AnyField[],
	answers: FormAnswers,
): ValidationErrorMap {
	const errors: ValidationErrorMap = {};
	for (const field of fields) {
		const value = answers[field.id];
		if (field.required) {
			if (field.type === 'text' && (!value || String(value).trim() === ''))
				errors[field.id] = 'Required';
			if (
				field.type === 'multipleChoice' &&
				(value === undefined || value === null || value === '')
			)
				errors[field.id] = 'Required';
			if (
				field.type === 'checkboxes' &&
				(!Array.isArray(value) || (value as unknown[]).length === 0)
			)
				errors[field.id] = 'Required';
			if (
				field.type === 'rating' &&
				(typeof value !== 'number' || Number.isNaN(value))
			)
				errors[field.id] = 'Required';
		}
		if (field.type === 'text') {
			const str = (value ?? '') as string;
			if (field.minLength && str.length < field.minLength)
				errors[field.id] = `Min ${field.minLength} chars`;
			if (field.maxLength && str.length > field.maxLength)
				errors[field.id] = `Max ${field.maxLength} chars`;
		}
		if (field.type === 'checkboxes') {
			const selected = Array.isArray(value) ? (value as string[]) : [];
			if (field.minChecked !== undefined && selected.length < field.minChecked)
				errors[field.id] = `Select at least ${field.minChecked}`;
			if (field.maxChecked !== undefined && selected.length > field.maxChecked)
				errors[field.id] = `Select at most ${field.maxChecked}`;
		}
		if (field.type === 'rating') {
			const num = typeof value === 'number' ? value : undefined;
			if (num !== undefined) {
				if (field.min !== undefined && num < field.min)
					errors[field.id] = `Min ${field.min}`;
				if (num > field.scale) errors[field.id] = `Max ${field.scale}`;
			}
		}
	}
	return errors;
}

export default function BuilderPage() {
	const [title, setTitle] = useState('Untitled Form');
	const [fields, setFields] = useState<AnyField[]>([]);
	const [answers, setAnswers] = useState<FormAnswers>({});
	const [mode, setMode] = useState<'build' | 'preview'>('build');
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const saveTimer = useRef<number | null>(null);
	const [hoverIndex, setHoverIndex] = useState<number | null>(null);
	const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

	useEffect(() => {
		const existing = loadDraft();
		if (existing) {
			setTitle(existing.title);
			setFields(existing.fields);
		}
	}, []);

	const draft: Omit<FormDraft, 'updatedAt'> = useMemo(
		() => ({ id: 'local', title, fields }),
		[title, fields],
	);

	useEffect(() => {
		if (saveTimer.current) window.clearTimeout(saveTimer.current);
		saveTimer.current = window.setTimeout(() => {
			saveDraft(draft);
			setLastSavedAt(Date.now());
		}, 400);
	}, [draft]);

	const addField = useCallback((type: FieldType) => {
		setFields((prev) => [...prev, createField(type)]);
	}, []);

	const removeField = useCallback((id: string) => {
		setFields((prev) => prev.filter((f) => f.id !== id));
		setAnswers((prev) => {
			const cp = { ...prev };
			delete cp[id];
			return cp;
		});
	}, []);

	const updateField = useCallback((id: string, partial: Partial<AnyField>) => {
		setFields((prev) =>
			prev.map((f) => (f.id === id ? ({ ...f, ...partial } as AnyField) : f)),
		);
	}, []);

	const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', String(index));
		setDragIndex(index);
	};
	const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		if (dragIndex === null || dragIndex === index) return;
		setHoverIndex(index);
	};
	const onDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
		e.preventDefault();
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
	const onDragEnd = () => {
		setDragIndex(null);
		setHoverIndex(null);
	};

	const errors = useMemo(
		() => validateAnswers(fields, answers),
		[fields, answers],
	);

	const reset = () => {
		setTitle('Untitled Form');
		setFields([]);
		setAnswers({});
		clearDraft();
	};

	const submitPreview = () => {
		const errs = validateAnswers(fields, answers);
		if (Object.keys(errs).length > 0) return;
		alert('Submitted! Check console for payload.');
		// In a real app, send to backend here
		console.log({ title, answers });
	};

	return (
		<div className='p-6 max-w-3xl mx-auto'>
			<div className='flex items-center justify-between mb-6'>
				<input
					className='text-2xl font-semibold bg-transparent border-b border-foreground/20 focus:outline-none focus:border-foreground px-1 py-1 w-full mr-4'
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>
				<div className='flex gap-2 items-center'>
					<button
						className={`px-3 py-1 rounded border ${
							mode === 'build' ? 'bg-foreground text-background' : ''
						}`}
						onClick={() => setMode('build')}>
						Build
					</button>
					<button
						className={`px-3 py-1 rounded border ${
							mode === 'preview' ? 'bg-foreground text-background' : ''
						}`}
						onClick={() => setMode('preview')}>
						Preview
					</button>
					<button
						className='px-3 py-1 rounded border'
						onClick={reset}>
						Clear
					</button>
					<button
						className='px-3 py-1 rounded border'
						onClick={() => {
							saveDraft(draft);
							setLastSavedAt(Date.now());
						}}>
						Save draft
					</button>
					<button
						className='px-3 py-1 rounded border'
						onClick={() => {
							const d = loadDraft();
							if (d) {
								setTitle(d.title);
								setFields(d.fields);
							}
						}}>
						Load draft
					</button>
					<span className='text-xs opacity-60'>
						{lastSavedAt
							? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
							: ''}
					</span>
				</div>
			</div>

			{mode === 'build' && (
				<div className='grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6'>
					<div>
						<div
							onDragOver={(e) => {
								if (e.dataTransfer.types.includes(DND_FIELD_TYPE)) {
									e.preventDefault();
								}
							}}
							onDrop={(e) => {
								const t = e.dataTransfer.getData(DND_FIELD_TYPE) as FieldType;
								if (t) {
									e.preventDefault();
									e.stopPropagation();
									addField(t);
								}
							}}>
							{fields.length === 0 && (
								<div
									className='text-sm opacity-70 border border-dashed rounded p-6'
									onDragOver={(e) => {
										if (e.dataTransfer.types.includes(DND_FIELD_TYPE))
											e.preventDefault();
									}}
									onDrop={(e) => {
										const t = e.dataTransfer.getData(
											DND_FIELD_TYPE,
										) as FieldType;
										if (t) {
											e.preventDefault();
											e.stopPropagation();
											addField(t);
										}
									}}>
									No fields yet. Add from the right.
								</div>
							)}
							<div className='flex flex-col gap-3'>
								{fields.map((f, idx) => (
									<div
										key={f.id}
										className={`rounded border p-3 bg-background ${
											hoverIndex === idx ? 'ring-2 ring-blue-400' : ''
										}`}
										onDragOver={(e) => onDragOver(e, idx)}
										onDrop={(e) => onDrop(e, idx)}>
										<div className='flex items-center justify-between mb-2'>
											<input
												className='font-medium bg-transparent border-b border-foreground/20 focus:outline-none focus:border-foreground px-1 py-0.5'
												value={f.label}
												onChange={(e) =>
													updateField(f.id, { label: e.target.value })
												}
											/>
											<div className='flex items-center gap-2'>
												<div
													className='text-xs px-2 py-1 rounded border cursor-move select-none'
													draggable
													onDragStart={(e) => onDragStart(e, idx)}
													onDragEnd={onDragEnd}
													aria-label='Drag to reorder'
													title='Drag to reorder'>
													Drag
												</div>
												<label className='text-xs flex items-center gap-1'>
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
													className='text-xs px-2 py-1 rounded border'
													onClick={() => removeField(f.id)}>
													Delete
												</button>
											</div>
										</div>

										{f.type === 'text' && (
											<div className='grid grid-cols-2 gap-2 text-sm'>
												<input
													className='border rounded px-2 py-1'
													placeholder='Placeholder'
													value={f.placeholder ?? ''}
													onChange={(e) =>
														updateField(f.id, { placeholder: e.target.value })
													}
												/>
												<input
													className='border rounded px-2 py-1'
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
													className='border rounded px-2 py-1'
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
											<div className='text-sm grid grid-cols-2 gap-2'>
												<OptionEditor
													options={f.options}
													onChange={(options) =>
														updateField(f.id, { options } as Partial<AnyField>)
													}
												/>
												<input
													className='border rounded px-2 py-1'
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
													className='border rounded px-2 py-1'
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
											<div className='text-sm grid grid-cols-2 gap-2'>
												<input
													className='border rounded px-2 py-1'
													placeholder='Scale (e.g. 5)'
													value={f.scale}
													onChange={(e) =>
														updateField(f.id, {
															scale: Number(e.target.value || 0),
														})
													}
												/>
												<input
													className='border rounded px-2 py-1'
													placeholder='Min allowed'
													value={f.min ?? ''}
													onChange={(e) =>
														updateField(f.id, {
															min: e.target.value
																? Number(e.target.value)
																: undefined,
														})
													}
												/>
											</div>
										)}

										<div className='mt-3 text-xs opacity-60'>
											Drag card to reorder
										</div>
									</div>
								))}
							</div>
						</div>

						<div className='sticky top-4 h-fit'>
							<div className='border rounded p-3'>
								<div className='font-medium mb-2'>Add field</div>
								<div className='grid grid-cols-2 gap-2'>
									<button
										className='px-2 py-1 rounded border'
										draggable
										onDragStart={(e) =>
											e.dataTransfer.setData(DND_FIELD_TYPE, 'text')
										}
										onClick={() => addField('text')}>
										Text
									</button>
									<button
										className='px-2 py-1 rounded border'
										draggable
										onDragStart={(e) =>
											e.dataTransfer.setData(DND_FIELD_TYPE, 'multipleChoice')
										}
										onClick={() => addField('multipleChoice')}>
										Multiple
									</button>
									<button
										className='px-2 py-1 rounded border'
										draggable
										onDragStart={(e) =>
											e.dataTransfer.setData(DND_FIELD_TYPE, 'checkboxes')
										}
										onClick={() => addField('checkboxes')}>
										Checkboxes
									</button>
									<button
										className='px-2 py-1 rounded border'
										draggable
										onDragStart={(e) =>
											e.dataTransfer.setData(DND_FIELD_TYPE, 'rating')
										}
										onClick={() => addField('rating')}>
										Rating
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{mode === 'preview' && (
				<div className='flex flex-col gap-4'>
					{fields.map((f) => (
						<div
							key={f.id}
							className='border rounded p-3'>
							<div className='mb-2 font-medium flex items-center gap-2'>
								<span>{f.label}</span>
								{f.required && <span className='text-red-500 text-xs'>*</span>}
							</div>
							<FieldInput
								field={f}
								value={answers[f.id]}
								onChange={(val) =>
									setAnswers((prev) => ({ ...prev, [f.id]: val }))
								}
							/>
							{errors[f.id] && (
								<div className='text-xs text-red-600 mt-1'>{errors[f.id]}</div>
							)}
						</div>
					))}
					<div>
						<button
							className='px-3 py-2 rounded border'
							onClick={submitPreview}>
							Submit
						</button>
					</div>
				</div>
			)}
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
	useEffect(() => setLocal(options.join('\n')), [options]);
	return (
		<div className='col-span-2'>
			<label className='text-xs opacity-70'>Options (one per line)</label>
			<textarea
				className='w-full border rounded px-2 py-1 mt-1 h-24'
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
			/>
		</div>
	);
}

function FieldInput({
	field,
	value,
	onChange,
}: {
	field: AnyField;
	value: unknown;
	onChange: (v: unknown) => void;
}) {
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
					className={`text-2xl leading-none ${
						current >= n ? 'text-yellow-500' : 'text-gray-400'
					}`}
					onClick={() => onChange(n)}
					aria-label={`Rate ${n}`}>
					★
				</button>
			))}
			<span className='ml-2 text-sm opacity-70'>
				{current || 0}/{field.scale}
			</span>
		</div>
	);
}
