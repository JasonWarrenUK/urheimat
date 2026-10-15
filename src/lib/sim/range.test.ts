import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/range';
import type { Culture, GameState } from '$lib/types';
import { RANGE_MARGIN, REACH_FIELDS, REACH_ITINERANT } from './figures';
import { begin, newGame, startTiles } from './engine';
import { candidates, chooseTiles, type Demand } from './range';

function fresh(): { st: GameState; c: Culture } {
	const st = newGame(fixtures.seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	st.cultures.forEach((k) => !k.isPlayer && (k.alive = false));
	const c = st.cultures[st.playerId as number];
	st.map.tiles.forEach((row, y) => row.forEach((_, x) => (st.map.tiles[y][x] = 'steppe')));
	return { st, c };
}

// A source that gives every tile the same, so only the range rules decide what is taken.
const flat = (workable: number, itinerant = true, per = 10): Demand => ({ workable, itinerant, full: () => per, usable: () => per });
// The workable heads that need exactly this many flat tiles once the margin is applied.
const needing = (tiles: number): number => (10 * tiles) / RANGE_MARGIN - 0.001;

describe('candidates', () => {
	it('start at the seat and run outwards, in a fixed order', () => {
		const { st, c } = fresh();
		const tiles = candidates(st, c, REACH_ITINERANT);
		expect(tiles[0]).toMatchObject({ x: c.x, y: c.y, distance: 0 });
		expect(tiles.map((t) => t.distance)).toEqual([...tiles.map((t) => t.distance)].sort((a, b) => a - b));
		expect(tiles.every((t) => t.distance <= REACH_ITINERANT)).toBe(true);
		expect(candidates(st, c, REACH_ITINERANT).map((t) => t.key)).toEqual(tiles.map((t) => t.key));
	});
	it('leave out water and another live band\'s seat, and a shorter reach takes fewer', () => {
		const { st, c } = fresh();
		const all = candidates(st, c, REACH_ITINERANT);
		const next = all.find((t) => t.distance === 1)!;
		st.map.tiles[next.y][next.x] = 'water';
		const other = st.cultures.find((k) => !k.isPlayer)!;
		const seat = all.find((t) => t.distance === 2)!;
		other.alive = true;
		other.x = seat.x;
		other.y = seat.y;
		const kept = candidates(st, c, REACH_ITINERANT).map((t) => t.key);
		expect(kept).not.toContain(next.key);
		expect(kept).not.toContain(seat.key);
		expect(candidates(st, c, REACH_ITINERANT, true).map((t) => t.key)).toContain(seat.key);
		expect(candidates(st, c, REACH_FIELDS).length).toBeLessThan(candidates(st, c, REACH_ITINERANT).length);
	});
});

describe('itinerant sources', () => {
	it('take the seat alone when nothing needs more, and more tiles as the need grows', () => {
		const { st, c } = fresh();
		expect(chooseTiles(st, c, [flat(5)]).perSource[0].length).toBe(1);
		expect(chooseTiles(st, c, [flat(needing(3))]).perSource[0].length).toBe(3);
		expect(chooseTiles(st, c, [flat(needing(6))]).perSource[0].length).toBe(6);
	});
	it('are held to what lies within reach, and take the richest of tiles at one distance first', () => {
		const { st, c } = fresh();
		const reachable = candidates(st, c, REACH_ITINERANT).length;
		expect(chooseTiles(st, c, [flat(1e9)]).perSource[0].length).toBe(reachable);
		const rich = candidates(st, c, REACH_ITINERANT).find((t) => t.distance === 1 && t.x > c.x)!;
		const demand: Demand = { workable: needing(2), itinerant: true, full: (t) => (t.key === rich.key ? 50 : 10), usable: (t) => (t.key === rich.key ? 50 : 10) };
		expect(chooseTiles(st, c, [demand]).perSource[0].map((t) => t.key)).toContain(rich.key);
	});
	it('do not depend on the order the demands are given in', () => {
		const { st, c } = fresh();
		const a = chooseTiles(st, c, [flat(200), flat(60)]).perSource.map((s) => s.map((t) => t.key));
		const b = chooseTiles(st, c, [flat(60), flat(200)]).perSource.map((s) => s.map((t) => t.key));
		expect(a[0]).toEqual(b[1]);
		expect(a[1]).toEqual(b[0]);
	});
});

describe('fields', () => {
	it('are the seat, then nearest tiles within reach, shared by every crop', () => {
		const { st, c } = fresh();
		const chosen = chooseTiles(st, c, [flat(needing(3), false), flat(needing(2), false)]);
		expect(chosen.perSource[0]).toEqual(chosen.perSource[1]);
		expect(chosen.fields[0]).toBe(`${c.x},${c.y}`);
		expect(chosen.fields.length).toBe(3);
	});
	it('are kept while held, then released one at a time after three steps unneeded', () => {
		const { st, c } = fresh();
		const first = chooseTiles(st, c, [flat(needing(4), false)]);
		expect(first.fields.length).toBe(4);
		c.condition.fields = first.fields;
		let state = chooseTiles(st, c, [flat(5, false)]);
		expect(state.fields.length).toBe(4);
		for (let i = 0; i < 2; i++) {
			c.condition.fields = state.fields;
			c.condition.fieldIdle = state.fieldIdle;
			state = chooseTiles(st, c, [flat(5, false)]);
		}
		expect(state.fields.length).toBe(3);
		expect(state.fieldIdle).toBe(0);
	});
	it('are not held without a crop, and are lost when the band moves out of reach', () => {
		const { st, c } = fresh();
		expect(chooseTiles(st, c, [flat(50)]).fields).toEqual([]);
		c.condition.fields = ['0,0', '8,6'];
		const near = chooseTiles(st, c, [flat(5, false)]).fields;
		expect(near.every((k) => candidates(st, c, REACH_FIELDS).some((t) => t.key === k))).toBe(true);
	});
});
