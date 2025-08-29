/** @format */
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AnyField, FormAnswers, FormDoc } from '@/lib/types';
import { validateAnswers } from '@/lib/validation';
import FieldInput from '@/components/fields/FieldInput';
import { getForm, submitResponse } from '@/lib/api';

export default function FillFormPage() {
	const { formId } = useParams<{ formId: string }>();
	const [form, setForm] = useState<FormDoc | null>(null);
	const [answers, setAnswers] = useState<FormAnswers>({});
	const [msg, setMsg] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		let alive = true;
		(async () => {
			try {
				const f = await getForm(formId);
				if (alive) setForm(f);
			} catch {
				if (alive) setForm(null);
			}
		})();
		return () => {
			alive = false;
		};
	}, [formId]);

	const errors = useMemo(
		() => validateAnswers(form?.fields ?? ([] as AnyField[]), answers),
		[form, answers],
	);

	if (!form)
		return <div className='p-6 max-w-3xl mx-auto'>Form not found.</div>;

	const onSubmit = async () => {
		const errs = validateAnswers(form.fields, answers);
		if (Object.keys(errs).length) return;
		setSubmitting(true);
		try {
			await submitResponse(form.id, answers);
			setAnswers({});
			setMsg('Response submitted. Thank you!');
			setTimeout(() => setMsg(null), 1800);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className='p-6 max-w-3xl mx-auto'>
			<h1 className='text-xl font-semibold mb-4 text-zinc-100'>{form.title}</h1>
			<div className='flex flex-col gap-4'>
				{form.fields.map((f) => (
					<div
						key={f.id}
						className='border rounded-lg p-3 bg-zinc-900 border-zinc-700'>
						<div className='mb-2 font-medium flex items-center gap-2 text-zinc-100'>
							<span>{f.label}</span>
							{f.required && <span className='text-red-500 text-xs'>*</span>}
						</div>
						<FieldInput
							field={f}
							value={answers[f.id]}
							onChange={(v) => setAnswers((s) => ({ ...s, [f.id]: v }))}
						/>
						{errors[f.id] && (
							<div className='text-xs text-red-400 mt-1'>{errors[f.id]}</div>
						)}
					</div>
				))}
				<div className='flex items-center gap-3'>
					<button
						className='px-3 py-2 rounded border border-zinc-700 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50'
						onClick={onSubmit}
						disabled={submitting}>
						{submitting ? 'Submitting…' : 'Submit response'}
					</button>
					{msg && <span className='text-sm text-zinc-300'>{msg}</span>}
				</div>
			</div>
		</div>
	);
}
