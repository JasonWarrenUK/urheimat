import { describe, expect, it } from 'vitest';
import type { GameState } from '$lib/types';
import * as fixtures from '../../../tests/fixtures/serialise';
import { begin, defaultOrders, endEra, newGame, reconstruct, startTiles } from './engine';
import { deserialiseState, SCHEMA_VERSION, serialiseState } from './serialise';

function play(seed: number, eras: number, state: GameState = newGame(seed)) {
	if (state.era === 0) {
		const tiles = startTiles(state);
		begin(state, tiles[0].x, tiles[0].y);
	}
	for (let i = 0; i < eras; i++) endEra(state, defaultOrders());
	return state;
}

describe('serialise', () => {
	it('round-trips a state through serialise and deserialise unchanged', () => {
		const state = play(fixtures.seed, fixtures.splitEra);

		const restored = deserialiseState(serialiseState(state), SCHEMA_VERSION);

		expect(restored).not.toBeNull();
		expect(restored?.cultures).toEqual(state.cultures);
		expect(restored?.map).toEqual(state.map);
		expect(restored?.era).toBe(state.era);
	});

	it('continues a deserialised run identically to the uninterrupted run', () => {
		const uninterrupted = play(fixtures.seed, fixtures.eraCount);
		const uninterruptedResult = reconstruct(uninterrupted);

		const paused = play(fixtures.seed, fixtures.splitEra);
		const restored = deserialiseState(serialiseState(paused), SCHEMA_VERSION);
		expect(restored).not.toBeNull();
		const resumed = play(fixtures.seed, fixtures.eraCount - fixtures.splitEra, restored as GameState);
		const resumedResult = reconstruct(resumed);

		expect(resumedResult.total).toBe(uninterruptedResult.total);
		expect(resumed.cultures).toEqual(uninterrupted.cultures);
	});

	it('rejects a document with a mismatched schema version', () => {
		const state = play(fixtures.seed, fixtures.splitEra);

		expect(deserialiseState(serialiseState(state), SCHEMA_VERSION + 1)).toBeNull();
	});
});
