/** @format */

import { AnyField, FormDraft, FormDoc, FormResponse, FormAnswers } from './types';

const STORAGE_KEY = 'form_builder_draft';
const FORMS_KEY = 'form_builder_forms_v1'; // map: id -> FormDoc
const RESP_PREFIX = 'form_builder_responses_'; // per-form array

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}
function safeSet(key: string, val: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, val);
}
function safeRemove(key: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}

export function saveDraft(draft: Omit<FormDraft, 'updatedAt'>) {
  if (typeof window === 'undefined') return;
  const toSave: FormDraft = { ...draft, updatedAt: Date.now() };
  safeSet(STORAGE_KEY, JSON.stringify(toSave));
}

export function loadDraft(): FormDraft | null {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FormDraft;
  } catch {
    return null;
  }
}

export function clearDraft() {
  safeRemove(STORAGE_KEY);
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function readFormsMap(): Record<string, FormDoc> {
  const raw = safeGet(FORMS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, FormDoc>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function writeFormsMap(map: Record<string, FormDoc>) {
  safeSet(FORMS_KEY, JSON.stringify(map));
}

/**
 * Create or update a published form and return its id.
 * If form has no id, a new one is generated.
 */
export function publishForm(input: { id?: string; title: string; fields: AnyField[] }): string {
  const id = input.id ?? generateId();
  const forms = readFormsMap();

  const now = Date.now();
  const doc: FormDoc = forms[id]
    ? { ...forms[id], title: input.title, fields: input.fields, updatedAt: now }
    : { id, title: input.title, fields: input.fields, createdAt: now, updatedAt: now };

  forms[id] = doc;
  writeFormsMap(forms);
  return id;
}

export function loadFormById(id: string): FormDoc | null {
  const forms = readFormsMap();
  return forms[id] ?? null;
}

export function saveResponse(formId: string, answers: FormAnswers): FormResponse {
  const key = `${RESP_PREFIX}${formId}`;
  const raw = safeGet(key);
  const arr: FormResponse[] = raw ? (JSON.parse(raw) as FormResponse[]) : [];
  const resp: FormResponse = {
    id: generateId(),
    formId,
    submittedAt: Date.now(),
    answers,
  };
  arr.push(resp);
  safeSet(key, JSON.stringify(arr));
  return resp;
}

export function loadResponses(formId: string): FormResponse[] {
  const raw = safeGet(`${RESP_PREFIX}${formId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FormResponse[];
  } catch {
    return [];
  }
}
