import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/demography';
import type { Culture, GameState } from '$lib/types';
import { birthRate, deathRate, demographicNoise, stepHealth, stepNumbers, violenceDeaths } from './demography';
import { begin, newGame, rngFrom, startTiles } from './engine';
import { DEATHS } from './figures';
import { DEMOGRAPHY, SLOTS } from './slots';

function fresh(): { st: GameState; c: Culture } {
	const st = newGame(fixtures.seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	const c = st.cultures[st.playerId as number];
	// A small band, so crowding and the cap on deaths do not hide the effects under test.
	c.condition.numbers = 50;
	return { st, c };
}

// Make the band hold a value, whichever stage of the part it is in.
function hold(c: Culture, spec: { custom: string; part: string; value: string }): void {
	const si = SLOTS.findIndex((s) => s.id === spec.custom);
	const fi = SLOTS[si].features.findIndex((f) => f.id === spec.part || f.id.endsWith(`.${spec.part}`));
	c.traits[si][fi] = [SLOTS[si].features[fi].values.findIndex((v) => v.id === spec.value)];
}
function drop(c: Culture, spec: { custom: string; part: string }): void {
	const si = SLOTS.findIndex((s) => s.id === spec.custom);
	const fi = SLOTS[si].features.findIndex((f) => f.id === spec.part || f.id.endsWith(`.${spec.part}`));
	c.traits[si][fi] = [SLOTS[si].features[fi].values.findIndex((v) => !(v.about ?? []).includes('violence'))];
}

describe('births', () => {
	it('rise with adequacy up to a cap and fall with hunger', () => {
		const { c } = fresh();
		expect(birthRate(c, 1)).toBeGreaterThan(birthRate(c, 0.5));
		expect(birthRate(c, 1.2)).toBeGreaterThan(birthRate(c, 1));
		expect(birthRate(c, 5)).toBe(birthRate(c, 1.2));
		expect(birthRate(c, 0)).toBe(0);
	});
	it('rise with health and morale and with settledness', () => {
		const { c } = fresh();
		const base = birthRate(c, 1);
		c.condition.health = 10;
		expect(birthRate(c, 1)).toBeGreaterThan(base);
		c.condition.health = 7;
		c.condition.morale = 10;
		expect(birthRate(c, 1)).toBeGreaterThan(base);
		c.condition.morale = 7;
		c.condition.seatSteps = 10;
		expect(birthRate(c, 1)).toBeGreaterThan(base);
	});
});

describe('deaths', () => {
	it('rise with hunger, sickness and crowding', () => {
		const { st, c } = fresh();
		const base = deathRate(st, c, 1, 100);
		expect(deathRate(st, c, 0.5, 100)).toBeGreaterThan(base);
		c.condition.health = 2;
		expect(deathRate(st, c, 1, 100)).toBeGreaterThan(base);
		c.condition.health = 7;
		c.condition.numbers = 300;
		expect(deathRate(st, c, 1, 100)).toBeGreaterThan(base);
	});
	it('cannot take more than everyone', () => {
		const { st, c } = fresh();
		expect(deathRate(st, c, 0, 1)).toBeLessThanOrEqual(1);
	});
	it('rise for a dangerous way of life and not for a band without the custom', () => {
		const { st, c } = fresh();
		drop(c, fixtures.raid);
		const calm = deathRate(st, c, 1, 100);
		hold(c, fixtures.raid);
		const raiding = deathRate(st, c, 1, 100);
		expect(raiding).toBeGreaterThan(calm);
		c.absent.push('youth');
		expect(deathRate(st, c, 1, 100)).toBe(calm);
	});
	it('counts a violence hook as zero until events exist', () => {
		const { st, c } = fresh();
		expect(violenceDeaths(st, c)).toBe(0);
	});
});

describe('numbers and health', () => {
	it('grows a fed healthy band and shrinks a starving one', () => {
		const { st, c } = fresh();
		c.condition.health = 10;
		c.condition.morale = 10;
		const fed = stepNumbers(100, birthRate(c, 1), deathRate(st, c, 1, 1000));
		expect(fed).toBeGreaterThan(100);
		const starving = stepNumbers(100, birthRate(c, 0.2), deathRate(st, c, 0.2, 1000));
		expect(starving).toBeLessThan(100);
		expect(stepNumbers(3, 0, 5)).toBe(0);
	});
	it('moves health toward what the band was fed, not all at once', () => {
		const healthy = stepHealth(7, 1);
		expect(healthy).toBeGreaterThan(7);
		expect(healthy).toBeLessThan(10);
		expect(stepHealth(7, 0.3)).toBeLessThan(7);
		expect(stepHealth(10, 1)).toBe(10);
	});
});

describe('chance', () => {
	const spread = (numbers: number, draws = 400): number => {
		const rng = rngFrom(7);
		const noise = Array.from({ length: draws }, () => demographicNoise(rng, numbers, 1.1, 0.9));
		const mean = noise.reduce((a, b) => a + b, 0) / draws;
		return Math.sqrt(noise.reduce((a, b) => a + (b - mean) ** 2, 0) / draws);
	};
	it('swings a small band far more than a large one, by about the square root of its size', () => {
		const small = spread(25),
			large = spread(2500);
		expect(small).toBeGreaterThan(large * 5);
		expect(large).toBeCloseTo(Math.sqrt(2 / 2500), 1);
	});
	it('is repeatable from the seed, and never kills more than everyone', () => {
		expect(spread(40)).toBe(spread(40));
		const rng = rngFrom(1);
		for (let i = 0; i < 200; i++) expect(demographicNoise(rng, 3, 1.1, 0.9)).toBeGreaterThanOrEqual(-1);
		expect(stepNumbers(10, 1, 2, -1)).toBe(0);
	});
});

describe('the table', () => {
	it('names real customs, and every row says what it moves and is marked unverified or sourced', () => {
		DEMOGRAPHY.forEach((row) => {
			expect(SLOTS.some((s) => s.id === row.when.custom)).toBe(true);
			expect(row.births !== undefined || row.deaths !== undefined).toBe(true);
			expect(row.source !== undefined || row.unverified === true).toBe(true);
		});
		expect(DEATHS.base).toBeGreaterThan(0);
	});
});
