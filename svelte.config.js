import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Bun on the serverless side too, not just the local toolchain. Still
		// flagged experimental by the adapter, hence the prefix.
		//
		// Naming it also fixes the local build: left unset, the adapter infers the
		// runtime from whatever Node built the project and refuses anything but
		// 20, 22 or 24.
		adapter: adapter({ runtime: 'experimental_bun1.x' })
	}
};

export default config;
