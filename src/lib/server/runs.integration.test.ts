import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { GameState } from '$lib/types';
import * as fixtures from '../../../tests/fixtures/runs';
import { begin, defaultStep, endEra, newGame, startTiles } from '$lib/sim/engine';
import { SCHEMA_VERSION, serialiseState } from '$lib/sim/serialise';

// 3PL.5: the runs access helpers against a real MongoDB. The unit tests beside this file mock the
// driver; these run every helper end to end on an in-memory mongod (mongodb-memory-server), so they
// need no running compose instance and never touch a developer's database.

// The driver reads the URI lazily on first use, so the mocked env can be filled in once the server
// is up; vi.mock is hoisted above the imports, hence the hoisted holder.
const held = vi.hoisted(() => ({ env: { MONGODB_URI: '', MONGODB_DB: 'urheimat-test' } }));
vi.mock('$env/dynamic/private', () => held);

import { getClient, runs } from './db';
import { deleteRun, listRuns, loadLatestRun, loadRun, saveRun } from './runs';

let server: MongoMemoryServer;

function play(seed: number, eras: number): GameState {
	const state = newGame(seed);
	const tiles = startTiles(state);
	begin(state, tiles[0].x, tiles[0].y);
	for (let i = 0; i < eras; i++) endEra(state, defaultStep());
	return state;
}

// Two saves inside one millisecond would tie on updatedAt, and the helpers order by it.
const tick = () => new Promise((r) => setTimeout(r, 5));

beforeAll(async () => {
	server = await MongoMemoryServer.create();
	held.env.MONGODB_URI = server.getUri();
}, 60000);

// Guarded so a failed start-up reports its own error rather than the client's missing URI.
afterAll(async () => {
	if (held.env.MONGODB_URI) await getClient().close();
	delete (globalThis as { __mongoClient?: unknown }).__mongoClient;
	if (server) await server.stop();
});

beforeEach(async () => {
	// Empty the collection rather than drop the database: a drop takes the indexes with it, and
	// ensureIndexes is memoised for the life of the module.
	await (await runs()).deleteMany({});
});

describe('indexes', () => {
	it('creates the unique player-and-seed index and the recency index on first use', async () => {
		const indexes = await (await runs()).listIndexes().toArray();
		expect(indexes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ key: { playerId: 1, seed: 1 }, unique: true }),
				expect.objectContaining({ key: { playerId: 1, updatedAt: -1 } })
			])
		);
	});
});

describe('saveRun', () => {
	it('inserts a run once and updates it in place on a later save', async () => {
		const state = play(fixtures.seed, 1);
		await saveRun(fixtures.player, state);
		const first = await (await runs()).findOne({ playerId: fixtures.player, seed: fixtures.seed });
		expect(first).not.toBeNull();
		expect(first?.schemaVersion).toBe(SCHEMA_VERSION);
		expect(first?.era).toBe(state.era);

		await tick();
		endEra(state, defaultStep());
		await saveRun(fixtures.player, state);

		const docs = await (await runs()).find({ playerId: fixtures.player }).toArray();
		expect(docs).toHaveLength(1);
		expect(docs[0]._id).toBe(first?._id);
		expect(docs[0].createdAt).toEqual(first?.createdAt);
		expect(docs[0].era).toBe(state.era);
		expect(docs[0].updatedAt.getTime()).toBeGreaterThan(first!.updatedAt.getTime());
	});

	it('keeps two players apart under the same seed', async () => {
		const theirs = play(fixtures.seed, 2);
		await saveRun(fixtures.player, play(fixtures.seed, 1));
		await saveRun(fixtures.otherPlayer, theirs);
		expect(await (await runs()).countDocuments({ seed: fixtures.seed })).toBe(2);
		expect((await loadRun(fixtures.otherPlayer, fixtures.seed))?.era).toBe(theirs.era);
	});
});

describe('loadRun', () => {
	it('round-trips a run, rng state included', async () => {
		const state = play(fixtures.seed, fixtures.eras);
		await saveRun(fixtures.player, state);
		const restored = await loadRun(fixtures.player, fixtures.seed);
		expect(restored).not.toBeNull();
		expect(restored?.era).toBe(state.era);
		expect(restored?.rng.state).toBe(state.rng.state);
		expect(restored?.cultures).toEqual(state.cultures);
		expect(restored?.map).toEqual(state.map);
	});

	it('returns null for a run nobody saved', async () => {
		expect(await loadRun(fixtures.player, fixtures.seed)).toBeNull();
	});

	it('returns null for a run saved under an older schema', async () => {
		const state = play(fixtures.seed, 1);
		const now = new Date();
		await (await runs()).insertOne({
			_id: crypto.randomUUID(),
			playerId: fixtures.player,
			seed: fixtures.seed,
			schemaVersion: SCHEMA_VERSION - 1,
			state: serialiseState(state),
			era: state.era,
			over: state.over,
			updatedAt: now,
			createdAt: now
		});
		expect(await loadRun(fixtures.player, fixtures.seed)).toBeNull();
	});
});

describe('listRuns and loadLatestRun', () => {
	it('list a player\'s runs newest first, named, and leave other players out', async () => {
		const older = play(fixtures.seed, 1);
		const newer = play(fixtures.otherSeed, 2);
		await saveRun(fixtures.player, older);
		await tick();
		await saveRun(fixtures.player, newer);
		await saveRun(fixtures.otherPlayer, play(fixtures.seed, 1));

		const listed = await listRuns(fixtures.player);
		expect(listed.map((r) => r.seed)).toEqual([fixtures.otherSeed, fixtures.seed]);
		expect(listed[0]).toMatchObject({ era: newer.era, over: false, peopleName: newer.peopleName });
		expect(listed[1].peopleName).toBe(older.peopleName);
		expect((await loadLatestRun(fixtures.player))?.seed).toBe(fixtures.otherSeed);
	});

	it('follow the most recent save, whichever run it was', async () => {
		await saveRun(fixtures.player, play(fixtures.seed, 1));
		await tick();
		await saveRun(fixtures.player, play(fixtures.otherSeed, 1));
		await tick();
		await saveRun(fixtures.player, play(fixtures.seed, 2));
		expect((await loadLatestRun(fixtures.player))?.seed).toBe(fixtures.seed);
		expect((await listRuns(fixtures.player)).map((r) => r.seed)).toEqual([fixtures.seed, fixtures.otherSeed]);
	});

	it('return nothing for a player with no runs', async () => {
		expect(await listRuns(fixtures.player)).toEqual([]);
		expect(await loadLatestRun(fixtures.player)).toBeNull();
	});
});

describe('deleteRun', () => {
	it('deletes a run once and reports the second attempt as nothing to delete', async () => {
		await saveRun(fixtures.player, play(fixtures.seed, 1));
		expect(await deleteRun(fixtures.player, fixtures.seed)).toBe(true);
		expect(await deleteRun(fixtures.player, fixtures.seed)).toBe(false);
		expect(await loadRun(fixtures.player, fixtures.seed)).toBeNull();
	});
});
