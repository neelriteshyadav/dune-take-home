/** @format */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };
const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('dark');

	useEffect(() => {
		// initial load: localStorage -> prefers-color-scheme -> default
		const stored =
			typeof window !== 'undefined'
				? (localStorage.getItem('theme') as Theme | null)
				: null;
		const prefersDark =
			typeof window !== 'undefined' &&
			window.matchMedia &&
			window.matchMedia('(prefers-color-scheme: dark)').matches;
		const next = stored || (prefersDark ? 'dark' : 'light');
		setThemeState(next);
		document.documentElement.setAttribute('data-theme', next);
	}, []);

	const setTheme = (t: Theme) => {
		setThemeState(t);
		if (typeof window !== 'undefined') localStorage.setItem('theme', t);
		document.documentElement.setAttribute('data-theme', t);
	};

	const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

	return (
		<ThemeCtx.Provider value={{ theme, setTheme, toggle }}>
			{children}
		</ThemeCtx.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeCtx);
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
	return ctx;
}
