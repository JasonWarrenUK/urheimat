import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/sets';
import { newGame, sameCustom, sameSet } from './engine';
import { activeIn, isActiveIn } from './predicates';
import { SLOTS } from './slots';

describe('set-valued parts', () => {
	it('ends a sequence at an empty set: later stages go dormant', () => {
		expect(activeIn(fixtures.takers, fixtures.godsOnly)).toEqual([0, 1]);
		expect(activeIn(fixtures.takers, fixtures.godsThenChief)).toEqual([0, 1, 2]);
	});
	it('keeps the set a dormant stage held', () => {
		expect(fixtures.chiefAndRest[2]).toEqual([0]);
		expect(isActiveIn(fixtures.takers, fixtures.chiefAndRest, 2)).toBe(true);
	});
	it('holds a reading predicate when some member matches', () => {
		const onlyIfGodsReading = {
			...fixtures.takers,
			features: fixtures.takers.features.map((f, i) =>
				i === 1 ? { ...f, applies: { part: 'taker', stage: 'previous' as const, has: { verb: 'offer' as const } } } : f
			)
		};
		expect(isActiveIn(onlyIfGodsReading, [[0, 1], [1], []], 1)).toBe(true);
		expect(isActiveIn(onlyIfGodsReading, [[1, 2], [1], []], 1)).toBe(false);
	});
	it('compares sets without regard to order', () => {
		expect(sameSet([1, 2], [2, 1])).toBe(true);
		expect(sameSet([1], [1, 2])).toBe(false);
		expect(sameSet([], [])).toBe(true);
		expect(sameCustom(fixtures.chiefAndRest, [[2, 1], [0], [0]])).toBe(true);
		expect(sameCustom(fixtures.chiefAndRest, fixtures.restThenChief)).toBe(false);
	});

	it('generates substance takers inside their declared size ranges, distinct, with round one never empty', () => {
		const si = SLOTS.findIndex((s) => s.id === 'substance');
		const takers = SLOTS[si].features.flatMap((f, fi) => (f.size ? [{ f, fi }] : []));
		expect(takers).toHaveLength(3);
		for (let seed = 1; seed <= 100; seed++) {
			const held = newGame(seed).ancestral[si];
			takers.forEach(({ f, fi }, round) => {
				expect(held[fi].length).toBeLessThanOrEqual(f.size![1]);
				expect(held[fi].length).toBeGreaterThanOrEqual(f.size![0]);
				expect(new Set(held[fi]).size).toBe(held[fi].length);
				if (round === 0) expect(held[fi].length).toBeGreaterThan(0);
			});
		}
	});
});
