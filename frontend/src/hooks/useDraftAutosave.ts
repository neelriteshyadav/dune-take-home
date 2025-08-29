/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';
import { AnyField, FormDraft } from '@/lib/types';
import { createForm, updateForm } from '@/lib/api';

type Opts = { delay?: number; enabled?: boolean };

export default function useDraftAutosave(
	draft: { title: string; fields: AnyField[]; id?: string | null },
	opts?: Opts,
) {
	const { delay = 600, enabled = true } = opts ?? {};
	const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
	const [formId, setFormId] = useState<string | null>(draft.id ?? null);
	const timer = useRef<number | null>(null);

	const saveNow = async () => {
		if (!enabled) return;
		const payload = { title: draft.title, fields: draft.fields } as Omit<
			FormDraft,
			'updatedAt'
		>;
		try {
			const saved = formId
				? await updateForm(formId, payload as any)
				: await createForm(payload as any);
			setFormId(saved.id);
			setLastSavedAt(Date.now());
		} catch (e) {
			// You could surface a toast here
			console.error('Autosave failed:', e);
		}
	};

	useEffect(() => {
		if (!enabled) return;
		if (timer.current) window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => {
			void saveNow();
		}, delay);
		return () => {
			if (timer.current) window.clearTimeout(timer.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [draft.title, draft.fields, enabled, delay]);

	return { formId, lastSavedAt, saveNow, setFormId };
}
