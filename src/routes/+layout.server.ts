import { authIsConfigured } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Without credentials there is no session to fetch and the game plays
	// anonymously, so don't let an auth lookup break local development.
	if (!authIsConfigured()) return { session: null, authEnabled: false };
	return { session: await event.locals.auth(), authEnabled: true };
};
