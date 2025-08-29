/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';
import { AnyField, FormDraft } from '@/lib/types';
import { saveDraft } from '@/lib/storage';

/**
 * Autosave the builder draft (title + fields) to localStorage.
 * - Debounced by `delay` ms
 * - Returns lastSavedAt, plus manual save/clear helpers
 */
export default function useDraftAutosave(
	draftInput: { title: string; fields: AnyField[]; id?: string },
	options?: { delay?: number; enabled?: boolean },
) {
	const { delay = 400, enabled = true } = options ?? {};
	const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
	const timer = useRef<number | null>(null);

	const saveNow = () => {
		const payload: Omit<FormDraft, 'updatedAt'> = {
			id: draftInput.id ?? 'local',
			title: draftInput.title,
			fields: draftInput.fields,
		};
		saveDraft(payload);
		setLastSavedAt(Date.now());
	};

	const clearTimer = () => {
		if (timer.current) {
			window.clearTimeout(timer.current);
			timer.current = null;
		}
	};

	useEffect(() => {
		if (!enabled) return;

		clearTimer();
		timer.current = window.setTimeout(saveNow, delay);

		return () => {
			clearTimer();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [draftInput.title, draftInput.fields, delay, enabled]);

	return { lastSavedAt, saveNow, clearTimer };
}
