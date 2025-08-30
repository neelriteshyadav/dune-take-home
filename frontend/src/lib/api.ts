/** @format */

import type {
	AnyField,
	FormAnswers,
	FormDoc,
	ServerAnalytics,
	ResponseDoc,
} from '@/lib/types';

const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE &&
	process.env.NEXT_PUBLIC_API_BASE.length > 0
		? process.env.NEXT_PUBLIC_API_BASE
		: 'https://dune-take-home-backend.onrender.com';

type ApiError = {
	error?: string;
	message?: string;
	errors?: Record<string, string>;
};

async function jsonOrThrow<T>(res: Response): Promise<T> {
	const contentType = res.headers.get('content-type') ?? '';
	const parse = async (): Promise<unknown> =>
		contentType.includes('application/json') ? res.json() : res.text();

	if (!res.ok) {
		const body = (await parse()) as unknown;
		const err = body as ApiError | string;
		let msg = `HTTP ${res.status}`;
		if (typeof err === 'string' && err.trim()) msg = `${msg}: ${err}`;
		else if (typeof err === 'object' && err) {
			const e = err as ApiError;
			if (e.error) msg = `${msg}: ${e.error}`;
			else if (e.message) msg = `${msg}: ${e.message}`;
			else if (e.errors) msg = `${msg}: ${JSON.stringify(e.errors)}`;
		}
		throw new Error(msg);
	}
	return (await parse()) as T;
}

// ---------- Forms ----------
export async function createForm(payload: {
	title: string;
	fields: AnyField[];
}): Promise<FormDoc> {
	const res = await fetch(`${API_BASE}/api/forms`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	return jsonOrThrow<FormDoc>(res);
}

export async function updateForm(
	id: string,
	payload: Partial<Pick<FormDoc, 'title' | 'fields'>>,
): Promise<FormDoc> {
	const res = await fetch(`${API_BASE}/api/forms/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	return jsonOrThrow<FormDoc>(res);
}

export async function getForm(id: string): Promise<FormDoc> {
	const res = await fetch(`${API_BASE}/api/forms/${id}`, { cache: 'no-store' });
	return jsonOrThrow<FormDoc>(res);
}

// Optional publish endpoint (safe no-op if you didn’t add it on backend)
export async function publishForm(id: string): Promise<FormDoc> {
	const res = await fetch(`${API_BASE}/api/forms/${id}/publish`, {
		method: 'PUT',
	});
	return jsonOrThrow<FormDoc>(res);
}

// ---------- Responses ----------
export async function submitResponse(
	formId: string,
	answers: FormAnswers,
): Promise<ResponseDoc> {
	const res = await fetch(`${API_BASE}/api/forms/${formId}/responses`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ answers }),
	});
	return jsonOrThrow<ResponseDoc>(res);
}

export async function listResponses(
	formId: string,
): Promise<{ items: ResponseDoc[] }> {
	const res = await fetch(`${API_BASE}/api/forms/${formId}/responses`, {
		cache: 'no-store',
	});
	return jsonOrThrow<{ items: ResponseDoc[] }>(res);
}

// ---------- Analytics ----------
export async function getAnalytics(formId: string): Promise<ServerAnalytics> {
	const res = await fetch(`${API_BASE}/api/forms/${formId}/analytics`, {
		cache: 'no-store',
	});
	return jsonOrThrow<ServerAnalytics>(res);
}

// Long-polling endpoint; returns fresh analytics when there are new responses
export async function longPollAnalytics(
	formId: string,
	sinceMs: number,
	signal?: AbortSignal,
): Promise<ServerAnalytics> {
	const url = new URL(`${API_BASE}/api/forms/${formId}/analytics/longpoll`);
	url.searchParams.set('sinceMs', String(sinceMs));
	const res = await fetch(url.toString(), { signal });
	return jsonOrThrow<ServerAnalytics>(res);
}

// Utilities to construct export links
export function csvExportUrl(formId: string): string {
	return `${API_BASE}/api/forms/${formId}/responses/export.csv`;
}
export function pdfExportUrl(formId: string): string {
	return `${API_BASE}/api/forms/${formId}/responses/export.pdf`;
}
