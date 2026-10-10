import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/engine';
import { begin, defaultStep, endEra, newGame, startTiles } from './engine';
import { ADULT, ageOf, alive, leaderOf, yearOf } from './family';
import type { Culture, GameState } from '$lib/types';

function run(seed: number, steps = fixtures.eraCount): GameState {
	const st = newGame(seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	for (let i = 0; i < steps; i++) endEra(st, defaultStep());
	return st;
}

const everyBand = (st: GameState, f: (c: Culture) => void) => st.cultures.forEach(f);

describe('leaders and families', () => {
	it('gives every band a living adult leader at every step', { timeout: 60000 }, () => {
		for (let seed = 1; seed <= 40; seed++) {
			const st = newGame(seed);
			const t = startTiles(st);
			begin(st, t[0].x, t[0].y);
			for (let step = 0; step < 15; step++) {
				const year = yearOf(st.era);
				everyBand(st, (c) => {
					if (!c.alive) return;
					const l = leaderOf(c);
					expect(alive(l, year)).toBe(true);
					expect(ageOf(l, year)).toBeGreaterThanOrEqual(ADULT);
				});
				endEra(st, defaultStep());
			}
		}
	});

	it('draws every life inside the rule: death from 36 to 75, children from 18 while under 45', () => {
		const st = run(fixtures.seed, 15);
		everyBand(st, (c) =>
			c.family.forEach((p) => {
				const lifespan = p.dies - p.born;
				expect(lifespan).toBeGreaterThanOrEqual(36);
				expect(lifespan).toBeLessThanOrEqual(75);
				expect(p.children[0]).toBe(ADULT);
				p.children.forEach((a, i) => {
					expect(a).toBeLessThan(45);
					if (i) expect(a - p.children[i - 1]).toBeGreaterThanOrEqual(2);
				});
				if (p.parent !== null) {
					const parent = c.family.find((q) => q.id === p.parent)!;
					expect(parent.children.map((a) => parent.born + a)).toContain(p.born);
					expect(p.generation).toBe(parent.generation + 1);
				}
			})
		);
	});

	it('keeps ids unique within a band, including after a daughter band takes part of the tree', () => {
		const st = run(fixtures.seed, 15);
		expect(st.cultures.length).toBeGreaterThan(6); // at least one split happened
		everyBand(st, (c) => {
			const ids = c.family.map((p) => p.id);
			expect(new Set(ids).size).toBe(ids.length);
			c.family.forEach((p) => {
				if (p.parent !== null) expect(ids).toContain(p.parent);
			});
		});
	});

	it('is deterministic for a seed', () => {
		const a = run(fixtures.seed, 6), b = run(fixtures.seed, 6);
		expect(a.cultures.map((c) => [c.leader, c.family.map((p) => `${p.name}:${p.born}:${p.dies}`).join(' ')])).toEqual(
			b.cultures.map((c) => [c.leader, c.family.map((p) => `${p.name}:${p.born}:${p.dies}`).join(' ')])
		);
	});
});
