/** @format */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnyField, FormDoc } from '@/lib/types';
import { createForm, updateForm } from '@/lib/api';

type Draft = {
	id: string | null;
	title: string;
	fields: AnyField[];
};

type Options = {
	delay?: number; // ms
};

type UseDraftAutosave = {
	formId: string | null;
	lastSavedAt: number | null;
	saveNow: () => Promise<void>;
	setFormId: (id: string | null) => void;
};

/**
 * Autosaves the builder draft to the backend.
 * - If no formId yet: POST /forms
 * - Else: PUT  /forms/:id
 */
export default function useDraftAutosave(
	draft: Draft,
	opts: Options = {},
): UseDraftAutosave {
	const delay = opts.delay ?? 600;
	const [formId, setFormId] = useState<string | null>(draft.id ?? null);
	const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inflight = useRef<Promise<void> | null>(null);
	const latest = useRef<Draft>(draft);
	latest.current = draft;

	const doSave = useCallback(async () => {
		const { title, fields } = latest.current;
		if (!title && fields.length === 0) return;

		let saved: FormDoc;
		if (!formId) {
			saved = await createForm({ title, fields });
			setFormId(saved.id);
		} else {
			saved = await updateForm(formId, { title, fields });
		}
		setLastSavedAt(Date.now());
	}, [formId]);

	const saveNow = useCallback(async () => {
		if (inflight.current) await inflight.current;
		inflight.current = doSave();
		try {
			await inflight.current;
		} finally {
			inflight.current = null;
		}
	}, [doSave]);

	// Debounced autosave
	useEffect(() => {
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			void saveNow();
		}, delay);
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, [draft.title, draft.fields, delay, saveNow]);

	return { formId, lastSavedAt, saveNow, setFormId };
}
