import type { Culture, FoodReading, GameState } from '$lib/types';
import { foodHeldCount, foodStrainCount } from './engine';

// Food (6SL.6): a yield worked out each step from the land and the livelihood customs, set against
// what the numbers need. It is derived and never stored; each step's reading is recorded in the
// strand snapshot (history.ts) so a transition can be read against the step before.
//
// STUD: every figure below is a placeholder that keeps the skeleton running. The real model has a
// ceiling per source, a labour floor, overuse depletion and the labour custom, all against the
// headcount; the keeps field on each livelihood value and the seat counter cap the buffer.

// TUNING STUB: how much surplus a settled band can hold, and how many steps on one seat count as settled.
const BUFFER_CAP = 20;
const SETTLED_STEPS = 4;
// TUNING STUB: what a whole-band move leaves of the buffer (stores do not travel).
export const MOVE_BUFFER_KEPT = 0.25;

// TUNING STUB: yield counts held food sources less those the land resists; need is one per source and
// ignores the headcount, so adequacy is the share of sources the land lets work.
export function foodReading(st: GameState, c: Culture): FoodReading {
	const held = foodHeldCount(c);
	const yielded = held - foodStrainCount(st, c);
	return { yield: yielded, need: held, adequacy: held ? yielded / held : 1 };
}

// What the buffer can hold: TUNING STUB, rising with the steps spent on the seat. The real cap also
// reads each source's keeps field.
export function bufferCap(c: Culture): number {
	return BUFFER_CAP * Math.min(1, (c.condition.seatSteps + 1) / SETTLED_STEPS);
}

// A surplus banks into the buffer and a shortfall draws on it; what the buffer cannot cover is
// returned as the shortfall that reaches the band (the hunger that numbers and health feel).
export function stepBuffer(c: Culture, food: FoodReading): { buffer: number; unmet: number } {
	const surplus = food.yield - food.need;
	const next = c.condition.buffer + surplus;
	return { buffer: Math.max(0, Math.min(bufferCap(c), next)), unmet: Math.max(0, -next) };
}
