/** @format */
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import DarkModeToggle from '@/components/theme/DarkModeToggle';

export const metadata: Metadata = {
	title: 'Form Builder',
	description: 'Forms, responses, analytics',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang='en'
			data-theme='dark'>
			<body className='bg-app text-app'>
				<ThemeProvider>
					<header className='sticky top-0 z-10 border-b border-app card'>
						<div className='max-w-3xl mx-auto px-4 py-3 flex items-center justify-between'>
							<div className='font-semibold'>Form Builder</div>
							<DarkModeToggle />
						</div>
					</header>
					<main className='min-h-screen'>{children}</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
