/** @format */
'use client';

import { useMemo, useState } from 'react';
import { AnyField, FormAnswers } from '@/lib/types';
import { createField } from '@/lib/factory';
import { validateAnswers } from '@/lib/validation';
import BuilderTopBar from '@/components/builder/BuilderTopBar';
import FormBuilderCanvas from '@/components/builder/FormBuilderCanvas';
import Palette from '@/components/builder/Palette';
import FieldInput from '@/components/fields/FieldInput';
import useDraftAutosave from '@/hooks/useDraftAutosave';
import { getForm } from '@/lib/api';

function extractFormId(input: string): string | null {
	if (!input) return null;
	let s = input.trim();

	// Try URL
	try {
		const u = new URL(s);
		s = u.pathname;
	} catch {
		// not a URL
	}

	// /form/<id> or /form/<id>/analytics
	const m = s.match(/\/form\/([a-f0-9]{24})/i);
	if (m?.[1]) return m[1];

	// bare 24-hex id
	if (/^[a-f0-9]{24}$/i.test(s)) return s;

	return null;
}

export default function BuilderPage() {
	const [title, setTitle] = useState('Untitled Form');
	const [fields, setFields] = useState<AnyField[]>([]);
	const [answers, setAnswers] = useState<FormAnswers>({});
	const [mode, setMode] = useState<'build' | 'preview'>('build');

	const { formId, lastSavedAt, saveNow, setFormId } = useDraftAutosave(
		{ id: null, title, fields },
		{ delay: 600 },
	);

	const errors = useMemo(
		() => validateAnswers(fields, answers),
		[fields, answers],
	);

	const shareUrl =
		typeof window !== 'undefined' && (formId ?? '').length > 0
			? `${window.location.origin}/form/${formId}`
			: null;

	const onClear = () => {
		setTitle('Untitled Form');
		setFields([]);
		setAnswers({});
		// keep formId; if you want a brand-new form doc, uncomment:
		// setFormId(null);
	};

	const onPublish = async () => {
		await saveNow(); // ensures latest autosave persisted
		// shareUrl already reflects the id
	};

	const onLoadDraft = async () => {
		const input = window.prompt('Enter a Form ID or paste the form URL');
		if (!input) return;
		const id = extractFormId(input);
		if (!id) {
			alert('Could not parse a valid Form ID.');
			return;
		}
		try {
			const f = await getForm(id);
			setTitle(f.title);
			setFields(f.fields as AnyField[]);
			setFormId(f.id); // future autosaves will PUT this form
			setMode('build');
		} catch (e) {
			console.error(e);
			alert('Form not found or server error.');
		}
	};

	return (
		<div className='p-6 max-w-3xl mx-auto'>
			<BuilderTopBar
				title={title}
				setTitle={setTitle}
				mode={mode}
				setMode={setMode}
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
							className='border rounded-lg p-3 card'>
							<div className='mb-2 font-medium flex items-center gap-2 text-app'>
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
								<div className='text-xs text-red-400 mt-1'>{errors[f.id]}</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
