import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/sets';
import { newGame, sameCustom, sameSet } from './engine';
import { activeIn, effectiveReadings, isActiveIn, isShadowed } from './predicates';
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

	describe('readings that need another taker', () => {
		// Parts are [kind, round one, round two]; taker values are 0 the chief, 1 the priest.
		const verbs = (fv: number[][]) => effectiveReadings(fixtures.bindsToChief, fv, 0).map((r) => r.verb);
		it('drops a binding to the chief when the chief takes alone', () => {
			expect(verbs([[0], [0], []])).toEqual(['commune']);
		});
		it('keeps it when another group takes in the same round', () => {
			expect(verbs([[0], [0, 1], []])).toEqual(['bind', 'commune']);
		});
		it('keeps it when another group takes in a later round', () => {
			expect(verbs([[0], [0], [1]])).toEqual(['bind', 'commune']);
		});
		it('drops it when the others take only before the chief does', () => {
			expect(verbs([[0], [1], [0]])).toEqual(['commune']);
		});
		it('drops it when the chief takes in no round', () => {
			expect(verbs([[0], [1], []])).toEqual(['commune']);
		});
	});

	describe('a sacrifice that shadows substance', () => {
		const sac = SLOTS.findIndex((s) => s.id === 'sacrifice');
		const sub = SLOTS.findIndex((s) => s.id === 'substance');
		const at = (si: number, part: string, id: string) => {
			const fi = SLOTS[si].features.findIndex((f) => f.id === part);
			return { fi, vi: SLOTS[si].features[fi].values.findIndex((v) => v.id === id) };
		};
		// A band whose sacrifice offers `offering` in `manner`, and whose substance is `kind` taken `how` by `takers` in round one.
		const band = (offering: string, manner: string, kind: string, how: string, takers: string[]) => {
			const traits = newGame(1).ancestral.map((slot) => slot.map((v) => v.slice()));
			const set = (si: number, part: string, ids: string[]) => {
				const fi = SLOTS[si].features.findIndex((f) => f.id === part);
				traits[si][fi] = ids.map((id) => at(si, part, id).vi);
			};
			set(sac, 'offering', [offering]);
			set(sac, 'manner', [manner]);
			set(sub, 'kind', [kind]);
			set(sub, 'manner', [how]);
			set(sub, 's1.taker', takers);
			set(sub, 's2.taker', []);
			set(sub, 's3.taker', []);
			return traits;
		};
		it('shadows when an animal feast matches meat eaten by a human group', () => {
			expect(isShadowed(band('animal/herd', 'feast', 'animal/meat', 'eaten', ['tribe/rest']), sac)).toBe(true);
			expect(isShadowed(band('animal/wild', 'feast', 'animal/meat', 'eaten', ['chief']), sac)).toBe(true);
		});
		it('shadows when a drink feast matches a drink drunk', () => {
			expect(isShadowed(band('liquid', 'feast', 'drink/mead', 'drunk', ['chief/family']), sac)).toBe(true);
		});
		it('unhides when substance moves away from the match', () => {
			expect(isShadowed(band('animal/herd', 'feast', 'drink/wine', 'eaten', ['tribe/rest']), sac)).toBe(false);
			expect(isShadowed(band('animal/herd', 'feast', 'animal/meat', 'smeared', ['tribe/rest']), sac)).toBe(false);
			expect(isShadowed(band('animal/herd', 'feast', 'animal/meat', 'eaten', ['gods']), sac)).toBe(false);
		});
		it('unhides when sacrifice takes a concrete value outside the rule', () => {
			expect(isShadowed(band('animal/herd', 'burnt', 'animal/meat', 'eaten', ['tribe/rest']), sac)).toBe(false);
			expect(isShadowed(band('harvest', 'feast', 'animal/meat', 'eaten', ['tribe/rest']), sac)).toBe(false);
		});
		it('is never true for a custom that shadows nothing', () => {
			expect(isShadowed(newGame(1).ancestral, sub)).toBe(false);
		});
	});
});
