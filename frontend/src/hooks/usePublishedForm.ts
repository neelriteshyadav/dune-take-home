/** @format */
'use client';

import { useEffect, useState } from 'react';
import { FormDoc } from '@/lib/types';
import { loadFormById } from '@/lib/storage';
import { STORAGE_KEY_FORMS } from '@/lib/constants';

/**
 * Load a published form by id and keep it fresh if localStorage changes.
 * Returns { form, loading, notFound }.
 */
export default function usePublishedForm(formId: string | null) {
	const [form, setForm] = useState<FormDoc | null>(null);
	const [loading, setLoading] = useState<boolean>(!!formId);
	const [notFound, setNotFound] = useState<boolean>(false);

	useEffect(() => {
		if (!formId) {
			setForm(null);
			setLoading(false);
			setNotFound(false);
			return;
		}

		const read = () => {
			const doc = loadFormById(formId);
			setForm(doc);
			setNotFound(!doc);
			setLoading(false);
		};

		read();

		// Update if forms map changes in this or another tab
		const onStorage = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY_FORMS) read();
		};
		window.addEventListener('storage', onStorage);

		return () => {
			window.removeEventListener('storage', onStorage);
		};
	}, [formId]);

	return { form, loading, notFound };
}
