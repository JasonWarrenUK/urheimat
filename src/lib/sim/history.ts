import type { BandEventKind, Culture, FoodReading, GameState, StrandId, StrandSnapshot } from '$lib/types';

// What the sim keeps for the notebook (2DS.3): a snapshot of every strand of every band at the end
// of each step ("Hard times and good": condition over time), and structured events beside the
// chronicle text ("Turning points": dated events).

// `food` is what the step ran on (conditionStep's reading), not a fresh reading of the state the step
// left behind, so a transition compares what happened with what happened before.
export function snapshot(st: GameState, c: Culture, food: FoodReading): StrandSnapshot {
	const { numbers, buffer, health, morale, standing } = c.condition;
	return { step: st.era, numbers, buffer, health, morale, standing: { ...standing }, food };
}

export function record(st: GameState, c: Culture, food: FoodReading): void {
	c.condition.history.push(snapshot(st, c, food));
}

export function emit(st: GameState, kind: BandEventKind, band: number, reason: string): void {
	st.bandEvents.push({ kind, band, step: st.era, reason });
}

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
