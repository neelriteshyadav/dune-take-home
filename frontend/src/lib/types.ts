/** @format */

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
	scale: number;
	min?: number;
}

export type AnyField =
	| TextField
	| MultipleChoiceField
	| CheckboxesField
	| RatingField;

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

export interface FormDoc {
	id: string;
	title: string;
	fields: AnyField[];
	createdAt: number;
	updatedAt: number;
}

export interface FormResponse {
	id: string;
	formId: string;
	submittedAt: number;
	answers: FormAnswers;
}
