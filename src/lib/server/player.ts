import { error, type RequestEvent } from '@sveltejs/kit';
import type { Session } from '@auth/sveltekit';

/**
 * Resolve the signed-in player's id, or reject the request.
 *
 * MongoDB has no row-level security, so every query against runs and scores is
 * scoped by this id in the server route. A missing id must never reach a query:
 * `{ playerId: undefined }` is read by the driver as `{ playerId: null }`, which
 * matches every document that has no playerId field rather than matching none.
 */
export async function requirePlayerId(event: RequestEvent): Promise<string> {
	let session: Session | null = null;
	try {
		session = await event.locals.auth();
	} catch {
		// Auth.js throws rather than returning null when it is unconfigured (no
		// AUTH_SECRET) or the session store is unreachable. Nobody is signed in
		// either way, so answer 401 rather than leaking a 500.
		session = null;
	}

	const playerId = session?.user?.id;
	if (typeof playerId !== 'string' || playerId.length === 0) {
		error(401, 'Sign in to access your runs');
	}
	return playerId;
}
