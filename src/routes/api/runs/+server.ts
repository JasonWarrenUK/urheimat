import { json } from '@sveltejs/kit';
import { requirePlayerId } from '$lib/server/player';
import { listRuns } from '$lib/server/runs';
import type { RequestHandler } from './$types';

/** The signed-in player's own runs, most recently updated first. */
export const GET: RequestHandler = async (event) => {
	const playerId = await requirePlayerId(event);
	return json({ runs: await listRuns(playerId) });
};
