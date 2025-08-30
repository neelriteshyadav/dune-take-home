/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';
import type { ServerAnalytics } from '@/lib/types';
import { getAnalytics, longPollAnalytics } from '@/lib/api';

type UseLiveAnalytics = {
	data: ServerAnalytics | null;
	error: string | null;
};

/**
 * Fetches analytics once, then long-polls for updates.
 * Uses ?sinceMs to only return when new responses arrive.
 */
export default function useLiveAnalytics(formId: string): UseLiveAnalytics {
	const [data, setData] = useState<ServerAnalytics | null>(null);
	const [error, setError] = useState<string | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	const mounted = useRef<boolean>(true);

	// Initial load
	useEffect(() => {
		mounted.current = true;
		(async () => {
			try {
				const an = await getAnalytics(formId);
				if (mounted.current) setData(an);
			} catch (e) {
				if (mounted.current)
					setError(e instanceof Error ? e.message : 'Failed to load analytics');
			}
		})();
		return () => {
			mounted.current = false;
			if (abortRef.current) abortRef.current.abort();
		};
	}, [formId]);

	// Long-poll loop
	useEffect(() => {
		let active = true;

		async function loop(): Promise<void> {
			while (active) {
				try {
					const since = data?.lastResponseMs ?? 0;
					abortRef.current?.abort(); // cancel any prior poll
					const ac = new AbortController();
					abortRef.current = ac;

					const fresh = await longPollAnalytics(formId, since, ac.signal);
					if (!active || !mounted.current) return;
					setData(fresh);
					// immediately continue to next poll for new updates
				} catch (e) {
					if (!active || !mounted.current) return;
					// Backoff on network/timeout errors; keep UI usable
					await new Promise((r) => setTimeout(r, 1000));
				}
			}
		}

		if (formId) {
			void loop();
		}

		return () => {
			active = false;
			abortRef.current?.abort();
		};
	}, [formId, data?.lastResponseMs]);

	return { data, error };
}
