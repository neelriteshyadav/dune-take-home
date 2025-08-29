/** @format */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

async function j<T>(res: Response): Promise<T> {
	if (!res.ok) {
		let body: any = {};
		try {
			body = await res.json();
		} catch {}
		const msg = body?.error || body?.message || res.statusText;
		throw new Error(`${res.status} ${msg}`);
	}
	return res.json() as Promise<T>;
}

export type CreateFormPayload = {
	title: string;
	fields: any[]; // use your AnyField shape
};

export async function createForm(payload: CreateFormPayload) {
	const res = await fetch(`${API_BASE}/api/forms`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	return j<any>(res); // returns FormDoc
}

export async function updateForm(id: string, payload: CreateFormPayload) {
	const res = await fetch(`${API_BASE}/api/forms/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	return j<any>(res); // returns FormDoc
}

export async function getForm(id: string) {
	const res = await fetch(`${API_BASE}/api/forms/${id}`);
	return j<any>(res);
}

export async function submitResponse(formId: string, answers: any) {
	const res = await fetch(`${API_BASE}/api/forms/${formId}/responses`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ answers }),
	});
	return j<any>(res);
}

export async function getAnalytics(formId: string) {
	const res = await fetch(`${API_BASE}/api/forms/${formId}/analytics`);
	return j<any>(res);
}

export async function longPollAnalytics(formId: string, sinceMs: number) {
	const url = `${API_BASE}/api/forms/${formId}/analytics/longpoll?since=${sinceMs}`;
	const res = await fetch(url, { method: 'GET' });
	return j<any>(res);
}
