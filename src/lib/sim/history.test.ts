import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/history';
import type { GameState } from '$lib/types';
import { begin, defaultStep, endEra, freeLand, newGame, startTiles } from './engine';
import { foodReading } from './food';
import { customTurningPoints, record, seatAt, snapshot } from './history';
import { change } from './pressures';
import { apply } from './storylets';

// 4SD.15: the history 6SL.6 started also tells where each band stood and what it practised at every
// step, and dates every change to a custom as an event, so both notebooks can read customs over
// time, routes and turning points rather than the final state alone.

function fresh(seed = fixtures.seed): GameState {
	const st = newGame(seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	return st;
}
const player = (st: GameState) => st.cultures[st.playerId as number];
const customEvents = (st: GameState) => st.bandEvents.filter((e) => e.kind === 'custom');

// A part with at least two values, so a change is always possible.
function changeable(st: GameState): [number, number, number] {
	const c = player(st);
	for (let si = 0; si < c.traits.length; si++)
		for (let fi = 0; fi < c.traits[si].length; fi++) {
			const held = c.traits[si][fi];
			if (held.length === 1 && held[0] !== 0) return [si, fi, 0];
			if (held.length === 1) return [si, fi, 1];
		}
	throw new Error('no ordinary part to change');
}

describe('snapshots', () => {
	it('carry the seat and the customs as copies the band cannot later alter', () => {
		const st = fresh(),
			c = player(st);
		const snap = snapshot(st, c, foodReading(st, c));
		expect([snap.x, snap.y]).toEqual([c.x, c.y]);
		expect(snap.traits).toEqual(c.traits);
		expect(snap.absent).toEqual([]);
		const [si, fi, vi] = changeable(st);
		c.traits[si][fi].push(vi);
		c.absent.push('cult');
		expect(snap.traits[si][fi]).not.toContain(vi);
		expect(snap.absent).toEqual([]);
	});
	it('record where a band stood at the end of each step, after its move', () => {
		const st = fresh(),
			c = player(st);
		let to: { x: number; y: number } | null = null;
		for (let dy = -1; dy <= 1 && !to; dy++)
			for (let dx = -1; dx <= 1 && !to; dx++) if ((dx || dy) && freeLand(st, c.x + dx, c.y + dy)) to = { x: c.x + dx, y: c.y + dy };
		expect(to).not.toBeNull();
		endEra(st, { move: to, answers: {} });
		expect(seatAt(c, 1)).toEqual(to);
		expect(seatAt(c, 2)).toBeNull();
	});
});

describe('custom change events', () => {
	it('date a changed part with what it held before and after', () => {
		const st = fresh(),
			c = player(st);
		const [si, fi, vi] = changeable(st);
		const before = c.traits[si][fi].slice();
		st.era = 3;
		change(st, c, si, fi, [vi]);
		const [e] = customEvents(st);
		expect(e.band).toBe(c.id);
		expect(e.step).toBe(3);
		expect(e.change).toEqual({ custom: si, part: fi, from: before, to: [vi] });
		expect(e.reason).toContain(' to ');
	});
	it('leave nothing when a part is set to what it already holds', () => {
		const st = fresh(),
			c = player(st);
		const [si, fi] = changeable(st);
		change(st, c, si, fi, c.traits[si][fi].slice());
		expect(customEvents(st)).toEqual([]);
	});
	it('date a custom lost and regained, once each', () => {
		const st = fresh(),
			c = player(st);
		apply(st, c, [{ lose: 'cult' }, { lose: 'cult' }]);
		expect(customEvents(st).map((e) => e.reason)).toEqual(['cult: lost']);
		apply(st, c, [{ gain: 'cult' }, { gain: 'cult' }]);
		expect(customEvents(st).map((e) => e.reason)).toEqual(['cult: lost', 'cult: regained']);
	});
});

describe('turning points', () => {
	it('are the steps whose customs differ from the step before, read from the snapshots', () => {
		const st = fresh(),
			c = player(st),
			food = foodReading(st, c);
		const [si, fi, vi] = changeable(st);
		for (st.era = 1; st.era <= 4; st.era++) {
			if (st.era === 3) change(st, c, si, fi, [vi]);
			if (st.era === 4) apply(st, c, [{ lose: 'cult' }]);
			record(st, c, food);
		}
		expect(customTurningPoints(c)).toEqual([3, 4]);
	});
	it('is empty across a run in which nothing changed', () => {
		const st = fresh();
		for (let i = 0; i < 3; i++) endEra(st, defaultStep());
		const c = player(st);
		expect(c.condition.history.length).toBe(3);
		if (customEvents(st).every((e) => e.band !== c.id)) expect(customTurningPoints(c)).toEqual([]);
	});
});
