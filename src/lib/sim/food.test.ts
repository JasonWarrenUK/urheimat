import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/food';
import type { Culture, GameState, MapTerrain, PoolId } from '$lib/types';
import { begin, newGame, startTiles } from './engine';
import { handsFor, heldSources, homePopulation, makeViable, recognisedKinds, reserveCap, stepReserve, workReading } from './food';
import { SOURCES, WORKING_SHARE } from './figures';
import { contributions } from './pressures';
import { SLOTS } from './slots';

const si = SLOTS.findIndex((s) => s.id === fixtures.livelihood.custom);
const gi = SLOTS.findIndex((s) => s.id === fixtures.gender.custom);
const fi = (id: string) => SLOTS[si].features.findIndex((f) => f.id === id);
const vi = (part: string, id: string) => SLOTS[si].features[fi(part)].values.findIndex((v) => v.id === id);

function fresh(): { st: GameState; c: Culture } {
	const st = newGame(fixtures.seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	// A lone band: the other five would otherwise hold seats and shape its range.
	st.cultures.forEach((k) => !k.isPlayer && (k.alive = false));
	return { st, c: st.cultures[st.playerId as number] };
}

// Hold exactly these sources, in stage order, each with its labour; recognise exactly these kinds.
function hold(c: Culture, sources: [string, string][], kinds = ['male', 'female']): void {
	[1, 2, 3].forEach((stage, i) => {
		const spec = sources[i];
		c.traits[si][fi(`s${stage}.source`)] = spec ? [vi(`s${stage}.source`, spec[0])] : [];
		c.traits[si][fi(`s${stage}.labour`)] = [vi(`s${stage}.labour`, spec ? spec[1] : 'shared')];
	});
	c.traits[gi][0] = kinds.map((k) => SLOTS[gi].features[0].values.findIndex((v) => v.id === k));
}
// Paint the whole map one terrain, so every tile in a band's range is the same.
const paint = (st: GameState, t: MapTerrain) => st.map.tiles.forEach((row, y) => row.forEach((_, x) => (st.map.tiles[y][x] = t)));
const setStocks = (st: GameState, pool: PoolId, v: number) =>
	st.map.tiles.forEach((row, y) => row.forEach((_, x) => ((st.map.stocks[`${x},${y}`] ??= {})[pool] = v)));

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
	it('yields nothing below the minimum team, then what its hands produce', () => {
		const { st, c } = fresh();
		paint(st, 'river');
		hold(c, [['crop/hoe', 'shared']]);
		const fig = SOURCES['crop/hoe'];
		const at = (hands: number) => {
			c.condition.numbers = hands / WORKING_SHARE;
			return workReading(st, c).food.yield;
		};
		expect(at(fig.team - 1)).toBe(0);
		expect(at(fig.team)).toBeCloseTo(fig.team * fig.perHand);
		expect(at(fig.team * 4)).toBeCloseTo(4 * at(fig.team));
	});
	it('is held to what the tiles in reach can feed when labour is plentiful', () => {
		const { st, c } = fresh();
		paint(st, 'steppe');
		hold(c, [['hunt', 'shared']]);
		c.condition.numbers = 100000;
		const work = workReading(st, c);
		expect(work.sources[0].workable).toBeGreaterThan(work.food.yield);
		expect(work.food.yield).toBeCloseTo(work.capacity);
	});
	it('takes more tiles as numbers grow, a forager band far more than a farming band', () => {
		const { st, c } = fresh();
		paint(st, 'steppe');
		const tiles = (sources: [string, string][], n: number) => {
			hold(c, sources);
			c.condition.numbers = n;
			return workReading(st, c).sources[0].tiles;
		};
		expect(tiles([['hunt', 'shared']], 400)).toBeGreaterThan(tiles([['hunt', 'shared']], 30));
		expect(tiles([['hunt', 'shared']], 400)).toBeGreaterThan(tiles([['crop/hoe', 'shared']], 400));
	});
	it('gives the same source a bigger ceiling on land that favours it', () => {
		const { st, c } = fresh();
		hold(c, [['crop/plough', 'shared'], ['herds/large', 'shared']]);
		c.condition.numbers = 200;
		paint(st, 'river');
		const river = workReading(st, c).capacity;
		paint(st, 'forest');
		const forest = workReading(st, c).capacity;
		expect(river).toBeGreaterThan(forest * 2);
	});
	it('draws a plough fully with large herds, partly with small herds and by hand with neither', () => {
		const { st, c } = fresh();
		paint(st, 'river');
		c.condition.numbers = 200;
		const plough = (other: string) => {
			hold(c, [['crop/plough', 'shared'], [other, 'shared']]);
			return workReading(st, c).sources.find((s) => s.id === 'crop/plough')!.yield;
		};
		const hauled = plough('gather'),
			partly = plough('herds/small'),
			fully = plough('herds/large');
		expect(hauled).toBeGreaterThan(0);
		expect(partly).toBeGreaterThan(hauled);
		expect(fully).toBeGreaterThan(partly);
	});
	it('pulls a plough band to add large herds in a free stage, and not a band that holds them', () => {
		const { st, c } = fresh();
		hold(c, [['crop/plough', 'shared']]);
		const herds = SLOTS[si].features[fi('s2.source')].values.findIndex((v) => v.id === 'herds/large');
		const draws = (band: Culture) => contributions(st, band).filter((k) => k.source.kind === 'custom' && k.part === fi('s2.source') && k.value === herds);
		expect(draws(c).length).toBe(1);
		hold(c, [['crop/plough', 'shared'], ['herds/large', 'shared']]);
		expect(draws(c).length).toBe(0);
	});
	it('falls with a depleted pool and sets adequacy against the headcount', () => {
		const { st, c } = fresh();
		paint(st, 'steppe');
		hold(c, [['hunt', 'shared']]);
		c.condition.numbers = 100000;
		const whole = workReading(st, c).food;
		setStocks(st, 'game', 0.5);
		const worn = workReading(st, c).food;
		expect(worn.yield).toBeCloseTo(whole.yield * 0.5, 0);
		expect(worn.adequacy).toBeCloseTo(worn.yield / 100000);
	});
	it('reports no yield, and so none fed, for a band with no livelihood', () => {
		const { st, c } = fresh();
		c.absent.push('livelihood');
		expect(workReading(st, c).food.adequacy).toBe(0);
	});
	it('does not take another live band\'s seat, nor water', () => {
		const { st, c } = fresh();
		const other = st.cultures.find((k) => !k.isPlayer)!;
		other.alive = true;
		other.x = c.x + 1;
		other.y = c.y;
		hold(c, [['hunt', 'shared']]);
		c.condition.numbers = 5000;
		workReading(st, c).uses.forEach((_, key) => {
			expect(key).not.toBe(`${other.x},${other.y}`);
			const [x, y] = key.split(',').map(Number);
			expect(st.map.tiles[y][x]).not.toBe('water');
		});
	});
});

describe('fields', () => {
	it('are held across steps and given up only after three steps unneeded', () => {
		const { st, c } = fresh();
		paint(st, 'river');
		hold(c, [['crop/hoe', 'shared']]);
		c.condition.numbers = 3000;
		const grown = workReading(st, c);
		expect(grown.fields.length).toBeGreaterThan(1);
		c.condition.fields = grown.fields;
		c.condition.numbers = 30;
		let kept = workReading(st, c);
		expect(kept.fields.length).toBe(grown.fields.length);
		for (let i = 0; i < 3; i++) {
			c.condition.fields = kept.fields;
			c.condition.fieldIdle = kept.fieldIdle;
			kept = workReading(st, c);
		}
		expect(kept.fields.length).toBeLessThan(grown.fields.length);
	});
	it('are not held by a band that works none', () => {
		const { st, c } = fresh();
		hold(c, [['hunt', 'shared']]);
		expect(workReading(st, c).fields).toEqual([]);
	});
});

describe('the home people', () => {
	it('count the most the ancestral customs could feed around the home tile', () => {
		const { st } = fresh();
		const people = homePopulation(st);
		expect(people).toBeGreaterThan(0);
		expect(people).toBeLessThan(50000);
	});
	it('are made viable when their labour rule would leave them unable to feed anyone', () => {
		const { st } = fresh();
		// One source worked by men only among four recognised kinds: three quarters of the workers idle.
		const home = st.ancestral;
		[1, 2, 3].forEach((stage, i) => {
			home[si][fi(`s${stage}.source`)] = i === 0 ? [vi('s1.source', 'hunt')] : [];
			home[si][fi(`s${stage}.labour`)] = [vi(`s${stage}.labour`, i === 0 ? 'male' : 'shared')];
		});
		home[gi][0] = [0, 1, 2, 3];
		expect(homePopulation(st)).toBe(0);
		makeViable(st);
		expect(homePopulation(st)).toBeGreaterThan(0);
		expect(home[si][fi('s1.labour')]).toEqual([vi('s1.labour', 'shared')]);
	});
	it('are left alone when they could feed themselves', () => {
		const { st } = fresh();
		const before = JSON.stringify(st.ancestral);
		makeViable(st);
		expect(JSON.stringify(st.ancestral)).toBe(before);
	});
});

describe('the reserve', () => {
	it('caps by how well the food keeps and how settled the band is', () => {
		const { st, c } = fresh();
		paint(st, 'river');
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
		paint(st, 'river');
		hold(c, [['crop/hoe', 'shared']]);
		c.condition.seatSteps = 10;
		c.condition.numbers = 30;
		expect(stepReserve(c, workReading(st, c)).reserve).toBeGreaterThan(0);
		setStocks(st, 'soil', 0.02);
		c.condition.numbers = 600;
		c.condition.buffer = 0.05;
		const work = workReading(st, c);
		expect(work.food.adequacy).toBeLessThan(0.5);
		const lean = stepReserve(c, work);
		expect(lean.reserve).toBe(0);
		expect(lean.fed).toBeLessThan(1);
		c.condition.buffer = 1 - work.food.adequacy + 0.01;
		expect(stepReserve(c, work).fed).toBe(1);
	});
});

describe('sources that share a pool', () => {
	it('never claim more of a tile than it holds between them', () => {
		const { st, c } = fresh();
		paint(st, 'river');
		c.condition.numbers = fixtures.sharedPool.soil.numbers;
		hold(c, fixtures.sharedPool.soil.sources);
		const { uses } = workReading(st, c);
		expect(uses.size).toBeGreaterThan(0);
		uses.forEach((use) => Object.values(use).forEach((pool) => expect(pool!.load).toBeLessThanOrEqual(1 + 1e-9)));
	});
	it('count the shared tile once toward what the range can hold', () => {
		const { st, c } = fresh();
		paint(st, 'steppe');
		c.condition.numbers = fixtures.sharedPool.herds.numbers;
		const [large, small] = fixtures.sharedPool.herds.sources;
		const capacityOf = (sources: [string, string][]): number => {
			hold(c, sources);
			return workReading(st, c).capacity;
		};
		const alone = [capacityOf([large]), capacityOf([small])];
		const together = capacityOf([large, small]);
		expect(together).toBeLessThanOrEqual(Math.max(...alone));
	});
});
