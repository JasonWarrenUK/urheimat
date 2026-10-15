import type { Culture, CultureTraits, FoodReading, GameState, PoolId, SourceId, Terrain, TraitValue } from '$lib/types';
import { startingCondition } from './condition';
import { aff } from './engine';
import { HAND_HAULED, HAND_HAULED_CREW, KEEPS, SMALL_DRAUGHT, SMALL_DRAUGHT_CREW, SETTLED_FLOOR, SETTLED_STEPS, SOURCES, TILE_KM2, WORKING_SHARE } from './figures';
import { isActive } from './predicates';
import { addUse, stockOf, type TileUse } from './pools';
import { chooseTiles, type Demand, type Tile } from './range';
import { RICHNESS, SLOTS } from './slots';

// Food (6SL.6): what the land and the livelihood customs yield, in heads fed, set against the
// headcount. It is derived and never stored: each step's reading is recorded in the strand snapshot
// (history.ts) so a transition can be read against the step before. Consequences cannot write it;
// they act on the factors it derives from (numbers, the reserve, the customs).
//
// A source works the tiles it needs (range.ts). Each tile gives it a ceiling: density x the tile's area
// x terrain affinity x (1 + richness) x its pool's stock. The source yields the lesser of what its
// tiles allow and what its hands produce (hands x heads fed per worker), and nothing below its
// minimum team. Sources of one band on one pool split the tile's ceiling by what their hands can
// work. A step is 25 years, so no fallow cycle is modelled: what the step shows is how hard each
// pool was worked.

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

// How well a plough is drawn: full with large herds held as a source, partly with small herds only,
// and a hand-hauled fraction of its ceiling with neither (and a bigger minimum crew). Every other
// source needs no draught.
function draught(held: readonly HeldSource[], s: HeldSource): { ceiling: number; crew: number } {
	if (s.id !== 'crop/plough') return { ceiling: 1, crew: 1 };
	if (held.some((o) => o.id === 'herds/large')) return { ceiling: 1, crew: 1 };
	if (held.some((o) => o.id === 'herds/small')) return { ceiling: SMALL_DRAUGHT, crew: SMALL_DRAUGHT_CREW };
	return { ceiling: HAND_HAULED, crew: HAND_HAULED_CREW };
}

// The most people the ancestral customs could feed around the home tile, with full pools: the
// largest headcount whose yield still feeds it. Crews matter (a source nobody can work yields nothing),
// so a people whose customs idle most of its workers is small, and range matters (a forager people
// needs many tiles). The scattering starts from a share of it (begin in engine.ts). The scan steps
// geometrically, since the answer can run from tens to thousands.
const HOME_SCAN_MAX = 50000;
export function homePopulation(st: GameState): number {
	const home = {
		traits: st.ancestral,
		absent: [] as string[],
		x: st.map.cx,
		y: st.map.cy,
		condition: startingCondition()
	} as Culture;
	let best = 0;
	for (let n = 1; n <= HOME_SCAN_MAX; n += Math.max(1, Math.floor(n / 40))) {
		home.condition.numbers = n;
		if (workReading(st, home, { ignoreSeats: true }).food.adequacy >= 1) best = n;
	}
	return best;
}

// A people that could not feed anyone could not have existed, and the corpus does not yet keep a
// source's labour and the kinds a band recognises consistent (4SD.18 divides labour by recognised
// kinds at source). So when the ancestral customs cannot feed even one person under the labour rule,
// their livelihood is worked by all together. INTERIM (deleted by 4SD.18). Draws nothing from the rng.
export function makeViable(st: GameState): void {
	if (LIVELIHOOD < 0 || homePopulation(st) > 0) return;
	const features = SLOTS[LIVELIHOOD].features;
	[1, 2, 3].forEach((stage) => {
		const lf = features.findIndex((f) => f.id === `s${stage}.labour`);
		const shared = lf < 0 ? -1 : features[lf].values.findIndex((v) => v.id === 'shared');
		if (shared >= 0) st.ancestral[LIVELIHOOD][lf] = [shared];
	});
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
	workable: number; // the heads its hands could produce, before the land limits it
	tiles: number; // how many tiles it works
}

export interface Work {
	food: FoodReading;
	// The heads the tiles the sources work would feed with full pools and full crews: what the band's
	// range can hold. Numbers beyond it crowd the land.
	capacity: number;
	sources: SourceWork[];
	// How hard each tile was worked this step, by "x,y" key; the engine sums every band's and steps
	// each pool once (tiles are a shared commons).
	uses: Map<string, TileUse>;
	// The fields the band holds after this step, for conditionStep to store.
	fields: string[];
	fieldIdle: number;
}

export interface WorkOptions {
	// Measure the home people before any band has a seat.
	ignoreSeats?: boolean;
}

// What a band's sources yield this step and how hard each tile was worked doing it. Pure: nothing is
// drawn down or stored until the step does it (engine.ts, conditionStep).
export function workReading(st: GameState, c: Culture, opts: WorkOptions = {}): Work {
	const held = heldSources(c);
	const hands = handsFor(c, held);
	const terrainAt = (t: Tile): Terrain => st.map.tiles[t.y][t.x] as Terrain;
	const worked = held.map((s, i) => {
		const fig = SOURCES[s.id],
			d = draught(held, s);
		// A hand-hauled or poorly drawn plough loses ceiling and each worker's productivity alike.
		const workable = hands[i] >= fig.team * d.crew ? hands[i] * fig.perHand * d.ceiling : 0;
		return { s, fig, d, workable };
	});
	// Sources of one band that draw on one pool (the hoe and the plough, large and small herds) split
	// each tile's ceiling between them in proportion to what their hands can work, so together they
	// never claim more than the tile holds. A pool whose sources can work nothing splits it evenly.
	const poolSources = (pool: PoolId) => worked.filter((w) => w.fig.pool === pool);
	const shareOf = (pool: PoolId, workable: number): number => {
		const sharing = poolSources(pool),
			total = sharing.reduce((n, w) => n + w.workable, 0);
		return total > 0 ? workable / total : 1 / sharing.length;
	};
	const shape = worked.map(({ s, fig, d, workable }) => {
		const slice = shareOf(fig.pool, workable);
		const full = (t: Tile): number => fig.density * TILE_KM2 * aff(LIVELIHOOD, s.fi, s.vi, terrainAt(t)) * (1 + (RICHNESS[terrainAt(t)] ?? 0)) * d.ceiling;
		const demand: Demand = { workable, itinerant: fig.pool !== 'soil', full, usable: (t) => full(t) * stockOf(st, t.x, t.y, fig.pool) * slice };
		return { s, fig, demand, slice };
	});
	const chosen = chooseTiles(st, c, shape.map((x) => x.demand), opts.ignoreSeats);
	const uses = new Map<string, TileUse>();
	let capacity = 0;
	const sources = shape.map(({ s, fig, demand, slice }, i): SourceWork => {
		const tiles = chosen.perSource[i];
		const usable = tiles.reduce((n, t) => n + demand.usable(t), 0);
		const yielded = Math.min(usable, demand.workable);
		tiles.forEach((t) => {
			const share = usable > 0 ? demand.usable(t) / usable : 0;
			const full = demand.full(t);
			const load = full > 0 ? (yielded * share) / full : 0;
			capacity += full * slice;
			addUse(uses, t.key, { [fig.pool]: { load, drawn: fig.draw * load, herds: fig.pool === 'pasture' ? load : 0 } });
		});
		return { id: s.id, pool: fig.pool, keeps: s.keeps, yield: yielded, workable: demand.workable, tiles: tiles.length };
	});
	const total = sources.reduce((n, s) => n + s.yield, 0),
		need = c.condition.numbers;
	return { food: { yield: total, need, adequacy: need > 0 ? total / need : 1 }, capacity, sources, uses, fields: chosen.fields, fieldIdle: chosen.fieldIdle };
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
