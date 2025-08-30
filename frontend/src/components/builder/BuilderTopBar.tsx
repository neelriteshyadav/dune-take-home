/** @format */
'use client';

import React from 'react';

type Props = {
	title: string;
	setTitle: (v: string) => void;
	mode: 'build' | 'preview';
	setMode: (m: 'build' | 'preview') => void;
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

	return (
		<div className='mb-6'>
			<div className='flex items-start justify-between gap-3'>
				<input
					className='text-2xl font-semibold bg-transparent border-b px-1 py-1 w-full
                     border-app focus:outline-none focus:border-app text-app placeholder:text-muted'
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder='Untitled Form'
				/>
				<div className='flex flex-wrap gap-2 items-center justify-end'>
					<button
						type='button'
						className={`btn btn-outline ${
							mode === 'build' ? 'btn-active' : ''
						}`}
						onClick={() => setMode('build')}>
						Build
					</button>
					<button
						type='button'
						className={`btn btn-outline ${
							mode === 'preview' ? 'btn-active' : ''
						}`}
						onClick={() => setMode('preview')}>
						Preview
					</button>
					<button
						type='button'
						className='btn btn-outline'
						onClick={onLoadDraft}>
						Load draft
					</button>
					<button
						type='button'
						className='btn'
						onClick={onPublish}>
						Publish
					</button>
					<button
						type='button'
						className='btn btn-ghost'
						onClick={onClear}>
						Clear
					</button>
				</div>
			</div>

			{shareUrl && (
				<div className='mt-3 border rounded-lg p-3 card'>
					<div className='text-sm font-medium mb-1 text-app'>
						Shareable link
					</div>
					<div className='flex gap-2'>
						<input
							className='input'
							value={shareUrl}
							readOnly
						/>
						<button
							type='button'
							className='btn shrink-0'
							onClick={copy}>
							Copy
						</button>
					</div>
					<div className='mt-1 text-xs text-muted'>
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

			<div className='mt-2 text-xs text-muted h-4'>
				{lastSavedAt
					? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
					: ''}
			</div>
		</div>
	);
}
