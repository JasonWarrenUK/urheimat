import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/engine';
import { begin, defaultOrders, endEra, newGame, reconstruct, render, startTiles } from './engine';
import { activeCount } from './predicates';
import { SLOTS } from './slots';

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

		// Only the parts live in the ancestral culture are scored.
		const result = reconstruct(state);
		const scored = activeCount(state.ancestral);
		expect(result.max).toBe(scored * 2);
		expect(result.counts.correct + result.counts.wrong + result.counts.lost).toBe(scored);
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

	it('never reconstructs a funeral stage the ancestral people did not have', () => {
		// Pick a seed whose ancestral funeral has fewer than three stages; a lost later act must not render as '…'.
		const funeral = SLOTS.findIndex((s) => s.id === 'funeral');
		const stages = (text: string) => text.split('; then ').length;
		const seed = Array.from({ length: 200 }, (_, i) => i + 1).find((n) => stages(render(funeral, newGame(n).ancestral[funeral])) < 3);
		expect(seed).toBeDefined();
		const state = newGame(seed!);
		const tiles = startTiles(state);
		begin(state, tiles[0].x, tiles[0].y);
		for (let i = 0; i < fixtures.eraCount; i++) endEra(state, defaultOrders());
		const entry = reconstruct(state).entries[funeral];
		expect(stages(render(funeral, entry.recFv))).toBeLessThanOrEqual(stages(render(funeral, state.ancestral[funeral])));
		expect(render(funeral, entry.recFv)).not.toContain('… …');
	});
});
