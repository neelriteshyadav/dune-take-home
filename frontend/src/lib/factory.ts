/** @format */

import { AnyField, FieldType } from './types';

export function generateId() {
	return Math.random().toString(36).slice(2, 10);
}

export function createField(type: FieldType): AnyField {
	const id = generateId();
	if (type === 'text')
		return {
			id,
			type: 'text',
			label: 'Text',
			required: false,
			placeholder: '',
		};
	if (type === 'multipleChoice')
		return {
			id,
			type: 'multipleChoice',
			label: 'Multiple Choice',
			required: false,
			options: ['Option 1', 'Option 2'],
		};
	if (type === 'checkboxes')
		return {
			id,
			type: 'checkboxes',
			label: 'Checkboxes',
			required: false,
			options: ['Option A', 'Option B'],
			minChecked: 0,
		};
	return {
		id,
		type: 'rating',
		label: 'Rating',
		required: false,
		scale: 5,
		min: 0,
	};
}
