import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/sets';
import { sameCustom, sameSet } from './engine';
import { activeIn, isActiveIn } from './predicates';

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
});
