import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/engine';
import { begin, defaultOrders, endEra, newGame, reconstruct, startTiles } from './engine';
import { FEATURE_COUNT } from './slots';

describe('engine', () => {
	it('runs a full game deterministically for a given seed', () => {
		const state = newGame(fixtures.seed);
		const tiles = startTiles(state);
		begin(state, tiles[0].x, tiles[0].y);

		expect(state.cultures).toHaveLength(6);
		expect(state.era).toBe(1);

		for (let i = 0; i < fixtures.eraCount; i++) {
			endEra(state, defaultOrders());
		}

		expect(state.over).toBe(true);

		const result = reconstruct(state);
		expect(result.max).toBe(FEATURE_COUNT * 2);
		expect(result.counts.correct + result.counts.wrong + result.counts.lost).toBe(FEATURE_COUNT);
		expect(result.total).toBeLessThanOrEqual(result.max);
	});

	it('produces the same outcome for the same seed', () => {
		function run(seed: number) {
			const state = newGame(seed);
			const tiles = startTiles(state);
			begin(state, tiles[0].x, tiles[0].y);
			for (let i = 0; i < fixtures.eraCount; i++) endEra(state, defaultOrders());
			return reconstruct(state).total;
		}

		expect(run(fixtures.seed)).toBe(run(fixtures.seed));
	});
});
