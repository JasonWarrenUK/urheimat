import type { PoolId, SourceId } from '$lib/types';

// Every tuning figure of the condition model (6SL.6) lives here and nowhere else. Each is a
// TUNING figure: a placeholder with the reasoning for its ratio, set by Claude against the evidence
// script (scripts/evidence/condition.ts) and reviewed by Jason before it is committed. None is a
// sourced number. The research behind the shapes (Boserup's fallow typology, the plough and
// draught animals, dung and soil, depensation in game and fish) is in the 6SL.6 log and gave
// typologies and directions, not figures.

// ---------- numbers ----------

// TUNING: a band begins at sixty, a small band by the figures below: one decent source at its
// ceiling feeds it with room to grow, so the first steps are not a famine.
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
// TUNING: health and morale run from 0 to 10 and start well; the scale is an engine convention, never shown.
export const START_HEALTH = 7;
export const START_MORALE = 7;
export const MAX_STRAND = 10;

// ---------- food: sources ----------

export interface SourceFigures {
	pool: PoolId;
	// The heads the source feeds at its full ceiling on average land (affinity 'allows', richness 0).
	ceiling: number;
	// The hands it needs for that ceiling, and the least crew (a fraction of those hands) that yields
	// anything at all: a plough needs a team, a herd a herder.
	hands: number;
	minCrew: number;
	// How hard working it draws its pool down, per unit of load.
	draw: number;
	// How well what it yields keeps, which caps the reserve.
	keeps: 'high' | 'low' | 'none';
}

// TUNING. Ratios and why: the plough's ceiling exceeds the hoe's because ox-ploughing cut tillage
// labour by about four fifths in one Tanzanian before-and-after study and lets a band work more
// ground with fewer hands; it also draws the soil harder, and needs a team. Herds need few hands
// for the heads they feed. The hunt is the lowest ceiling: wild game feeds few people per tile.
// Grain and herds keep; fish and nuts keep a little (dried or smoked); fresh game does not.
export const SOURCES: Record<SourceId, SourceFigures> = {
	'herds/large': { pool: 'pasture', ceiling: 70, hands: 12, minCrew: 0.25, draw: 0.5, keeps: 'high' },
	'herds/small': { pool: 'pasture', ceiling: 60, hands: 10, minCrew: 0.2, draw: 0.6, keeps: 'high' },
	'crop/hoe': { pool: 'soil', ceiling: 80, hands: 30, minCrew: 0.3, draw: 0.3, keeps: 'high' },
	'crop/plough': { pool: 'soil', ceiling: 140, hands: 24, minCrew: 0.4, draw: 0.7, keeps: 'high' },
	catch: { pool: 'fish', ceiling: 50, hands: 18, minCrew: 0.25, draw: 0.4, keeps: 'low' },
	hunt: { pool: 'game', ceiling: 30, hands: 16, minCrew: 0.3, draw: 0.5, keeps: 'none' },
	gather: { pool: 'plants', ceiling: 25, hands: 14, minCrew: 0.2, draw: 0.3, keeps: 'low' }
};

// TUNING: the share of numbers that works (children and the old do not).
export const WORKING_SHARE = 0.5;
// TUNING: what a plough with no large herds to draw it keeps of its ceiling. A plough pulled by
// people is a hoe with extra work, so this sits below the hoe's ceiling over the plough's.
export const HAND_HAULED = 0.25;
// TUNING: the extra minimum crew a hand-hauled plough needs, as a multiple.
export const HAND_HAULED_CREW = 2;

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
	soil: { regrow: 0.5, breeds: false },
	pasture: { regrow: 0.7, breeds: false },
	plants: { regrow: 0.6, breeds: false },
	game: { regrow: 0.6, breeds: true },
	fish: { regrow: 0.8, breeds: true }
};
// TUNING: how much herds on a tile add to the soil's regrowth, per unit of herd load (manure).
export const MANURE = 0.15;
// TUNING: a pool never falls below this, so a collapsed breeding pool can still recover, slowly.
export const POOL_FLOOR = 0.02;

// ---------- the reserve ----------

// TUNING: what each keeps factor holds, as a fraction of a step's need (0.12 is three years of
// food in twenty-five). Grain and herds keep; dried fish and nuts keep a little; fresh game not at all.
export const KEEPS: Record<SourceFigures['keeps'], number> = { high: 0.12, low: 0.03, none: 0 };
// TUNING: what a wandering band can still hold (it can keep a herd), and the steps on a seat from
// which a band counts as settled.
export const SETTLED_FLOOR = 0.2;
export const SETTLED_STEPS = 4;
// TUNING: what a whole-band move leaves of the reserve (stores do not travel; herds do).
export const MOVE_RESERVE_KEPT = 0.25;

// ---------- births and deaths ----------

// TUNING: rates per step are fractions of numbers, over twenty-five years. A crude birth rate of
// about 40 a thousand a year over a step is one head per head; a death rate of about 34 a thousand
// is about 0.85; their difference is about half a percent a year of growth.
export const BIRTHS = {
	base: 1.0,
	// Adequacy above one helps up to this much more; below one it falls in proportion.
	adequacyCap: 1.2,
	// Health and morale scale births between these bounds (at 0 the low bound, at 10 the high).
	healthRange: [0.4, 1.0] as [number, number],
	moraleRange: [0.7, 1.0] as [number, number],
	// A band that stays on its seat breeds a little faster once settled; unverified.
	settledBonus: 0.1
};
export const DEATHS = {
	base: 0.85,
	// Extra deaths per unit of shortfall in adequacy (famine mortality).
	hunger: 1.5,
	// Extra deaths at health 0 (disease); none at 10.
	disease: 0.5,
	// Extra deaths per unit that numbers exceed the whole tile's ceiling (crowding); unverified.
	crowding: 0.3
};
// TUNING: how far health moves toward its target each step, and the target's relation to adequacy.
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
