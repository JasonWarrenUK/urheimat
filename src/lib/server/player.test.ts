import { describe, expect, it } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { requirePlayerId } from './player';

type SessionUser = { id?: unknown; name?: string };

function eventWith(user: SessionUser | undefined | null): RequestEvent {
	return {
		locals: { auth: async () => (user === undefined ? null : { user, expires: '' }) }
	} as unknown as RequestEvent;
}

describe('requirePlayerId', () => {
	it('returns the id of a signed-in player', async () => {
		await expect(requirePlayerId(eventWith({ id: 'abc123' }))).resolves.toBe('abc123');
	});

	it('rejects a request with no session', async () => {
		await expect(requirePlayerId(eventWith(undefined))).rejects.toMatchObject({ status: 401 });
	});

	it('rejects a session whose user has no id', async () => {
		await expect(requirePlayerId(eventWith({ name: 'Nameless' }))).rejects.toMatchObject({
			status: 401
		});
	});

	// `{ playerId: undefined }` is read by the MongoDB driver as `{ playerId: null }`,
	// which matches every document missing the field. These must never reach a query.
	it('rejects an empty-string id rather than letting it reach a query', async () => {
		await expect(requirePlayerId(eventWith({ id: '' }))).rejects.toMatchObject({ status: 401 });
	});

	it('rejects a non-string id rather than letting it reach a query', async () => {
		await expect(requirePlayerId(eventWith({ id: 42 }))).rejects.toMatchObject({ status: 401 });
	});

	// Auth.js throws MissingSecret when unconfigured, which would otherwise
	// surface as a 500 on every protected route in a fresh local checkout.
	it('answers 401 rather than 500 when the auth lookup itself throws', async () => {
		const event = {
			locals: {
				auth: async () => {
					throw new Error('MissingSecret');
				}
			}
		} as unknown as RequestEvent;

		await expect(requirePlayerId(event)).rejects.toMatchObject({ status: 401 });
	});
});
