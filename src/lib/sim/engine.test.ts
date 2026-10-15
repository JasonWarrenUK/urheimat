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

describe('the step and condition', () => {
	const fresh = () => {
		const st = newGame(fixtures.seed);
		const t = startTiles(st);
		begin(st, t[0].x, t[0].y);
		return { st, c: st.cultures[st.playerId as number] };
	};

	it('ends the player band when no one is left, and says so', () => {
		const { st, c } = fresh();
		c.condition.numbers = 0;
		endEra(st, defaultStep());
		expect(c.alive).toBe(false);
		expect(c.diedEra).toBe(1);
		expect(st.playerDead).toBe(true);
		expect(st.bandEvents.some((e) => e.kind === 'death' && e.band === c.id && e.reason === 'no one left')).toBe(true);
	});

	it('ends a band whose ladder has refused its last tier', () => {
		const { st, c } = fresh();
		c.condition.numbers = 100;
		// The famine route has three tiers; a fourth refusal forces its outcome.
		c.condition.ladders.famine = { strength: 5, refusals: 3, surfaced: true, resolved: false };
		endEra(st, defaultStep());
		expect(c.alive).toBe(false);
		expect(st.playerDead).toBe(true);
		expect(st.bandEvents.some((e) => e.kind === 'death' && e.band === c.id && e.reason === 'famine')).toBe(true);
	});

	it('keeps one snapshot of every live band every step, with consecutive steps', () => {
		const { st } = fresh();
		for (let i = 0; i < 3; i++) endEra(st, defaultStep());
		st.cultures
			.filter((c) => c.bornEra === 0)
			.forEach((c) => {
				const steps = c.condition.history.map((h) => h.step);
				expect(steps).toEqual([1, 2, 3].slice(0, c.alive ? 3 : (c.diedEra as number)));
			});
	});

	it('sums two bands working one tile, so neighbours wear the same land faster than a lone band', () => {
		const wear = (neighbour: boolean): number => {
			const { st, c } = fresh();
			const others = st.cultures.filter((k) => !k.isPlayer);
			others.forEach((k) => (k.alive = false));
			const other = others[0];
			other.alive = neighbour;
			other.x = c.x + 2;
			other.y = c.y;
			st.map.tiles.forEach((row, y) => row.forEach((_, x) => (st.map.tiles[y][x] = 'steppe')));
			[c, other].forEach((band) => {
				band.absent = band.absent.filter((id) => id !== 'livelihood');
				const si = SLOTS.findIndex((s) => s.id === 'livelihood');
				const feature = (id: string) => SLOTS[si].features.findIndex((f) => f.id === id);
				const value = (part: string, id: string) => SLOTS[si].features[feature(part)].values.findIndex((v) => v.id === id);
				[1, 2, 3].forEach((stage, i) => {
					band.traits[si][feature(`s${stage}.source`)] = i === 0 ? [value('s1.source', 'hunt')] : [];
					band.traits[si][feature(`s${stage}.labour`)] = [value(`s${stage}.labour`, 'shared')];
				});
				band.condition.numbers = 4000;
			});
			endEra(st, defaultStep());
			return st.map.stocks[`${c.x + 1},${c.y}`]?.game ?? 1;
		};
		expect(wear(true)).toBeLessThan(wear(false));
	});
});
