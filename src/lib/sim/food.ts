import type { Culture, CultureTraits, FoodReading, GameState, PoolId, SourceId, Terrain, TraitValue } from '$lib/types';
import { startingCondition } from './condition';
import { aff } from './engine';
import { HAND_HAULED, HAND_HAULED_CREW, KEEPS, SETTLED_FLOOR, SETTLED_STEPS, SOURCES, WORKING_SHARE } from './figures';
import { isActive } from './predicates';
import { stockOf, type PoolUse } from './pools';
import { RICHNESS, SLOTS } from './slots';

// Food (6SL.6): what the land and the livelihood customs yield, in heads fed, set against the
// headcount. It is derived and never stored: each step's reading is recorded in the strand snapshot
// (history.ts) so a transition can be read against the step before. Consequences cannot write it;
// they act on the factors it derives from (numbers, the reserve, the customs).
//
// Each source has a ceiling (base x terrain affinity x (1 + richness) x its pool's stock). It yields
// nothing below a minimum crew and rises linearly to the ceiling with the hands it has. A step is 25
// years, so no fallow cycle is modelled: what the step shows is how hard each pool was worked.

const LIVELIHOOD = SLOTS.findIndex((s) => s.id === 'livelihood');
const GENDER = SLOTS.findIndex((s) => s.id === 'gender');

type Labour = 'male' | 'female' | 'shared';
type Kind = 'male' | 'female' | 'both' | 'neither';

export interface HeldSource {
	id: SourceId;
	keeps: NonNullable<TraitValue['keeps']>;
	labour: Labour;
	fi: number;
	vi: number;
}

// The livelihood sources a set of customs holds, in stage order. An absent livelihood custom holds none.
function heldSourcesOf(traits: CultureTraits, absent: readonly string[]): HeldSource[] {
	if (LIVELIHOOD < 0 || absent.includes('livelihood')) return [];
	const features = SLOTS[LIVELIHOOD].features;
	const out: HeldSource[] = [];
	for (let stage = 1; stage <= 3; stage++) {
		const fi = features.findIndex((f) => f.id === `s${stage}.source`);
		if (fi < 0 || !isActive(traits, LIVELIHOOD, fi)) continue;
		const vi = traits[LIVELIHOOD][fi][0];
		if (vi === undefined) continue;
		const lf = features.findIndex((f) => f.id === `s${stage}.labour`);
		const lv = lf >= 0 && isActive(traits, LIVELIHOOD, lf) ? traits[LIVELIHOOD][lf][0] : undefined;
		const value = features[fi].values[vi];
		out.push({ id: value.id as SourceId, keeps: value.keeps ?? 'none', labour: lv === undefined ? 'shared' : (features[lf].values[lv].id as Labour), fi, vi });
	}
	return out;
}

// A band's livelihood sources.
export const heldSources = (c: Culture): HeldSource[] => heldSourcesOf(c.traits, c.absent);

// A source's full ceiling on a terrain, before its pool's stock: base times the terrain affinity weight
// times one plus richness. A plough needs draught animals: without large herds held as a source it
// falls to a hand-hauled fraction of its ceiling (and needs a bigger crew, in workReading).
function fullCeiling(held: readonly HeldSource[], s: HeldSource, terrain: Terrain): number {
	const haul = s.id === 'crop/plough' && !held.some((o) => o.id === 'herds/large');
	return SOURCES[s.id].ceiling * aff(LIVELIHOOD, s.fi, s.vi, terrain) * (1 + (RICHNESS[terrain] ?? 0)) * (haul ? HAND_HAULED : 1);
}

// The most people the ancestral customs could feed on the home tile, with full pools: the largest
// headcount whose yield still feeds it. Crews matter (a source nobody can work yields nothing), so a
// people whose customs idle most of its workers is small. The scattering starts from a share of it
// (begin in engine.ts). A people that could feed no one at all counts as one that could feed MIN_START.
export function homePopulation(st: GameState): number {
	const home = {
		traits: st.ancestral,
		absent: [] as string[],
		x: st.map.cx,
		y: st.map.cy,
		condition: startingCondition()
	} as Culture;
	const ceiling = Math.ceil(workReading(st, home).capacity * 1.2);
	let best = 0;
	for (let n = 1; n <= ceiling; n++) {
		home.condition.numbers = n;
		if (workReading(st, home).food.adequacy >= 1) best = n;
	}
	return best;
}

// The kinds of people a band recognises. A band with no gender custom falls back to men and women.
export function recognisedKinds(c: Culture): Kind[] {
	if (GENDER < 0 || c.absent.includes('gender')) return ['male', 'female'];
	return c.traits[GENDER][0].map((vi) => SLOTS[GENDER].features[0].values[vi].id as Kind);
}

// The hands each source has. The working band splits evenly by recognised kind, and each kind's
// workers divide equally among every source that can use them, so fewer workers of any kind mean
// fewer hands for every source that can use that kind, and a kind no source can use sits idle.
//
// INTERIM (deleted by 4SD.18): the men and the women each draw on their own kind when the band
// recognises it, all-together sources on every recognised kind, and the other kinds work
// all-together sources only. A source whose labour names a kind the band does not recognise (the
// corpus does not yet keep the two consistent) is worked by every recognised kind, so a band is never
// born with no workable hands. 4SD.18 divides labour by recognised kinds at source.
export function handsFor(c: Culture, sources: readonly HeldSource[]): number[] {
	const kinds = recognisedKinds(c);
	const perKind = (c.condition.numbers * WORKING_SHARE) / kinds.length;
	const hands = sources.map(() => 0);
	kinds.forEach((kind) => {
		const users = sources.flatMap((s, i) => (s.labour === 'shared' || s.labour === kind || !kinds.includes(s.labour as Kind) ? [i] : []));
		users.forEach((i) => (hands[i] += perKind / users.length));
	});
	return hands;
}

export interface SourceWork {
	id: SourceId;
	pool: PoolId;
	keeps: NonNullable<TraitValue['keeps']>;
	yield: number; // heads fed
	load: number; // the share of the source's full ceiling used
	full: number; // the source's full ceiling on this land, before its pool's stock
}

export interface Work {
	food: FoodReading;
	// The heads the sources would feed with full pools and full crews: what the land can hold.
	capacity: number;
	sources: SourceWork[];
	use: Partial<Record<PoolId, PoolUse>>;
}

// What a band's sources yield this step, and how hard each pool was worked doing it. Pure: nothing is
// drawn down until the step does it (conditionStep).
export function workReading(st: GameState, c: Culture): Work {
	const terrain = st.map.tiles[c.y][c.x] as Terrain;
	const held = heldSources(c);
	const hands = handsFor(c, held);
	const drawn = held.some((s) => s.id === 'herds/large');
	const sources = held.map((s, i): SourceWork => {
		const fig = SOURCES[s.id];
		const haul = s.id === 'crop/plough' && !drawn;
		const full = fullCeiling(held, s, terrain);
		const crew = hands[i] / fig.hands;
		const yielded = crew < Math.min(1, fig.minCrew * (haul ? HAND_HAULED_CREW : 1)) ? 0 : full * stockOf(st, c.x, c.y, fig.pool) * Math.min(1, crew);
		return { id: s.id, pool: fig.pool, keeps: s.keeps, yield: yielded, load: full > 0 ? yielded / full : 0, full };
	});
	const capacity = sources.reduce((n, s) => n + s.full, 0);
	const use: Partial<Record<PoolId, PoolUse>> = {};
	sources.forEach((s) => {
		const u = (use[s.pool] ??= { load: 0, drawn: 0, herds: 0 });
		u.load += s.load;
		u.drawn += SOURCES[s.id].draw * s.load;
		if (s.pool === 'pasture') u.herds += s.load;
	});
	const total = sources.reduce((n, s) => n + s.yield, 0),
		need = c.condition.numbers;
	return { food: { yield: total, need, adequacy: need > 0 ? total / need : 1 }, capacity, sources, use };
}

// The food the band's customs and land would give it now.
export const foodReading = (st: GameState, c: Culture): FoodReading => workReading(st, c).food;

// How settled a band counts as, from a floor (a wandering band can still keep a herd) to one.
const settled = (c: Culture): number => SETTLED_FLOOR + (1 - SETTLED_FLOOR) * Math.min(1, c.condition.seatSteps / SETTLED_STEPS);

// What the reserve can hold: the sum over the sources of their share of the yield, times how well the
// food keeps, times how settled the band is. A fraction of a step's need.
export function reserveCap(c: Culture, work: Work): number {
	const total = work.food.yield;
	if (total <= 0) return 0;
	return work.sources.reduce((n, s) => n + (s.yield / total) * KEEPS[s.keeps], 0) * settled(c);
}

// A surplus banks into the reserve up to its cap (what is beyond it already raised adequacy, so it
// raised births and health this step) and a deficit draws on it first. `fed` is the adequacy the band
// feels: what the reserve cannot cover reaches it as hunger.
export function stepReserve(c: Culture, work: Work): { reserve: number; fed: number } {
	const need = work.food.need;
	const next = c.condition.buffer + (need > 0 ? (work.food.yield - need) / need : 0);
	const reserve = Math.max(0, Math.min(reserveCap(c, work), next));
	return { reserve, fed: next < 0 ? 1 + next : Math.max(1, work.food.adequacy) };
}
