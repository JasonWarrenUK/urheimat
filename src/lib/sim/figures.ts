import type { PoolId, SourceId, TraitValue } from '$lib/types';

// Every tuning figure of the condition model (6SL.6) lives here and nowhere else. Each is a
// TUNING figure: a placeholder with the reasoning for its ratio, set by Claude against the evidence
// script (scripts/evidence/condition.ts) and reviewed by Jason before it is committed. Where the
// research gave a number (Kelly, Boserup and Wrigley, cited in the comment above SOURCES), the figure
// cites it; where it gave only a typology or a direction (Boserup's fallow typology, the plough and
// draught animals, dung and soil, depensation in game and fish), the figure is marked an assumption.
// The research is in the 6SL.6 log.

// ---------- numbers ----------

// TUNING: the people before the scattering are a share of the most their home tile could feed with
// the ancestral customs (food.ts homePopulation), divided evenly among the six bands. A band never
// starts below the floor, so a poor home still sends out viable bands. START_NUMBERS is the headcount
// of a band made outside a scattering (the default before begin sets the real one).
export const HOME_SHARE = 0.9;
export const MIN_START = 30;
export const START_NUMBERS = 60;
// TUNING: the size tiers over the headcount. Boundaries are headcounts so later features that need
// them (conflict, splits) have concrete numbers; the names are placeholders until 2DS.2 designs the
// display.
export const NUMBERS_TIERS: readonly { name: string; from: number }[] = [
	{ name: 'few', from: 0 },
	{ name: 'small', from: 20 },
	{ name: 'middling', from: 50 },
	{ name: 'large', from: 100 },
	{ name: 'great', from: 200 }
];
// TUNING: the headcount from which an AI band may split, under the interim rule until 6SL.10.
export const SPLIT_NUMBERS = 90;
// TUNING (stub until 6SL.10): a parent's heads divide by this and one part goes with a daughter band.
export const DAUGHTER_DIVISOR = 3;
// TUNING: health and morale run from 0 to 10 and start well; the scale is an engine convention, never shown.
export const START_HEALTH = 7;
export const START_MORALE = 7;
export const MAX_STRAND = 10;

// ---------- food: sources ----------

export interface SourceFigures {
	pool: PoolId;
	// The people a square kilometre of average land (affinity 'allows', richness 0) supports from this
	// source alone. A tile's ceiling is this times the tile's area, the land's affinity and richness.
	density: number;
	// Heads fed per worker (a worker is a working adult), at full crew. A source yields the lesser of
	// what its tiles allow and what its hands times this produce.
	perHand: number;
	// The least team, in hands, that yields anything at all: a plough needs a team, a hunt a party.
	team: number;
	// How hard working it draws its pool down, per unit of load. How well what it yields keeps is not
	// here: it is the `keeps` field on the livelihood value in the corpus, so a new value must say.
	draw: number;
}

// The area of one map tile, in square kilometres: ten by ten. TUNING (assumption): the research gives
// densities per km2, and the tile is the unit the sim counts in.
export const TILE_KM2 = 100;
// How many tiles out from its seat a band can reach, by way of life: itinerant sources range wide,
// fields stay close. TUNING (assumptions).
export const REACH_ITINERANT = 2;
export const REACH_FIELDS = 1;
// A band takes tiles until their capacity covers what it can work times this margin. TUNING (assumption).
export const RANGE_MARGIN = 1.2;
// Steps in a row a band's fields go unneeded before the farthest is given up. TUNING (assumption).
export const FIELD_IDLE_STEPS = 3;

// Research-based where a source is named, an assumption where it says so; all TUNING.
// - perHand: foragers 2.4 (Kelly 2013, from !Kung returns: 2,355 kcal brought in against 1,975 needed,
//   about 1.2 per head, with about half the people working); English farm workers fed 1.3 (1520) to 2.8
//   (1801) (Wrigley, derived from secondary sources). Hoe 2.2 and plough 2.8 follow that range, herds 3
//   (assumption), fishing 2.4 (assumption, as foragers).
// - density, people per km2: foragers 0.1 to 0.4 in all, split here between the hunt and gathering
//   (Kelly 2013 Table 7-3); Jomon fisher-foragers 0.89 on average and 3 on the best land, the
//   Northwest Coast 0.1 to 2 (Kelly Table 7-3, Koyama 1978); forest-fallow hoe farming 5 to 10
//   (Boserup 1965); herds 2, the low end of mobile pastoralists' 1.4 to 17 (Lake Chad, a Somaliland
//   model: snippets); plough 15 (assumption: no clean figure found).
// - team: hunting groups of 3 to 8 (Kelly); fishing crews 3 to 4 (assumption; large canoe or whale
//   crews are 8 to 12, Kelly); a plough team of a few; a herd and a field need a couple of people
//   (assumptions).
// The plough draws the soil harder than the hoe and the hoe regrows it faster in fallow; the hunt and
// the catch draw their pools harder than gathering. Grain and herds keep, fish and nuts a little.
export const SOURCES: Record<SourceId, SourceFigures> = {
	'herds/large': { pool: 'pasture', density: 2, perHand: 3, team: 2, draw: 0.25 },
	'herds/small': { pool: 'pasture', density: 2, perHand: 3, team: 2, draw: 0.3 },
	'crop/hoe': { pool: 'soil', density: 6, perHand: 2.2, team: 2, draw: 0.15 },
	'crop/plough': { pool: 'soil', density: 15, perHand: 2.8, team: 3, draw: 0.35 },
	catch: { pool: 'fish', density: 0.8, perHand: 2.4, team: 4, draw: 0.2 },
	hunt: { pool: 'game', density: 0.15, perHand: 2.4, team: 3, draw: 0.25 },
	gather: { pool: 'plants', density: 0.15, perHand: 2.4, team: 2, draw: 0.15 }
};

// TUNING: the share of numbers that works (children and the old do not).
export const WORKING_SHARE = 0.5;
// TUNING (assumptions; the research says ox-ploughing cut tillage labour by about four fifths in one
// Tanzanian before-and-after study, not what a plough without animals loses): what a plough with no
// large herds to draw it keeps of its ceiling and of each worker's productivity. A plough pulled by
// people is a hoe with extra work.
export const HAND_HAULED = 0.25;
// TUNING: the extra minimum team a hand-hauled plough needs, as a multiple.
export const HAND_HAULED_CREW = 2;
// TUNING: draught from small herds only (sheep and goats are poor draught animals) sits between the
// two: a plough with them keeps this share of its ceiling and productivity and needs this multiple of
// its minimum team.
export const SMALL_DRAUGHT = 0.6;
export const SMALL_DRAUGHT_CREW = 1.5;

// ---------- food: pools ----------

export interface PoolFigures {
	// The fraction of the gap to full that a lightly used pool regains each step, times (1 - load).
	regrow: number;
	// Breeding pools regrow in proportion to what remains, so one driven near zero recovers very slowly.
	breeds: boolean;
}

// TUNING. A step is 25 years, so grass and plants regrow most of the way within one; soil recovers
// only when lightly worked (the (1 - load) factor is the fallow rule); game and fish breed, and
// depensation (recovery stalling at low abundance) is common in the record though not universal.
export const POOLS: Record<PoolId, PoolFigures> = {
	soil: { regrow: 0.6, breeds: false },
	pasture: { regrow: 0.9, breeds: false },
	plants: { regrow: 0.9, breeds: false },
	// Breeding pools regrow in proportion to what remains, so their rate is an intrinsic growth rate
	// and the most they regain in a step is a quarter of it.
	game: { regrow: 1.6, breeds: true },
	fish: { regrow: 2.4, breeds: true }
};
// TUNING: how much herds on a tile add to the soil's regrowth, per unit of herd load (manure).
export const MANURE = 0.15;
// TUNING: a pool never falls below this, so a collapsed breeding pool can still recover, slowly.
export const POOL_FLOOR = 0.02;

// ---------- the reserve ----------

// TUNING: what each keeps factor holds, as a fraction of a step's need (0.12 is three years of
// food in twenty-five). Grain and herds keep; dried fish and nuts keep a little; fresh game not at all.
export const KEEPS: Record<NonNullable<TraitValue['keeps']>, number> = { high: 0.12, low: 0.03, none: 0 };
// TUNING: what a wandering band can still hold (it can keep a herd), and the steps on a seat from
// which a band counts as settled.
export const SETTLED_FLOOR = 0.2;
export const SETTLED_STEPS = 4;
// TUNING: what a whole-band move leaves of the reserve (stores do not travel; herds do).
export const MOVE_RESERVE_KEPT = 0.25;

// ---------- births and deaths ----------

// TUNING: rates per step are fractions of numbers, over twenty-five years. A crude birth rate of
// about 40 a thousand a year over a step is one head per head, and natural fertility can run higher;
// the base sits at the healthy end and is scaled down by health and morale, so a band at the start
// (health 7, morale 7) nets about even and one in good health grows. Deaths are the mirror.
export const BIRTHS = {
	base: 1.1,
	// Adequacy above one helps up to this much more; below one it falls in proportion.
	adequacyCap: 1.2,
	// Health and morale scale births between these bounds (at 0 the low bound, at 10 the high).
	healthRange: [0.4, 1.0] as [number, number],
	moraleRange: [0.7, 1.0] as [number, number],
	// A band that stays on its seat breeds a little faster once settled; unverified.
	settledBonus: 0.1
};
export const DEATHS = {
	base: 0.8,
	// Extra deaths per unit of shortfall in adequacy (famine mortality).
	hunger: 1.5,
	// Extra deaths at health 0 (disease); none at 10.
	disease: 0.5,
	// Extra deaths per unit that numbers exceed the whole tile's ceiling (crowding); unverified.
	crowding: 0.3
};
// TUNING: how far health moves towards its target each step, and the target's relation to adequacy.
export const HEALTH_STEP = 0.5;

// ---------- ladders ----------

export interface RouteFigures {
	hold: number; // strength at which a route surfaces
	tiers: number; // how many tiers before the forced outcome
	fade: number; // what the pull keeps each step nothing feeds it
	feed: number; // strength a holding feed adds each step
}
// TUNING: the famine route, the stud's example, replaced by 6SL.19's routes.
export const FAMINE: RouteFigures = { hold: 1, tiers: 3, fade: 0.5, feed: 1 };
// TUNING: a pull below this is nothing and its refusals count down; a refusal leaves a pull this share
// of its strength, as 6SL.3's refused pulls go back at half.
export const LADDER_GONE = 0.1;
export const LADDER_REFUSED = 0.5;
