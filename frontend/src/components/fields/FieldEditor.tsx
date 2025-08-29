/** @format */
'use client';

import React from 'react';
import { AnyField } from '@/lib/types';
import TextEditor from './editors/TextEditor';
import MultipleChoiceEditor from './editors/MultipleChoiceEditor';
import CheckboxesEditor from './editors/CheckboxesEditor';
import RatingEditor from './editors/RatingEditor';

type Props = {
	field: AnyField;
	onChange: (partial: Partial<AnyField>) => void;
};

export default function FieldEditor({ field, onChange }: Props) {
	if (field.type === 'text')
		return (
			<TextEditor
				field={field}
				onChange={onChange}
			/>
		);
	if (field.type === 'multipleChoice')
		return (
			<MultipleChoiceEditor
				field={field}
				onChange={onChange}
			/>
		);
	if (field.type === 'checkboxes')
		return (
			<CheckboxesEditor
				field={field}
				onChange={onChange}
			/>
		);
	return (
		<RatingEditor
			field={field}
			onChange={onChange}
		/>
	);
}
