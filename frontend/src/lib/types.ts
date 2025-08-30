/** @format */

/* --------------------------------------------------------------------------
 * Field model
 * -------------------------------------------------------------------------- */

export type FieldType = 'text' | 'multipleChoice' | 'checkboxes' | 'rating';

export interface BaseField {
	id: string;
	label: string;
	type: FieldType;
	required: boolean;
}

export interface TextField extends BaseField {
	type: 'text';
	placeholder?: string;
	minLength?: number;
	maxLength?: number;
}

export interface MultipleChoiceField extends BaseField {
	type: 'multipleChoice';
	options: string[];
}

export interface CheckboxesField extends BaseField {
	type: 'checkboxes';
	options: string[];
	minChecked?: number;
	maxChecked?: number;
}

export interface RatingField extends BaseField {
	type: 'rating';
	scale: number; // number of stars
	min?: number; // minimum allowed rating
}

export type AnyField =
	| TextField
	| MultipleChoiceField
	| CheckboxesField
	| RatingField;

/* --------------------------------------------------------------------------
 * Draft / Validation / Answers
 * -------------------------------------------------------------------------- */

export interface FormDraft {
	id: string;
	title: string;
	fields: AnyField[];
	updatedAt: number;
}

export interface ValidationErrorMap {
	[fieldId: string]: string | undefined;
}

export interface FormAnswers {
	[fieldId: string]: unknown;
}

/* --------------------------------------------------------------------------
 * Form / Response documents (as returned by backend)
 * -------------------------------------------------------------------------- */

export interface FormDoc {
	id: string;
	title: string;
	fields: AnyField[];

	// Your previous shape
	createdAt: number;
	updatedAt: number;

	// Optional metadata commonly returned by API
	responseCount?: number;
	lastResponseAt?: number | string | null;
	lastResponseMs?: number | null;
}

export interface FormResponse {
	id: string;
	formId: string;
	submittedAt: number; // epoch ms in your previous shape
	answers: FormAnswers;
}

// Alias used by some helpers/hooks
export type ResponseDoc = FormResponse;

/* --------------------------------------------------------------------------
 * Server analytics payloads
 * -------------------------------------------------------------------------- */

export interface ServerBar {
	label: string;
	value: number;
}

export interface ServerFieldAnalytics {
	fieldId: string;
	label: string;
	type: FieldType | string;
	summary: string;
	bars: ServerBar[];
	average?: number;
	scale?: number;
	responseN: number;
}

export interface ServerAnalytics {
	formId: string;
	responseCount: number;
	lastResponseMs: number | null;
	perField: ServerFieldAnalytics[];
}
