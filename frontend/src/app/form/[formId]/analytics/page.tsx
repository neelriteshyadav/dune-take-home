/** @format */
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getForm } from '@/lib/api';
import type { FormDoc } from '@/lib/types';
import useLiveAnalytics from '@/hooks/useLiveAnalytics';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
	const { formId } = useParams<{ formId: string }>();
	const [form, setForm] = useState<FormDoc | null>(null);
	const analytics = useLiveAnalytics(formId);

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

	if (!form)
		return <div className='p-6 max-w-3xl mx-auto'>Form not found.</div>;

	return (
		<div className='p-6 max-w-3xl mx-auto'>
			<AnalyticsDashboard
				formId={form.id}
				title={form.title}
				analytics={analytics.data}
			/>
		</div>
	);
}
