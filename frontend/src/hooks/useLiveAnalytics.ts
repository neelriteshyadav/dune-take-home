/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';
import { getAnalytics, longPollAnalytics } from '@/lib/api';
import type { ServerAnalytics } from '@/lib/types';

export default function useLiveAnalytics(formId: string | null) {
	const [analytics, setAnalytics] = useState<ServerAnalytics | null>(null);
	const stopRef = useRef(false);

	useEffect(() => {
		stopRef.current = false;
		if (!formId) {
			setAnalytics(null);
			return;
		}

		let since = 0;

		const run = async () => {
			// initial snapshot
			try {
				const snap = await getAnalytics(formId);
				if (stopRef.current) return;
				setAnalytics(snap);
				since = snap.lastResponseMs || 0;
			} catch {
				await new Promise((r) => setTimeout(r, 1200));
			}

			// long-poll loop
			while (!stopRef.current) {
				try {
					const next = await longPollAnalytics(formId, since);
					if (!(next as any)?.timeout && next) {
						setAnalytics(next as ServerAnalytics);
						since = (next as ServerAnalytics).lastResponseMs || since;
					}
				} catch {
					await new Promise((r) => setTimeout(r, 1000));
				}
			}
		};

		void run();
		return () => {
			stopRef.current = true;
		};
	}, [formId]);

	return analytics;
}
