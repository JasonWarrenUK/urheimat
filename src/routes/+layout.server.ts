import { authIsConfigured } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Without credentials there is no session to fetch and the game plays
	// anonymously, so don't let an auth lookup break local development.
	if (!authIsConfigured()) return { session: null, authEnabled: false };

	try {
		return { session: await event.locals.auth(), authEnabled: true };
	} catch {
		// Belt and braces. Auth.js already swallows adapter failures and returns
		// null, but authIsConfigured only checks that the variables are non-empty,
		// not that they are valid, so a config-level throw can still reach here.
		// The simulation runs client-side, so fall back to anonymous: a broken
		// session store should cost you the sign-in, not the game.
		return { session: null, authEnabled: true };
	}
};
