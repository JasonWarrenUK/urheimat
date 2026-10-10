import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/similarity';
import * as baseline from '../../../tests/fixtures/drift-baseline';
import { begin, defaultStep, endEra, newGame, startTiles } from './engine';
import { DEFAULT_LENS, type Lens } from './lens';
import { entriesScore, setScore, termScore, valueScore } from './similarity';

const { opposites: opp } = fixtures;
const crit = DEFAULT_LENS.readings.fields.verb;
const withCombine = (combine: Lens['readings']['combine']): Lens['readings'] => ({ ...DEFAULT_LENS.readings, combine });

describe('terms', () => {
	it('scores equal words 1 and unrelated words 0', () => {
		expect(termScore('body', 'body', crit, opp)).toBe(1);
		expect(termScore('body', 'spirit', crit, opp)).toBe(0);
	});
	it('gives sibling credit for a shared path prefix', () => {
		expect(termScore('send/up', 'send/to', crit, opp)).toBe(crit.sibling);
	});
	it('lets opposite credit replace sibling credit', () => {
		expect(termScore('send/away', 'send/to', { ...crit, opposite: 0.1 }, opp)).toBe(0.1);
	});
	it('treats a missing target as matching only another missing target', () => {
		expect(termScore(undefined, undefined, crit, opp)).toBe(1);
		expect(termScore(undefined, 'gods', crit, opp)).toBe(0);
	});
});

describe('flat tag sets (about, material)', () => {
	it('uses Jaccard', () => {
		expect(setScore(['water'], ['water', 'earth'], DEFAULT_LENS.about, [])).toBe(0.5);
	});
	it('counts an opposite pair once, at opposite credit', () => {
		expect(setScore(['earth'], ['sky'], DEFAULT_LENS.about, opp)).toBe(DEFAULT_LENS.about.opposite);
	});
});

describe('material transitions', () => {
	it('scores what an act leaves apart from what a people believes', () => {
		const a = { material: [{ accepts: 'body', yields: 'body' }] },
			b = { material: [{ accepts: 'body', yields: 'body' }] },
			c = { material: [{ accepts: 'body', yields: 'ash' }] },
			d = { material: [{ accepts: 'bone', yields: 'ash' }] };
		expect(valueScore(a, b, DEFAULT_LENS, opp)).toBe(1000);
		expect(valueScore(a, c, DEFAULT_LENS, opp)).toBeGreaterThan(valueScore(a, d, DEFAULT_LENS, opp));
	});
	it('ignores a reading’s when: it is structural, not belief', () => {
		const a = { readings: [{ verb: 'destroy', object: 'body', when: ['ash'] }] },
			b = { readings: [{ verb: 'destroy', object: 'body' }] };
		expect(valueScore(a, b, DEFAULT_LENS, opp)).toBe(1000);
	});
});

describe('readings rules', () => {
	const a = fixtures.boat.readings!,
		b = fixtures.exposure.readings!;
	it('max takes the best single pair', () => {
		expect(entriesScore(a, b, withCombine('max'), opp)).toBeCloseTo(0.4 * 0.5 + 0.4 + 0.2);
	});
	it('meanAll is at most meanBest, which is at most max', () => {
		const all = entriesScore(a, b, withCombine('meanAll'), opp);
		const best = entriesScore(a, b, withCombine('meanBest'), opp);
		const max = entriesScore(a, b, withCombine('max'), opp);
		expect(all).toBeLessThanOrEqual(best);
		expect(best).toBeLessThanOrEqual(max);
	});
});

describe('values', () => {
	const values = [fixtures.boat, fixtures.bog, fixtures.mound, fixtures.exposure];
	it('scores a value 1000 against itself', () => {
		values.forEach((v) => expect(valueScore(v, v, DEFAULT_LENS, opp)).toBe(1000));
	});
	it('is symmetric, integral and within 0 to 1000', () => {
		values.forEach((a) =>
			values.forEach((b) => {
				const s = valueScore(a, b, DEFAULT_LENS, opp);
				expect(s).toBe(valueScore(b, a, DEFAULT_LENS, opp));
				expect(Number.isInteger(s)).toBe(true);
				expect(s).toBeGreaterThanOrEqual(0);
				expect(s).toBeLessThanOrEqual(1000);
			})
		);
	});
	it('scores an untagged value 0', () => {
		expect(valueScore(fixtures.boat, fixtures.untagged, DEFAULT_LENS, opp)).toBe(0);
	});
	it('puts bog (shares water) nearer boat than mound is', () => {
		expect(valueScore(fixtures.boat, fixtures.bog, DEFAULT_LENS, opp)).toBeGreaterThan(valueScore(fixtures.boat, fixtures.mound, DEFAULT_LENS, opp));
	});
});

describe('drift baseline', () => {
	// A snapshot: re-captured whenever the corpus changes. The untagged fallback was proven against
	// the pre-4SD.4 capture before any part was fully tagged.
	it('reproduces the captured traits for seeded passive runs', () => {
		Object.entries(baseline.traitsBySeed).forEach(([seed, expected]) => {
			const st = newGame(Number(seed));
			const t = startTiles(st)[0];
			begin(st, t.x, t.y);
			for (let i = 0; i < baseline.eraCount; i++) endEra(st, defaultStep());
			expect(st.cultures.map((c) => c.traits.flat().map((v) => v.join('+')).join('')).join('|')).toBe(expected);
		});
	});
});
