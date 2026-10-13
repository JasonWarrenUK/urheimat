import type { BandCondition, Culture, GameState, StrandId, WritableStrandId } from '$lib/types';
import { MAX_STRAND, MOVE_RESERVE_KEPT, NUMBERS_TIERS, START_HEALTH, START_MORALE, START_NUMBERS } from './figures';
import { foodReading, stepBuffer } from './food';
import { meanStanding, strandIn } from './history';

// Condition (6SL.6): the strands a band is made of, how they move each step and how a condition or a
// consequence reads and writes them. Numbers are a hidden headcount and the player meets only its
// size tier, as prose (spike 5f).
//
// Every figure is in figures.ts.

export const numbersTier = (numbers: number): number => NUMBERS_TIERS.reduce((tier, t, i) => (numbers >= t.from ? i : tier), 0);

export function startingCondition(): BandCondition {
	return { numbers: START_NUMBERS, buffer: 0, health: START_HEALTH, morale: START_MORALE, standing: {}, seatSteps: 0, ladders: {}, history: [] };
}

// A daughter band starts from its parent (decision 4g): TUNING STUB, a third of the heads and the
// parent's health and morale. The real share depends on why the band split.
export function daughterCondition(parent: Culture): BandCondition {
	const heads = Math.floor(parent.condition.numbers / 3);
	parent.condition.numbers -= heads;
	return { ...startingCondition(), numbers: heads, health: parent.condition.health, morale: parent.condition.morale };
}

// A ladder route is live at the tier its pull has reached (0 when it has built nothing).
export const liveTier = (c: Culture, route: string): number => c.condition.ladders[route]?.tier ?? 0;

// One strand now. Food reads as adequacy and standing as the mean regard; the rest are stored.
export function readStrand(st: GameState, c: Culture, id: StrandId): number {
	if (id === 'food') return foodReading(st, c).adequacy;
	if (id === 'standing') return meanStanding(c.condition.standing);
	return c.condition[id];
}

// Which way a strand has moved since the last step's snapshot; steady when there is none yet.
export function trendOf(st: GameState, c: Culture, id: StrandId): 'rising' | 'falling' | 'steady' {
	const last = c.condition.history.at(-1);
	if (!last) return 'steady';
	const now = readStrand(st, c, id),
		then = strandIn(last, id);
	return now > then ? 'rising' : now < then ? 'falling' : 'steady';
}

// The prose lines for the strands that stand out; nothing in ordinary times (spike 5a, 5f). STUD:
// the thresholds and wording are placeholders, and 2DS.2 designs the real display.
export function conditionLines(st: GameState, c: Culture): string[] {
	const k = c.condition,
		lines: string[] = [];
	if (readStrand(st, c, 'food') < 1) lines.push(k.buffer > 0 ? 'The land feeds fewer than it should; the stores are being eaten.' : 'The herds and fields are thin, and the stores are gone.');
	if (k.health < 3) lines.push('Sickness is in the camp.');
	if (k.morale < 3) lines.push('The people are sullen and look to the old quarrels.');
	if (numbersTier(k.numbers) <= 1) lines.push('There are few of you now.');
	return lines;
}

const clamp = (v: number, hi = MAX_STRAND): number => Math.max(0, Math.min(hi, v));

// A consequence's write. `target` is the band whose strand changes; `source` is the band whose
// answer it was, whose regard a standing write changes.
export function writeStrand(target: Culture, source: Culture, id: WritableStrandId, by: number): void {
	const k = target.condition;
	if (id === 'numbers') k.numbers = Math.max(0, Math.round(k.numbers + by));
	else if (id === 'buffer') k.buffer = Math.max(0, k.buffer + by);
	else if (id === 'standing') k.standing[source.id] = (k.standing[source.id] ?? 0) + by;
	else k[id] = clamp(k[id] + by);
}

// One step of every strand but the ladders. TUNING STUB: numbers grow when fed and fall when not,
// health follows what the buffer could not cover, and a whole-band move cuts the buffer and starts the
// seat counter again.
export function conditionStep(st: GameState, c: Culture): void {
	const k = c.condition,
		food = foodReading(st, c),
		fed = stepBuffer(c, food);
	k.numbers = Math.max(0, Math.round(k.numbers * (fed.unmet > 0 ? 0.8 : 1.1)));
	k.health = clamp(k.health + (fed.unmet > 0 ? -1 : 0.5));
	k.buffer = fed.buffer;
	if (c.migrated && c.bornEra < st.era) k.buffer *= MOVE_RESERVE_KEPT;
	k.seatSteps = c.migrated ? 0 : k.seatSteps + 1;
}
