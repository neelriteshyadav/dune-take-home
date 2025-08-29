/** @format */
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormDoc } from '@/lib/types';
import { loadFormById } from '@/lib/storage';
import { useLiveResponses } from '@/hooks/useLiveResponses';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
	const { formId } = useParams<{ formId: string }>();
	const [form, setForm] = useState<FormDoc | null>(null);
	const responses = useLiveResponses(formId, 1500);

	useEffect(() => {
		setForm(loadFormById(formId) ?? null);
	}, [formId]);
	if (!form)
		return <div className='p-6 max-w-3xl mx-auto'>Form not found.</div>;

	return (
		<div className='p-6 max-w-3xl mx-auto'>
			<AnalyticsDashboard
				formId={form.id}
				title={form.title}
				fields={form.fields}
				responses={responses}
			/>
		</div>
	);
}
