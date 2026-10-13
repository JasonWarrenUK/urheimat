import type { GameState, PoolId } from '$lib/types';
import { MANURE, POOL_FLOOR, POOLS } from './figures';

// The resource pools of a tile (6SL.6): soil, pasture, game, fish and wild plants, each a fraction of
// full. A pool lives where the resource lives, so a band that moves leaves a drawn-down tile to
// recover and a band that arrives inherits what is there. Several sources share a pool (the hoe and
// the plough share the soil), and a tile's pools are stored sparsely and read as full by default.
//
// A step is 25 years, so no fallow cycle is modelled. What the step shows is the net outcome:
// working a pool lightly lets it recover, working it hard does not, and a tile left alone recovers.

export const tileKey = (x: number, y: number): string => `${x},${y}`;

export const stockOf = (st: GameState, x: number, y: number, pool: PoolId): number => st.map.stocks[tileKey(x, y)]?.[pool] ?? 1;

function setStock(st: GameState, x: number, y: number, pool: PoolId, value: number): void {
	const key = tileKey(x, y);
	(st.map.stocks[key] ??= {})[pool] = value;
}

// How a band worked one pool this step: `load` is the share of the pool's full ceiling its sources
// used, `drawn` the stock taken (each source's load times its draw) and `herds` the load the herds on
// the tile put on the pasture, which feeds the soil.
export interface PoolUse {
	load: number;
	drawn: number;
	herds: number;
}

// One step of one pool. The band draws the stock down in proportion to its load, then the pool
// regrows in proportion to what the load left unused: soil and pasture and plants toward full at
// their rate, game and fish in proportion to what remains, so a pool driven near zero recovers very
// slowly. Herds on the tile add to the soil's regrowth.
export function stepPool(pool: PoolId, stock: number, use: PoolUse, soilManure = 0): number {
	const figures = POOLS[pool];
	const left = Math.max(0, stock - use.drawn);
	const idle = 1 - Math.min(1, use.load);
	const regrowth = figures.breeds ? figures.regrow * idle * left * (1 - left) : figures.regrow * idle * (1 - left);
	const manure = pool === 'soil' ? MANURE * soilManure * (1 - left) : 0;
	return Math.max(POOL_FLOOR, Math.min(1, left + regrowth + manure));
}

// The tile's pools after a band worked them this step. A pool the band did not use still regrows.
export function workTile(st: GameState, x: number, y: number, use: Partial<Record<PoolId, PoolUse>>): void {
	const herds = use.pasture?.herds ?? 0;
	(Object.keys(POOLS) as PoolId[]).forEach((pool) => {
		const next = stepPool(pool, stockOf(st, x, y, pool), use[pool] ?? { load: 0, drawn: 0, herds: 0 }, herds);
		setStock(st, x, y, pool, next);
	});
}

// Every recorded tile that no band worked this step regrows with nothing drawn, so a tile a band has
// left recovers.
export function idleTiles(st: GameState, worked: ReadonlySet<string>): void {
	Object.entries(st.map.stocks).forEach(([key, pools]) => {
		if (worked.has(key)) return;
		(Object.keys(pools) as PoolId[]).forEach((pool) => {
			pools[pool] = stepPool(pool, pools[pool] ?? 1, { load: 0, drawn: 0, herds: 0 });
		});
	});
}
