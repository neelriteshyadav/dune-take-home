/** @format */

'use client';
import { useEffect, useState } from 'react';
import { FormResponse } from '@/lib/types';
import { loadResponses } from '@/lib/storage';
import { STORAGE_RESP_PREFIX } from '@/lib/constants';

export function useLiveResponses(formId: string | null, pollMs = 1500) {
	const [responses, setResponses] = useState<FormResponse[]>([]);
	useEffect(() => {
		if (!formId) return;
		const key = `${STORAGE_RESP_PREFIX}${formId}`;
		let lastRaw =
			(typeof window !== 'undefined' && window.localStorage.getItem(key)) ||
			'[]';

		const load = () => {
			const raw =
				(typeof window !== 'undefined' && window.localStorage.getItem(key)) ||
				'[]';
			if (raw !== lastRaw) {
				lastRaw = raw;
				try {
					setResponses(JSON.parse(raw) as FormResponse[]);
				} catch {
					setResponses([]);
				}
			}
		};

		try {
			setResponses(loadResponses(formId));
		} catch {}

		const onStorage = (e: StorageEvent) => {
			if (e.key === key) load();
		};
		window.addEventListener('storage', onStorage);
		const id = window.setInterval(load, pollMs);
		return () => {
			window.removeEventListener('storage', onStorage);
			window.clearInterval(id);
		};
	}, [formId, pollMs]);

	return responses;
}
