import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/engine';
import { begin, defaultStep, endEra, newGame, reconstruct, render, startTiles } from './engine';
import { activeCount, activeIn } from './predicates';
import { SLOTS } from './slots';

describe('engine', () => {
	it('runs a full game deterministically for a given seed', () => {
		const state = newGame(fixtures.seed);
		const tiles = startTiles(state);
		begin(state, tiles[0].x, tiles[0].y);

		expect(state.cultures).toHaveLength(6);
		expect(state.era).toBe(1);

		for (let i = 0; i < fixtures.eraCount; i++) {
			endEra(state, defaultStep());
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
			for (let i = 0; i < fixtures.eraCount; i++) endEra(state, defaultStep());
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
		for (let i = 0; i < fixtures.eraCount; i++) endEra(state, defaultStep());
		const entry = reconstruct(state).entries[funeral];
		// A wrongly recovered act can imply a later stage the truth lacked; that stage shows as lost.
		// A stage dormant in the recovery is dropped outright, and a lost mark appears exactly once per
		// live part the scholars could not recover: never for a dormant one.
		const live = activeIn(SLOTS[funeral], entry.recFv as number[][]);
		const liveStages = new Set(live.map((fi) => SLOTS[funeral].features[fi].stage)).size;
		const lost = live.filter((fi) => entry.recFv[fi] === null).length;
		expect(stages(render(funeral, entry.recFv))).toBe(liveStages);
		expect((render(funeral, entry.recFv).match(/…/g) ?? []).length).toBe(lost);
	});
});
