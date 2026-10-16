import type { BandEventKind, Culture, CultureTraits, FoodReading, GameState, StrandId, StrandSnapshot } from '$lib/types';

// What the sim keeps for the notebook (2DS.3): a snapshot of every strand of every band at the end
// of each step ("Hard times and good": condition over time), with the band's seat and customs as
// they stood then (4SD.15: routes and customs over time), and structured events beside the
// chronicle text ("Turning points": dated events, among them every change to a custom).

const copyTraits = (traits: CultureTraits): CultureTraits => traits.map((fv) => fv.map((v) => v.slice()));

// `food` is what the step ran on (conditionStep's reading), not a fresh reading of the state the step
// left behind, so a transition compares what happened with what happened before. The seat and the
// traits are read as the step leaves them, after any move and every answered pull.
export function snapshot(st: GameState, c: Culture, food: FoodReading): StrandSnapshot {
	const { numbers, buffer, health, morale, standing } = c.condition;
	return {
		step: st.era,
		numbers,
		buffer,
		health,
		morale,
		standing: { ...standing },
		food,
		x: c.x,
		y: c.y,
		traits: copyTraits(c.traits),
		absent: c.absent.slice()
	};
}

export function record(st: GameState, c: Culture, food: FoodReading): void {
	c.condition.history.push(snapshot(st, c, food));
}

export function emit(st: GameState, kind: BandEventKind, band: number, reason: string): void {
	st.bandEvents.push({ kind, band, step: st.era, reason });
}

// A change to one part of one custom, as a dated event. `from` and `to` are copied so the event
// reads the same however the part moves later.
export function emitChange(st: GameState, c: Culture, custom: number, part: number, from: readonly number[], to: readonly number[], reason: string): void {
	st.bandEvents.push({ kind: 'custom', band: c.id, step: st.era, reason, change: { custom, part, from: from.slice(), to: to.slice() } });
}

// The seat a band held at the end of a step, or null before it was recorded.
export function seatAt(c: Culture, step: number): { x: number; y: number } | null {
	const snap = c.condition.history.find((h) => h.step === step);
	return snap ? { x: snap.x, y: snap.y } : null;
}

// The steps at which a band's customs differed from the step before, from its snapshots alone.
export function customTurningPoints(c: Culture): number[] {
	const h = c.condition.history;
	return h.filter((snap, i) => i > 0 && !sameTraits(h[i - 1], snap)).map((snap) => snap.step);
}

const sameTraits = (a: StrandSnapshot, b: StrandSnapshot): boolean =>
	a.traits.length === b.traits.length &&
	a.traits.every((fv, si) => fv.length === b.traits[si].length && fv.every((v, fi) => sameMembers(v, b.traits[si][fi]))) &&
	a.absent.length === b.absent.length &&
	a.absent.every((id) => b.absent.includes(id));

const sameMembers = (a: readonly number[], b: readonly number[]): boolean => a.length === b.length && a.every((v) => b.includes(v));

// The mean of a band's standing, and 0 for a band no one yet regards: the aggregate prestige reads
// (4SD.5) is derived on read, never stored.
export const meanStanding = (standing: Record<number, number>): number => {
	const regards = Object.values(standing);
	return regards.length ? regards.reduce((a, b) => a + b, 0) / regards.length : 0;
};

// One strand as a snapshot held it, for comparing now with the step before.
export function strandIn(snap: StrandSnapshot, id: StrandId): number {
	if (id === 'food') return snap.food.adequacy;
	if (id === 'standing') return meanStanding(snap.standing);
	return snap[id];
}
