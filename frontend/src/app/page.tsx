/** @format */

import Image from 'next/image';

export default function Home() {
	return (
		<div className='font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
			<main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start'>
				<Image
					className='dark:invert'
					src='/next.svg'
					alt='Next.js logo'
					width={180}
					height={38}
					priority
				/>

				<div className='flex gap-4 items-center flex-col sm:flex-row'>
					
					<a
						className='rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto'
						href='/builder'>
						Open Form Builder
					</a>
				</div>
			</main>
		</div>
	);
}
