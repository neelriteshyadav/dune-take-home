/** @format */
'use client';

import { useMemo, useRef, useState } from 'react';
import { AnyField, FormAnswers, FormDraft } from '@/lib/types';
import { createField } from '@/lib/factory';
import { validateAnswers } from '@/lib/validation';
import { saveDraft, loadDraft, clearDraft, publishForm } from '@/lib/storage';
import BuilderTopBar from '@/components/builder/BuilderTopBar';
import FormBuilderCanvas from '@/components/builder/FormBuilderCanvas';
import Palette from '@/components/builder/Palette';
import FieldInput from '@/components/fields/FieldInput';

export default function BuilderPage() {
	const [title, setTitle] = useState('Untitled Form');
	const [fields, setFields] = useState<AnyField[]>(
		() => loadDraft()?.fields ?? [],
	);
	const [answers, setAnswers] = useState<FormAnswers>({});
	const [mode, setMode] = useState<'build' | 'preview'>('build');
	const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
	const [shareUrl, setShareUrl] = useState<string | null>(null);
	const saveTimer = useRef<number | null>(null);

	const draft: Omit<FormDraft, 'updatedAt'> = useMemo(
		() => ({ id: 'local', title, fields }),
		[title, fields],
	);
	const errors = useMemo(
		() => validateAnswers(fields, answers),
		[fields, answers],
	);

	const onSaveDraft = () => {
		saveDraft(draft);
		setLastSavedAt(Date.now());
	};
	const onLoadDraft = () => {
		const d = loadDraft();
		if (d) {
			setTitle(d.title);
			setFields(d.fields);
		}
	};
	const onClear = () => {
		setTitle('Untitled Form');
		setFields([]);
		setAnswers({});
		clearDraft();
	};
	const onPublish = () => {
		const id = publishForm({ title, fields });
		const origin = typeof window !== 'undefined' ? window.location.origin : '';
		setShareUrl(`${origin}/form/${id}`);
	};

	return (
		<div className='p-6 max-w-3xl mx-auto'>
			<BuilderTopBar
				title={title}
				setTitle={setTitle}
				mode={mode}
				setMode={setMode}
				onSaveDraft={onSaveDraft}
				onLoadDraft={onLoadDraft}
				onClear={onClear}
				onPublish={onPublish}
				lastSavedAt={lastSavedAt}
				shareUrl={shareUrl}
			/>

			{mode === 'build' && (
				<div className='grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6'>
					<FormBuilderCanvas
						fields={fields}
						setFields={setFields}
					/>
					<Palette onAdd={(t) => setFields((p) => [...p, createField(t)])} />
				</div>
			)}

			{mode === 'preview' && (
				<div className='flex flex-col gap-4'>
					{fields.map((f) => (
						<div
							key={f.id}
							className='border rounded-lg p-3'>
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
				</div>
			)}
		</div>
	);
}
