import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/pools';
import type { GameState } from '$lib/types';
import { POOL_FLOOR } from './figures';
import { begin, newGame, startTiles } from './engine';
import { deserialiseState, serialiseState } from './serialise';
import { idleTiles, stepPool, stockOf, tileKey, workTile } from './pools';

function fresh(): GameState {
	const st = newGame(fixtures.seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	return st;
}

describe('one pool for one step', () => {
	it('leaves an untouched full pool full', () => {
		expect(stepPool('pasture', 1, fixtures.unused)).toBe(1);
	});
	it('draws a heavily worked pool down and lets a lightly worked one recover', () => {
		expect(stepPool('pasture', 1, fixtures.heavy)).toBeLessThan(1);
		const worn = stepPool('soil', 0.5, fixtures.heavy);
		expect(worn).toBeLessThan(0.5);
		expect(stepPool('soil', 0.5, fixtures.light)).toBeGreaterThan(0.5);
	});
	it('regrows a pool nobody works toward full, never past it', () => {
		const once = stepPool('plants', 0.4, fixtures.unused);
		expect(once).toBeGreaterThan(0.4);
		expect(stepPool('plants', once, fixtures.unused)).toBeLessThanOrEqual(1);
	});
	it('lets a breeding pool near zero recover far more slowly than a plain one', () => {
		const plain = stepPool('pasture', 0.05, fixtures.unused) - 0.05;
		const breeding = stepPool('game', 0.05, fixtures.unused) - 0.05;
		expect(breeding).toBeGreaterThan(0);
		expect(breeding).toBeLessThan(plain / 5);
	});
	it('adds herd manure to the soil and to nothing else', () => {
		expect(stepPool('soil', 0.5, fixtures.unused, 1)).toBeGreaterThan(stepPool('soil', 0.5, fixtures.unused, 0));
		expect(stepPool('fish', 0.5, fixtures.unused, 1)).toBe(stepPool('fish', 0.5, fixtures.unused, 0));
	});
	it('never falls below the floor', () => {
		expect(stepPool('game', 0, { load: 1, drawn: 5, herds: 0 })).toBe(POOL_FLOOR);
	});
});

describe('tiles on the map', () => {
	it('reads a tile no one has worked as full and stores only what has been worked', () => {
		const st = fresh();
		expect(stockOf(st, 3, 3, 'soil')).toBe(1);
		expect(st.map.stocks).toEqual({});
		workTile(st, 3, 3, { soil: fixtures.heavy });
		expect(stockOf(st, 3, 3, 'soil')).toBeLessThan(1);
		expect(Object.keys(st.map.stocks)).toEqual([tileKey(3, 3)]);
	});
	it('lets a tile that was left recover, while a worked tile does not', () => {
		const st = fresh();
		workTile(st, 3, 3, { soil: fixtures.heavy });
		workTile(st, 4, 4, { soil: fixtures.heavy });
		const worn = stockOf(st, 3, 3, 'soil'),
			held = stockOf(st, 4, 4, 'soil');
		idleTiles(st, new Set([tileKey(4, 4)]));
		expect(stockOf(st, 3, 3, 'soil')).toBeGreaterThan(worn);
		expect(stockOf(st, 4, 4, 'soil')).toBe(held);
	});
	it('survives a save', () => {
		const st = fresh();
		workTile(st, 2, 5, { fish: fixtures.heavy });
		const back = deserialiseState(JSON.parse(JSON.stringify(serialiseState(st))), 8);
		expect(back?.map.stocks).toEqual(st.map.stocks);
	});
});
