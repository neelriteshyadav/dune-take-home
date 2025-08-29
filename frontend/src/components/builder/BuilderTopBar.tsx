/** @format */
'use client';

import React from 'react';

type Props = {
	title: string;
	setTitle: (v: string) => void;
	mode: 'build' | 'preview';
	setMode: (m: 'build' | 'preview') => void;
	onSaveDraft: () => void;
	onLoadDraft: () => void;
	onClear: () => void;
	onPublish: () => void;
	lastSavedAt: number | null;
	shareUrl: string | null;
};

export default function BuilderTopBar({
	title,
	setTitle,
	mode,
	setMode,
	onSaveDraft,
	onLoadDraft,
	onClear,
	onPublish,
	lastSavedAt,
	shareUrl,
}: Props) {
	const copy = async () => {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
		} catch {}
	};

	const btn = (label: string, active: boolean, onClick: () => void) => (
		<button
			type='button'
			className={[
				'px-3 py-1 rounded border transition',
				'border-zinc-700 text-zinc-200 hover:bg-zinc-800',
				active ? 'bg-zinc-100 text-zinc-900' : '',
			].join(' ')}
			onClick={onClick}
			aria-pressed={active}>
			{label}
		</button>
	);

	return (
		<div className='mb-6'>
			<div className='flex items-start justify-between gap-3'>
				<input
					className='text-2xl font-semibold bg-transparent border-b px-1 py-1 w-full
                     border-zinc-700 focus:outline-none focus:border-zinc-300 text-zinc-50 placeholder-zinc-400'
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder='Form title'
				/>
				<div className='flex flex-wrap gap-2 items-center justify-end'>
					{btn('Build', mode === 'build', () => setMode('build'))}
					{btn('Preview', mode === 'preview', () => setMode('preview'))}
					{btn('Clear', false, onClear)}
					{btn('Save draft', false, onSaveDraft)}
					{btn('Load draft', false, onLoadDraft)}
					{btn('Publish', false, onPublish)}
				</div>
			</div>

			{shareUrl && (
				<div className='mt-3 border rounded-lg p-3 bg-zinc-900 border-zinc-700'>
					<div className='text-sm font-medium mb-1 text-zinc-200'>
						Shareable link
					</div>
					<div className='flex gap-2'>
						<input
							className='border rounded px-2 py-1 w-full text-sm bg-transparent
                         border-zinc-700 text-zinc-200'
							value={shareUrl}
							readOnly
						/>
						<button
							type='button'
							className='px-3 py-1 rounded border shrink-0 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
							onClick={copy}>
							Copy
						</button>
					</div>
					<div className='mt-1 text-xs text-zinc-400'>
						Fill: <code className='px-1'>{shareUrl}</code> · Analytics:{' '}
						<a
							className='underline'
							href={`${shareUrl}/analytics`}
							target='_blank'
							rel='noreferrer'>
							{shareUrl}/analytics
						</a>
					</div>
				</div>
			)}

			<div className='mt-2 text-xs text-zinc-400 h-4'>
				{lastSavedAt
					? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
					: ''}
			</div>
		</div>
	);
}
