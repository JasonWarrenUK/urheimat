import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/condition';
import type { GameState, Storylet } from '$lib/types';
import { conditionStep, daughterCondition, liveTier, numbersTier, readStrand, trendOf, writeStrand } from './condition';
import { begin, defaultStep, endEra, newGame, startTiles } from './engine';
import { ladderStep } from './ladder';
import { record } from './history';
import { apply, fire, holds } from './storylets';

// The stud's behaviour is placeholder; these tests pin the contracts that stay: where each strand
// lives, how it is read and written, and how a ladder route reaches a storylet.

function fresh(seed = fixtures.seed): GameState {
	const st = newGame(seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	return st;
}
const player = (st: GameState) => st.cultures[st.playerId as number];

describe('reading and writing strands', () => {
	it('reads stored strands, derives food and derives standing as the mean regard', () => {
		const st = fresh(),
			c = player(st);
		expect(readStrand(st, c, 'numbers')).toBe(c.condition.numbers);
		expect(readStrand(st, c, 'standing')).toBe(0);
		c.condition.standing = { 1: 2, 2: 4 };
		expect(readStrand(st, c, 'standing')).toBe(3);
		expect(readStrand(st, c, 'food')).toBeGreaterThan(0);
	});
	it('writes the factors, clamps what has a range and records standing on the target against the source', () => {
		const st = fresh(),
			c = player(st),
			other = st.cultures[1];
		writeStrand(c, c, 'morale', 100);
		expect(c.condition.morale).toBe(10);
		writeStrand(c, c, 'numbers', -1000);
		expect(c.condition.numbers).toBe(0);
		writeStrand(other, c, 'standing', 2);
		expect(other.condition.standing[c.id]).toBe(2);
	});
	it('applies a strand consequence to the bands it names, and to none for a name nobody meets', () => {
		const st = fresh(),
			c = player(st);
		const before = c.condition.buffer;
		apply(st, c, [{ strand: 'buffer', by: 3 }]);
		expect(c.condition.buffer).toBe(before + 3);
		apply(st, c, [{ strand: 'standing', by: 1, of: ['parent'] }]);
		expect(Object.keys(c.condition.standing)).toEqual([]);
	});
	it('reads a trend against the last snapshot, steady when there is none', () => {
		const st = fresh(),
			c = player(st);
		expect(trendOf(st, c, 'health')).toBe('steady');
		record(st, c, { yield: 1, need: 1, adequacy: 1 });
		c.condition.health -= 1;
		expect(trendOf(st, c, 'health')).toBe('falling');
		expect(holds(st, c, { strand: { id: 'health', trend: 'falling' } })).toBe(true);
	});
});

describe('numbers and daughters', () => {
	it('places the headcount in a size tier', () => {
		expect(numbersTier(0)).toBe(0);
		expect(numbersTier(60)).toBe(2);
		expect(numbersTier(10000)).toBeGreaterThan(numbersTier(60));
	});
	it('takes a daughter band from the parent, who loses the same heads', () => {
		const c = player(fresh()),
			before = c.condition.numbers;
		const d = daughterCondition(c);
		expect(d.numbers + c.condition.numbers).toBe(before);
		expect(d.history).toEqual([]);
	});
	it('resets the seat counter on a whole-band move and cuts the buffer', () => {
		const st = fresh(),
			c = player(st);
		st.era = 3;
		c.condition.buffer = 8;
		conditionStep(st, c);
		const settled = c.condition.seatSteps;
		expect(settled).toBe(1);
		c.migrated = true;
		const held = c.condition.buffer;
		conditionStep(st, c);
		expect(c.condition.seatSteps).toBe(0);
		expect(c.condition.buffer).toBeLessThan(held);
	});
});

describe('the ladder engine', () => {
	// Hunger with the buffer spent feeds the example route, one strength a step.
	function starve(st: GameState) {
		const c = player(st);
		c.condition.buffer = 0;
		c.condition.numbers = 1000;
		return c;
	}
	it('climbs tiers while the feed holds, emits an event per change and forces the last tier', () => {
		const st = fresh(),
			c = starve(st);
		// A strained livelihood is how the stud makes a band hungry; force it by lowering adequacy.
		const feed = { id: 'hungry', kind: 'death' as const, feeds: [{ when: [], by: 1 }], tiers: [1, 2, 3], fade: 0.5, forced: { death: true as const } };
		const forced = [0, 1, 2].map(() => ladderStep(st, c, [feed]).map((r) => r.id));
		expect(forced).toEqual([[], [], ['hungry']]);
		expect(liveTier(c, 'hungry')).toBe(3);
		expect(st.bandEvents.filter((e) => e.kind === 'ladder').map((e) => e.reason)).toEqual(['hungry:1', 'hungry:2', 'hungry:3']);
	});
	it('fades a pull that nothing feeds', () => {
		const st = fresh(),
			c = starve(st);
		const route = { id: 'quiet', kind: 'death' as const, feeds: [{ when: [{ year: [9999, 9999] as [number, number] }], by: 1 }], tiers: [1], fade: 0.5, forced: { death: true as const } };
		c.condition.ladders.quiet = { strength: 1, tier: 1, refusals: 0 };
		ladderStep(st, c, [route]);
		expect(c.condition.ladders.quiet.strength).toBe(0.5);
		expect(liveTier(c, 'quiet')).toBe(0);
	});
	it('raises the storylet that holds a ladder tier, outside the situation cap', () => {
		const st = fresh(),
			c = player(st);
		const at = (route: string, tier: number): Storylet => ({ id: `${route}-${tier}`, text: route, when: [{ ladder: { route, tier } }], answers: [{ id: 'a', text: 'A', then: [] }] });
		c.condition.ladders.famine = { strength: 1, tier: 1, refusals: 0 };
		c.condition.ladders.shunned = { strength: 1, tier: 1, refusals: 0 };
		const pair: Storylet = { id: 'pair', text: 'both', when: [{ ladder: { route: 'famine', tier: 1 } }, { ladder: { route: 'shunned', tier: 1 } }], answers: [{ id: 'a', text: 'A', then: [] }] };
		const corpus = [at('famine', 1), at('shunned', 1), pair];
		expect(fire(st, c, corpus).map((s) => s.storylet)).toEqual(['pair']);
		expect(fire(st, c, [at('famine', 1), at('shunned', 1)]).map((s) => s.storylet)).toEqual(['famine-1', 'shunned-1']);
	});
	it('records a snapshot of a living band each step', () => {
		const st = fresh();
		for (let i = 0; i < 4; i++) endEra(st, defaultStep());
		const c = player(st);
		const steps = c.condition.history.map((h) => h.step);
		expect(steps.length).toBeGreaterThan(0);
		expect(steps).toEqual(steps.map((_, i) => i + 1));
		expect(c.condition.history[0].food.need).toBeGreaterThanOrEqual(0);
	});
});
