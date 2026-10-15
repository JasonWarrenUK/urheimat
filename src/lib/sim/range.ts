import type { Culture, GameState } from '$lib/types';
import { FIELD_IDLE_STEPS, RANGE_MARGIN, REACH_FIELDS, REACH_ITINERANT } from './figures';
import { tileKey } from './pools';

// Range (6SL.6): the tiles a band works to feed itself. Densities are per km2 and a tile has an area,
// so a band needs as many tiles as its numbers require: a forager band of 30 about one, of 150 about
// five, a farming band a fraction of one. Scoped to food and livelihood: nothing here claims land
// against another band (tiles are a shared commons) or says anything about movement, splits or
// conflict, which a later task explores.
//
// Two behaviours, by way of life. Itinerant sources (the hunt, gathering, the catch and herds) pick
// their tiles afresh each step. Infrastructure sources (the hoe and the plough) work fields, tiles the
// band holds across steps because it has cleared them: added when it needs more, kept while worked, and
// given up only after they have gone unneeded several steps in a row.
//
// Pure: nothing is stored here. The caller stores the fields it is given back (conditionStep).

export interface Tile {
	x: number;
	y: number;
	key: string;
	distance: number;
}

// What one source asks of the land: the heads its hands can produce, how many a tile of it could feed
// at full pools, and how many at the pools' present stock.
export interface Demand {
	workable: number;
	itinerant: boolean;
	full: (t: Tile) => number;
	usable: (t: Tile) => number;
}

export interface Chosen {
	perSource: Tile[][]; // the tiles each demand works, in the demands' order
	fields: string[]; // the fields the band holds after this step
	fieldIdle: number;
}

// The land tiles within `reach` of the band's seat, nearest first, the seat always first. Water is
// never taken, nor another live band's seat (the engine forbids two bands on one tile).
export function candidates(st: GameState, c: Culture, reach: number, ignoreSeats = false): Tile[] {
	const h = st.map.tiles.length,
		w = st.map.tiles[0].length;
	const seats = new Set(ignoreSeats ? [] : st.cultures.filter((k) => k.alive && k.id !== c.id).map((k) => tileKey(k.x, k.y)));
	const out: Tile[] = [];
	for (let dy = -reach; dy <= reach; dy++)
		for (let dx = -reach; dx <= reach; dx++) {
			const x = c.x + dx,
				y = c.y + dy;
			if (x < 0 || y < 0 || x >= w || y >= h || st.map.tiles[y][x] === 'water') continue;
			const key = tileKey(x, y);
			if (seats.has(key)) continue;
			out.push({ x, y, key, distance: Math.max(Math.abs(dx), Math.abs(dy)) });
		}
	// A fixed order, so nothing depends on which band is asked first: distance, then row-major.
	return out.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);
}

const sum = (tiles: readonly Tile[], f: (t: Tile) => number): number => tiles.reduce((n, t) => n + f(t), 0);

// The tiles one itinerant source works: the seat, then the nearest tiles (the richest first among
// those at one distance) until what they can feed covers what the band can work, with a margin.
function itinerant(cands: readonly Tile[], d: Demand): Tile[] {
	const seat = cands.find((t) => t.distance === 0);
	const taken: Tile[] = seat ? [seat] : [];
	const want = d.workable * RANGE_MARGIN;
	const rest = cands.filter((t) => t !== seat).sort((a, b) => a.distance - b.distance || d.usable(b) - d.usable(a) || a.y - b.y || a.x - b.x);
	for (const t of rest) {
		if (sum(taken, d.usable) >= want) break;
		taken.push(t);
	}
	return taken;
}

// The fields the band holds after this step. Held fields stay while they lie within reach; more are
// added nearest first when the crops cannot be fed from them; the last added is given up after the
// band has done without it for FIELD_IDLE_STEPS steps in a row.
function fieldsFor(c: Culture, crops: readonly Demand[], reach: Tile[]): { tiles: Tile[]; idle: number } {
	if (!crops.length) return { tiles: [], idle: 0 };
	const byKey = new Map(reach.map((t) => [t.key, t]));
	const seat = reach.find((t) => t.distance === 0);
	const held = c.condition.fields.map((k) => byKey.get(k)).filter((t): t is Tile => t !== undefined && t !== seat);
	const tiles: Tile[] = [...(seat ? [seat] : []), ...held];
	const covered = (set: readonly Tile[]): boolean => crops.every((d) => sum(set, d.usable) >= d.workable * RANGE_MARGIN);
	const free = reach.filter((t) => !tiles.includes(t));
	while (!covered(tiles) && free.length) tiles.push(free.shift() as Tile);
	if (tiles.length > 1 && covered(tiles.slice(0, -1))) {
		const idle = c.condition.fieldIdle + 1;
		return idle >= FIELD_IDLE_STEPS ? { tiles: tiles.slice(0, -1), idle: 0 } : { tiles, idle };
	}
	return { tiles, idle: 0 };
}

// Where every demand of a band works. `ignoreSeats` lets the home people be measured before any band
// has a seat.
export function chooseTiles(st: GameState, c: Culture, demands: readonly Demand[], ignoreSeats = false): Chosen {
	const wide = candidates(st, c, REACH_ITINERANT, ignoreSeats);
	const close = candidates(st, c, REACH_FIELDS, ignoreSeats);
	const crops = demands.filter((d) => !d.itinerant);
	const fields = fieldsFor(c, crops, close);
	return {
		perSource: demands.map((d) => (d.itinerant ? itinerant(wide, d) : fields.tiles)),
		fields: fields.tiles.map((t) => t.key),
		fieldIdle: fields.idle
	};
}
