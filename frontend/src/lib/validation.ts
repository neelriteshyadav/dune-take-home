/** @format */

import { AnyField, FormAnswers, ValidationErrorMap } from './types';

export function validateAnswers(
	fields: AnyField[],
	answers: FormAnswers,
): ValidationErrorMap {
	const errors: ValidationErrorMap = {};
	for (const field of fields) {
		const value = answers[field.id];

		if (field.required) {
			if (field.type === 'text' && (!value || String(value).trim() === ''))
				errors[field.id] = 'Required';
			if (
				field.type === 'multipleChoice' &&
				(value === undefined || value === null || value === '')
			)
				errors[field.id] = 'Required';
			if (
				field.type === 'checkboxes' &&
				(!Array.isArray(value) || (value as unknown[]).length === 0)
			)
				errors[field.id] = 'Required';
			if (
				field.type === 'rating' &&
				(typeof value !== 'number' || Number.isNaN(value))
			)
				errors[field.id] = 'Required';
		}

		if (field.type === 'text') {
			const str = (value ?? '') as string;
			if (field.minLength && str.length < field.minLength)
				errors[field.id] = `Min ${field.minLength} chars`;
			if (field.maxLength && str.length > field.maxLength)
				errors[field.id] = `Max ${field.maxLength} chars`;
		}

		if (field.type === 'checkboxes') {
			const selected = Array.isArray(value) ? (value as string[]) : [];
			if (field.minChecked !== undefined && selected.length < field.minChecked)
				errors[field.id] = `Select at least ${field.minChecked}`;
			if (field.maxChecked !== undefined && selected.length > field.maxChecked)
				errors[field.id] = `Select at most ${field.maxChecked}`;
		}

		if (field.type === 'rating') {
			const num = typeof value === 'number' ? value : undefined;
			if (num !== undefined) {
				if (field.min !== undefined && num < field.min)
					errors[field.id] = `Min ${field.min}`;
				if (num > field.scale) errors[field.id] = `Max ${field.scale}`;
			}
		}
	}
	return errors;
}
