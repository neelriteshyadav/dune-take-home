/** @format */
'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

export default function DarkModeToggle() {
	const { theme, toggle } = useTheme();
	const label = theme === 'dark' ? 'Light' : 'Dark';
	return (
		<button
			type='button'
			className='px-3 py-1 rounded border border-app text-app hover:opacity-90'
			onClick={toggle}
			aria-label='Toggle color theme'
			title={`Switch to ${label} mode`}>
			{label} mode
		</button>
	);
}
