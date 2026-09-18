import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Node, not Bun, despite Bun being the local toolchain.
		//
		// experimental_bun1.x builds and deploys but 500s on every request. The
		// adapter traces dependencies under Node, so for a package whose exports
		// map has a "bun" condition it bundles the branch Node resolves and omits
		// the one Bun asks for at runtime. @panva/hkdf, reached through
		// @auth/core/jwt, points "bun" at dist/web while Node takes dist/node:
		// only dist/node ships, and Bun then cannot resolve the module at all.
		//
		// Naming a runtime at all is what keeps the build working here: left
		// unset, the adapter infers one from whichever Node built the project and
		// refuses anything outside 20, 22 and 24.
		adapter: adapter({ runtime: 'nodejs22.x' })
	}
};

export default config;
