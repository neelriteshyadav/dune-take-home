/** @format */

import { FormDraft } from './types';

const STORAGE_KEY = 'form_builder_draft';

export function saveDraft(draft: Omit<FormDraft, 'updatedAt'>) {
	if (typeof window === 'undefined') return;
	const toSave: FormDraft = { ...draft, updatedAt: Date.now() };
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function loadDraft(): FormDraft | null {
	if (typeof window === 'undefined') return null;
	const raw = window.localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as FormDraft;
	} catch (_) {
		return null;
	}
}

export function clearDraft() {
	if (typeof window === 'undefined') return;
	window.localStorage.removeItem(STORAGE_KEY);
}
