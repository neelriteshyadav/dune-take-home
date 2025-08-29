/** @format */
'use client';

import { useEffect, useState } from 'react';
import { FormDoc } from '@/lib/types';
import { getForm } from '@/lib/api';

export default function usePublishedForm(formId: string | null) {
	const [form, setForm] = useState<FormDoc | null>(null);
	const [loading, setLoading] = useState<boolean>(!!formId);
	const [notFound, setNotFound] = useState<boolean>(false);

	useEffect(() => {
		let alive = true;
		const load = async () => {
			if (!formId) {
				setForm(null);
				setLoading(false);
				setNotFound(false);
				return;
			}
			setLoading(true);
			try {
				const f = await getForm(formId);
				if (!alive) return;
				setForm(f);
				setNotFound(false);
			} catch {
				if (!alive) return;
				setForm(null);
				setNotFound(true);
			} finally {
				if (alive) setLoading(false);
			}
		};
		void load();
		return () => {
			alive = false;
		};
	}, [formId]);

	return { form, loading, notFound };
}
