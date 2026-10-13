import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/food';
import type { Culture, GameState, MapTerrain } from '$lib/types';
import { begin, newGame, startTiles } from './engine';
import { handsFor, heldSources, recognisedKinds, reserveCap, stepReserve, workReading } from './food';
import { SOURCES, WORKING_SHARE } from './figures';
import { SLOTS } from './slots';

const si = SLOTS.findIndex((s) => s.id === fixtures.livelihood.custom);
const gi = SLOTS.findIndex((s) => s.id === fixtures.gender.custom);
const fi = (id: string) => SLOTS[si].features.findIndex((f) => f.id === id);
const vi = (part: string, id: string) => SLOTS[si].features[fi(part)].values.findIndex((v) => v.id === id);

function fresh(): { st: GameState; c: Culture } {
	const st = newGame(fixtures.seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	return { st, c: st.cultures[st.playerId as number] };
}

// Hold exactly these sources, in stage order, each with its labour; recognise exactly these kinds.
function hold(c: Culture, sources: [string, string][], kinds = ['male', 'female']): void {
	[1, 2, 3].forEach((stage, i) => {
		const spec = sources[i];
		c.traits[si][fi(`s${stage}.source`)] = spec ? [vi(`s${stage}.source`, spec[0])] : [];
		c.traits[si][fi(`s${stage}.labour`)] = spec ? [vi(`s${stage}.labour`, spec[1])] : [];
	});
	c.traits[gi][0] = kinds.map((k) => SLOTS[gi].features[0].values.findIndex((v) => v.id === k));
}
const terrain = (st: GameState, c: Culture, t: MapTerrain) => (st.map.tiles[c.y][c.x] = t);

describe('what a band holds', () => {
	it('reads the held sources in stage order with their labour and how they keep', () => {
		const { c } = fresh();
		hold(c, [['crop/hoe', 'female'], ['herds/large', 'male']]);
		expect(heldSources(c).map((s) => [s.id, s.labour, s.keeps])).toEqual([
			['crop/hoe', 'female', 'high'],
			['herds/large', 'male', 'high']
		]);
	});
	it('holds nothing without the livelihood custom, and falls back to men and women without a gender custom', () => {
		const { c } = fresh();
		hold(c, [['hunt', 'male']]);
		c.absent.push('livelihood');
		expect(heldSources(c)).toEqual([]);
		c.absent.push('gender');
		expect(recognisedKinds(c)).toEqual(['male', 'female']);
	});
});

describe('hands', () => {
	it('splits the working band by kind and each kind among the sources that can use it', () => {
		const { c } = fresh();
		c.condition.numbers = 80;
		const workers = 80 * WORKING_SHARE;
		hold(c, [['crop/hoe', 'female'], ['herds/large', 'male']]);
		expect(handsFor(c, heldSources(c))).toEqual([workers / 2, workers / 2]);
		hold(c, [['crop/hoe', 'male'], ['herds/large', 'male']]);
		expect(handsFor(c, heldSources(c))).toEqual([workers / 4, workers / 4]);
		hold(c, [['crop/hoe', 'shared'], ['herds/large', 'male']]);
		const [shared, men] = handsFor(c, heldSources(c));
		expect(shared + men).toBeCloseTo(workers);
		expect(shared).toBeCloseTo(workers / 2 + workers / 4);
	});
	it('loses hands for every source that can use a kind when that kind shrinks', () => {
		const { c } = fresh();
		hold(c, [['crop/hoe', 'shared'], ['herds/large', 'female']]);
		c.condition.numbers = 80;
		const before = handsFor(c, heldSources(c));
		c.condition.numbers = 40;
		const after = handsFor(c, heldSources(c));
		expect(after[0]).toBeLessThan(before[0]);
		expect(after[1]).toBeLessThan(before[1]);
	});
	it('leaves a kind idle when no source can use it, and shares the working band across more kinds', () => {
		const { c } = fresh();
		c.condition.numbers = 80;
		hold(c, [['crop/hoe', 'male']], ['male', 'female', 'both', 'neither']);
		expect(handsFor(c, heldSources(c))).toEqual([(80 * WORKING_SHARE) / 4]);
	});
	it('works a source whose labour names an unrecognised kind with every recognised kind (interim)', () => {
		const { c } = fresh();
		c.condition.numbers = 80;
		hold(c, [['crop/hoe', 'male']], ['both', 'neither']);
		expect(handsFor(c, heldSources(c))).toEqual([80 * WORKING_SHARE]);
	});
});

describe('yield', () => {
	it('yields nothing below the minimum crew, then rises linearly to the ceiling', () => {
		const { st, c } = fresh();
		terrain(st, c, 'river');
		hold(c, [['crop/hoe', 'shared']]);
		const fig = SOURCES['crop/hoe'];
		const at = (hands: number) => {
			c.condition.numbers = (hands / WORKING_SHARE);
			return workReading(st, c).food.yield;
		};
		expect(at(fig.hands * fig.minCrew * 0.9)).toBe(0);
		const half = at(fig.hands * 0.5);
		expect(half).toBeGreaterThan(0);
		expect(at(fig.hands)).toBeCloseTo(half * 2);
		expect(at(fig.hands * 3)).toBeCloseTo(at(fig.hands));
	});
	it('gives the same source more on land that favours it than on land that resists it', () => {
		const { st, c } = fresh();
		hold(c, [['crop/plough', 'shared'], ['herds/large', 'shared']]);
		c.condition.numbers = 200;
		terrain(st, c, 'river');
		const river = workReading(st, c).sources.find((s) => s.id === 'crop/plough')!.yield;
		terrain(st, c, 'forest');
		const forest = workReading(st, c).sources.find((s) => s.id === 'crop/plough')!.yield;
		expect(river).toBeGreaterThan(forest * 2);
	});
	it('cuts a plough without large herds to a hand-hauled fraction', () => {
		const { st, c } = fresh();
		terrain(st, c, 'river');
		c.condition.numbers = 400;
		hold(c, [['crop/plough', 'shared'], ['herds/small', 'shared']]);
		const hauled = workReading(st, c).sources.find((s) => s.id === 'crop/plough')!.yield;
		hold(c, [['crop/plough', 'shared'], ['herds/large', 'shared']]);
		const drawn = workReading(st, c).sources.find((s) => s.id === 'crop/plough')!.yield;
		expect(hauled).toBeGreaterThan(0);
		expect(drawn).toBeGreaterThan(hauled * 2);
	});
	it('scales with a depleted pool and sets adequacy against the headcount', () => {
		const { st, c } = fresh();
		terrain(st, c, 'steppe');
		hold(c, [['herds/large', 'shared']]);
		c.condition.numbers = 30;
		const whole = workReading(st, c).food;
		st.map.stocks[`${c.x},${c.y}`] = { pasture: 0.5 };
		const worn = workReading(st, c).food;
		expect(worn.yield).toBeCloseTo(whole.yield * 0.5);
		expect(worn.adequacy).toBeCloseTo(worn.yield / 30);
	});
	it('reports no yield, and so none fed, for a band with no livelihood', () => {
		const { st, c } = fresh();
		c.absent.push('livelihood');
		expect(workReading(st, c).food.adequacy).toBe(0);
	});
});

describe('the reserve', () => {
	it('caps by how well the food keeps and how settled the band is', () => {
		const { st, c } = fresh();
		terrain(st, c, 'river');
		c.condition.numbers = 60;
		hold(c, [['crop/hoe', 'shared'], ['hunt', 'shared']]);
		const keeping = reserveCap(c, workReading(st, c));
		hold(c, [['hunt', 'shared']]);
		const meat = reserveCap(c, workReading(st, c));
		expect(keeping).toBeGreaterThan(meat);
		expect(meat).toBe(0);
		c.condition.seatSteps = 0;
		hold(c, [['crop/hoe', 'shared']]);
		const wandering = reserveCap(c, workReading(st, c));
		c.condition.seatSteps = 10;
		expect(reserveCap(c, workReading(st, c))).toBeGreaterThan(wandering);
	});
	it('banks a surplus up to the cap, spends the reserve on a deficit, and lets hunger through only beyond it', () => {
		const { st, c } = fresh();
		terrain(st, c, 'river');
		hold(c, [['crop/hoe', 'shared']]);
		c.condition.seatSteps = 10;
		c.condition.numbers = 30;
		expect(stepReserve(c, workReading(st, c)).reserve).toBeGreaterThan(0);
		c.condition.numbers = 5000;
		c.condition.buffer = 0.05;
		const lean = stepReserve(c, workReading(st, c));
		expect(lean.reserve).toBe(0);
		expect(lean.fed).toBeLessThan(1);
		c.condition.numbers = 360;
		const food = workReading(st, c).food;
		expect(food.adequacy).toBeLessThan(1);
		c.condition.buffer = 1 - food.adequacy + 0.01;
		expect(stepReserve(c, workReading(st, c)).fed).toBe(1);
	});
});
