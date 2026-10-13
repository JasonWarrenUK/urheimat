import type { BandEventKind, Culture, GameState, StrandId, StrandSnapshot } from '$lib/types';
import { foodReading } from './food';

// What the sim keeps for the notebook (2DS.3): a snapshot of every strand of every band at the end
// of each step ("Hard times and good": condition over time), and structured events beside the
// chronicle text ("Turning points": dated events).

export function snapshot(st: GameState, c: Culture): StrandSnapshot {
	const { numbers, buffer, health, morale, standing } = c.condition;
	return { step: st.era, numbers, buffer, health, morale, standing: { ...standing }, food: foodReading(st, c) };
}

export function record(st: GameState, c: Culture): void {
	c.condition.history.push(snapshot(st, c));
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
