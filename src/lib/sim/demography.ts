import type { Culture, GameState } from '$lib/types';
import { BIRTHS, DEATHS, HEALTH_STEP, MAX_STRAND, SETTLED_STEPS } from './figures';
import { activeParts, heldAbout } from './predicates';
import { DEMOGRAPHY, SLOTS } from './slots';

// Births and deaths (6SL.6), calculated separately as net rates per 25-year step, so a high-birth
// high-death band differs from a low-birth normal-death band at the same growth. Rates are fractions
// of the headcount. Nothing here is random: a band's numbers follow from its condition and customs.
//
// Births read adequacy (as the band felt it, after the reserve), health, morale, how settled the band
// is and its marriage customs. Deaths read hunger, health, crowding, the dangerous ways of life its
// customs imply and a violence hook that is zero until raids, feuds and killings exist (6SL.17 and
// 4SD.9). Customs reach both through DEMOGRAPHY, a table keyed by custom and tag.

// The sum of the table's `field` for every row the band's customs satisfy. A row counts once.
function fromCustoms(c: Culture, field: 'births' | 'deaths'): number {
	return DEMOGRAPHY.reduce((sum, row) => {
		const amount = row[field];
		const si = SLOTS.findIndex((s) => s.id === row.when.custom);
		if (amount === undefined || si < 0 || c.absent.includes(row.when.custom)) return sum;
		return activeParts(c.traits).some(([s, f]) => s === si && heldAbout(c.traits, s, f, row.when.about)) ? sum + amount : sum;
	}, 0);
}

const between = (range: [number, number], t: number): number => range[0] + (range[1] - range[0]) * Math.max(0, Math.min(1, t));

// Births a step as a fraction of numbers. `fed` is the adequacy the band felt this step.
export function birthRate(c: Culture, fed: number): number {
	const k = c.condition;
	const nourished = Math.min(Math.max(fed, 0), BIRTHS.adequacyCap);
	const settled = 1 + BIRTHS.settledBonus * Math.min(1, k.seatSteps / SETTLED_STEPS);
	return BIRTHS.base * nourished * between(BIRTHS.healthRange, k.health / MAX_STRAND) * between(BIRTHS.moraleRange, k.morale / MAX_STRAND) * settled * (1 + fromCustoms(c, 'births'));
}

// Deaths from raids, feuds and killings, read from structured events. Zero until those exist.
// STUD HOOK: 6SL.17 and 4SD.9 supply the events and decide how they count.
export const violenceDeaths = (_st: GameState, _c: Culture): number => 0;

// Deaths a step as a fraction of numbers, at most all of them. `capacity` is the heads the band's
// sources would feed with full pools and full crews: numbers beyond it crowd the land.
export function deathRate(st: GameState, c: Culture, fed: number, capacity: number): number {
	const k = c.condition;
	const crowding = capacity > 0 ? Math.max(0, k.numbers / capacity - 1) : 0;
	const total =
		DEATHS.base +
		DEATHS.hunger * Math.max(0, 1 - fed) +
		DEATHS.disease * (1 - k.health / MAX_STRAND) +
		DEATHS.crowding * crowding +
		fromCustoms(c, 'deaths') +
		violenceDeaths(st, c);
	return Math.min(1, total);
}

// Health moves toward a target set by what the band was fed, a step at a time, so hunger sickens a
// band before it thins it and a good year does not cure a bad decade.
export const stepHealth = (health: number, fed: number): number => health + HEALTH_STEP * (MAX_STRAND * Math.max(0, Math.min(1, fed)) - health);

export const stepNumbers = (numbers: number, births: number, deaths: number): number => Math.max(0, Math.round(numbers * (1 + births - deaths)));
