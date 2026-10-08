import type {
	Culture,
	CultureTraits,
	Drive,
	GameMap,
	GameState,
	MapTerrain,
	Orders,
	PartValue,
	Point,
	ReconstructionResult,
	Rng,
	Terrain
} from '$lib/types';
import { heldCount, isActive, isActiveIn, isAvailable, isAvailableIn } from './predicates';
import { partTable } from './similarity';
import { AFF_WEIGHT, FEATURE_COUNT, LAND, RICHNESS, SLOTS } from './slots';

export function rngFrom(seed: number, state?: number): Rng {
	let a = (state ?? seed) | 0;
	const r = (() => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		r.state = a;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}) as Rng;
	r.state = a;
	return r;
}

const pick = <T>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];

function weighted<T>(r: () => number, items: T[], w: number[]): T {
	const tot = w.reduce((a, b) => a + b, 0);
	let x = r() * tot;
	for (let i = 0; i < items.length; i++) {
		x -= w[i];
		if (x <= 0) return items[i];
	}
	return items[items.length - 1];
}

const aff = (slot: number, f: number, v: number, terrain: MapTerrain): number => {
	const a = SLOTS[slot].features[f].values[v].aff;
	return a ? AFF_WEIGHT[a[terrain as Terrain] ?? 'allows'] : 1;
};
// The land strains against a value it resists or excludes.
export const strains = (slot: number, f: number, v: number, terrain: MapTerrain): boolean => aff(slot, f, v, terrain) < 1;
const isNeutral = (slot: number, f: number, v: number): boolean => !SLOTS[slot].features[f].values[v].aff;
// A dormant part renders as '' for the slot's render to drop, a lost one as '…'. Dormancy is checked
// first: a lost part in a stage that cannot exist is nothing, not an unknown.
// A set renders its members joined by commas; an empty set renders nothing.
export const render = (slot: number, fv: (PartValue | null)[]): string =>
	SLOTS[slot].render(fv.map((v, f) => (!isActiveIn(SLOTS[slot], fv, f) ? '' : v === null ? '…' : v.map((vi) => SLOTS[slot].features[f].values[vi].name).join(', '))));
export const vname = (slot: number, f: number, v: number): string => SLOTS[slot].features[f].values[v].name;
export const setName = (slot: number, f: number, v: readonly number[]): string => v.map((vi) => vname(slot, f, vi)).join(', ');
const clone = (traits: CultureTraits): CultureTraits => traits.map((fv) => fv.map((v) => v.slice()));
// Two held sets are the same when they hold the same members, in any order.
export const sameSet = (a: readonly number[], b: readonly number[]): boolean => a.length === b.length && a.every((v) => b.includes(v));
export const sameCustom = (a: readonly PartValue[], b: readonly PartValue[]): boolean => a.every((v, i) => sameSet(v, b[i]));
const setKey = (v: readonly number[]): string => [...v].sort((x, y) => x - y).join(',');
const isSetPart = (slot: number, f: number): boolean => SLOTS[slot].features[f].size !== undefined;

// ---------- names ----------
const CONS = ['k', 't', 'r', 's', 'm', 'n', 'w', 'd', 'g', 'th', 'l', 'v', 'b', 'h'];
const VOW = ['a', 'e', 'i', 'o', 'u', 'ai', 'au', 'ei'];
function genName(r: () => number, syl: number): string {
	let s = '';
	for (let i = 0; i < syl; i++) s += pick(r, CONS) + pick(r, VOW);
	if (r() < 0.5) s += pick(r, ['r', 'n', 's', 'th', 'l']);
	return s[0].toUpperCase() + s.slice(1);
}

// ---------- map ----------
export const W = 9;
export const H = 7;

function genMap(r: () => number): GameMap {
	const noise = (): number[][] => {
		const g: number[][] = [];
		for (let y = 0; y < H; y++) {
			g.push([]);
			for (let x = 0; x < W; x++) g[y].push(r());
		}
		return g;
	};
	const smooth = (g: number[][]): number[][] => {
		const o: number[][] = [];
		for (let y = 0; y < H; y++) {
			o.push([]);
			for (let x = 0; x < W; x++) {
				let s = 0,
					n = 0;
				for (let dy = -1; dy <= 1; dy++)
					for (let dx = -1; dx <= 1; dx++) {
						const yy = y + dy,
							xx = x + dx;
						if (yy >= 0 && yy < H && xx >= 0 && xx < W) {
							s += g[yy][xx];
							n++;
						}
					}
				o[y].push(s / n);
			}
		}
		return o;
	};
	const norm = (g: number[][]): number[][] => {
		let mn = Infinity,
			mx = -Infinity;
		g.forEach((row) =>
			row.forEach((v) => {
				mn = Math.min(mn, v);
				mx = Math.max(mx, v);
			})
		);
		return g.map((row) => row.map((v) => (v - mn) / (mx - mn || 1)));
	};
	const h = norm(smooth(smooth(noise())));
	const m = norm(smooth(noise()));
	const cx = 4,
		cy = 3;
	const tiles: MapTerrain[][] = [];
	for (let y = 0; y < H; y++) {
		tiles.push([]);
		for (let x = 0; x < W; x++) {
			const e = Math.min(x, W - 1 - x, y, H - 1 - y);
			let hv = h[y][x] - (e === 0 ? 0.16 : 0);
			if (Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1) hv = Math.max(hv, 0.45);
			let t: MapTerrain;
			if (hv < 0.19) t = 'water';
			else if (hv > 0.74) t = 'mountain';
			else {
				const mv = m[y][x];
				t = mv < 0.25 ? 'desert' : mv < 0.48 ? 'steppe' : mv < 0.68 ? 'forest' : mv < 0.84 ? 'river' : 'marsh';
			}
			tiles[y].push(t);
		}
	}
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			if (tiles[y][x] === 'water' || tiles[y][x] === 'mountain') continue;
			let sea = false;
			[
				[0, 1],
				[0, -1],
				[1, 0],
				[-1, 0]
			].forEach(([dx, dy]) => {
				const yy = y + dy,
					xx = x + dx;
				if (yy >= 0 && yy < H && xx >= 0 && xx < W && tiles[yy][xx] === 'water') sea = true;
			});
			if (sea) tiles[y][x] = 'coast';
		}
	return { tiles, cx, cy };
}

const inb = (x: number, y: number): boolean => x >= 0 && x < W && y >= 0 && y < H;
export const dist = (a: Point, b: Point): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

export function contact(st: GameState, a: Culture, b: Culture): number {
	if (!a.alive || !b.alive) return 0;
	const d = dist(a, b);
	let base = d === 1 ? 1 : d === 2 ? 0.5 : d === 3 ? 0.2 : 0;
	const ta = st.map.tiles[a.y][a.x],
		tb = st.map.tiles[b.y][b.x];
	if (ta === 'mountain' || tb === 'mountain') base *= 0.5;
	if (d === 2) {
		const mx = (a.x + b.x) / 2,
			my = (a.y + b.y) / 2;
		if (Number.isInteger(mx) && Number.isInteger(my) && st.map.tiles[my][mx] === 'mountain') base *= 0.4;
	}
	if (ta === 'coast' && tb === 'coast' && d <= 4) base = Math.max(base, 0.35);
	return base;
}

// ---------- setup ----------
function genAncestral(r: () => number, terrain: MapTerrain): CultureTraits {
	// A homeland culture rarely carries what strains against its own land: excluded values never arise,
	// resisted ones are rare, strongly favoured ones are four times as likely as mildly favoured ones,
	// neutral parts are uniform.
	// Parts are chosen in order, so a staged act only takes what the earlier stages left in hand.
	return SLOTS.map((s, si) => {
		const fv: (PartValue | null)[] = s.features.map(() => null);
		s.features.forEach((f, fi) => {
			const open = f.values.map((_, vi) => isAvailableIn(s, fv, fi, vi));
			let w = f.values.map((_, vi) => {
				const a = aff(si, fi, vi, terrain);
				return open[vi] && a > 0 ? a * a : 0;
			});
			if (!w.some((x) => x > 0)) w = open.some(Boolean) ? open.map((o) => (o ? 1 : 0)) : w.map(() => 1);
			// A set part draws its size from its range, then that many distinct members. Only set parts
			// spend the extra draw, so ordinary parts keep their old random sequence.
			let n = 1;
			if (f.size) {
				const [min, max] = f.size;
				n = min + Math.floor(r() * (max - min + 1));
			}
			const held: number[] = [];
			const idx = f.values.map((_, vi) => vi);
			for (let k = 0; k < n && w.some((x) => x > 0); k++) {
				const vi = weighted(r, idx, w);
				held.push(vi);
				w = w.map((x, i) => (i === vi ? 0 : x));
			}
			fv[fi] = held;
		});
		return fv as PartValue[];
	});
}

function makeCulture(
	st: GameState,
	name: string,
	x: number,
	y: number,
	traits: CultureTraits,
	isPlayer: boolean
): Culture {
	const r = st.rng;
	const drive: Drive = { dx: pick(r, [-1, 0, 1]), dy: pick(r, [-1, 0, 1]), pref: pick(r, LAND) };
	return {
		id: st.cultures.length,
		name,
		x,
		y,
		traits: clone(traits),
		alive: true,
		isPlayer,
		prosperity: 6,
		conserv: 0.7 + r() * 0.7,
		drive,
		known: clone(st.ancestral),
		knownEra: 0,
		migrated: false,
		held: new Set(),
		bornEra: st.era,
		diedEra: null,
		parent: null
	};
}

export function freeLand(st: GameState, x: number, y: number): boolean {
	return inb(x, y) && st.map.tiles[y][x] !== 'water' && !st.cultures.some((c) => c.alive && c.x === x && c.y === y);
}

export function newGame(seed: number): GameState {
	const r = rngFrom(seed);
	const st: GameState = {
		seed,
		rng: r,
		era: 0,
		maxEra: 8,
		cultures: [],
		log: [],
		playerId: null,
		over: false,
		playerDead: false,
		map: genMap(r),
		peopleName: '',
		homeTerrain: 'steppe',
		ancestral: []
	};
	st.peopleName = genName(r, 2);
	st.homeTerrain = st.map.tiles[st.map.cy][st.map.cx];
	st.ancestral = genAncestral(r, st.homeTerrain);
	return st;
}

export function startTiles(st: GameState): Point[] {
	const out: Point[] = [];
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			const d = Math.max(Math.abs(x - st.map.cx), Math.abs(y - st.map.cy));
			if (d >= 1 && d <= 2 && st.map.tiles[y][x] !== 'water') out.push({ x, y });
		}
	return out;
}

export function begin(st: GameState, px: number, py: number): GameState {
	const r = st.rng;
	const p = makeCulture(st, genName(r, 2), px, py, st.ancestral, true);
	st.cultures.push(p);
	st.playerId = p.id;
	const cands = startTiles(st).filter((t) => !(t.x === px && t.y === py));
	for (let i = 0; i < 5 && cands.length; i++) {
		const t = cands.splice(Math.floor(r() * cands.length), 1)[0];
		st.cultures.push(makeCulture(st, genName(r, 2), t.x, t.y, st.ancestral, false));
	}
	st.era = 1;
	st.log.push({
		era: 0,
		text: `The ${st.peopleName} of the ${st.homeTerrain} scatter. Six bands set out; yours, the ${p.name}, go to the ${st.map.tiles[py][px]}.`
	});
	return st;
}

// ---------- the era ----------
function retention(_st: GameState, c: Culture): number {
	let rt = 5 * c.conserv;
	const ruler = vname(9, 0, c.traits[9][0][0]),
		keeper = vname(15, 0, c.traits[15][0][0]);
	if (ruler === 'A priest-judge') rt += 1.5;
	if (ruler === 'A sacral king') rt += 1;
	if (keeper === 'Carved stones') rt += 1;
	if (keeper === 'Poets of praise and blame' || keeper === 'Sung genealogies') rt += 0.5;
	if (c.migrated) rt -= 2;
	return Math.max(2, rt);
}

// One entry per strained member, so a set with two strained members appears twice.
export function strainedFeatures(st: GameState, c: Culture): [number, number][] {
	const t = st.map.tiles[c.y][c.x];
	const out: [number, number][] = [];
	c.traits.forEach((fv, si) =>
		fv.forEach((v, fi) => {
			if (isActive(c.traits, si, fi)) v.forEach((vi) => strains(si, fi, vi, t) && out.push([si, fi]));
		})
	);
	return out;
}
export const strainCount = (st: GameState, c: Culture): number => strainedFeatures(st, c).length;

function tryMove(st: GameState, c: Culture, x: number, y: number): boolean {
	if (!freeLand(st, x, y) || dist(c, { x, y }) !== 1) return false;
	c.x = x;
	c.y = y;
	c.migrated = true;
	return true;
}

function aiMove(st: GameState, c: Culture): void {
	const r = st.rng,
		p = st.era <= 4 ? 0.5 : 0.2;
	if (r() > p) return;
	let best: Point | null = null,
		bs = 0.5;
	for (let dy = -1; dy <= 1; dy++)
		for (let dx = -1; dx <= 1; dx++) {
			if (!dx && !dy) continue;
			const x = c.x + dx,
				y = c.y + dy;
			if (!freeLand(st, x, y)) continue;
			let s = (st.map.tiles[y][x] === c.drive.pref ? 2 : 0) + (dx * c.drive.dx + dy * c.drive.dy) * 0.8 + r() * 0.5;
			if (st.map.tiles[c.y][c.x] === c.drive.pref) s -= 1.5;
			if (s > bs) {
				bs = s;
				best = { x, y };
			}
		}
	if (best && tryMove(st, c, best.x, best.y))
		st.log.push({ era: st.era, text: `The ${c.name} move to the ${st.map.tiles[best.y][best.x]}.` });
}

function trySplit(st: GameState, c: Culture, forced: boolean): Culture | null {
	const r = st.rng;
	if (!forced && !(c.prosperity >= 7 && st.era <= 6 && r() < 0.25)) return null;
	if (st.cultures.filter((k) => k.alive).length >= 10) return null;
	const opts: Point[] = [];
	for (let dy = -1; dy <= 1; dy++)
		for (let dx = -1; dx <= 1; dx++) {
			if (!dx && !dy) continue;
			if (freeLand(st, c.x + dx, c.y + dy)) opts.push({ x: c.x + dx, y: c.y + dy });
		}
	if (!opts.length) return null;
	const t = pick(r, opts);
	const d = makeCulture(st, genName(r, 2), t.x, t.y, c.traits, false);
	d.parent = c.id;
	d.prosperity = 4;
	d.migrated = true;
	if (c.isPlayer) d.conserv = 1.2 + r() * 0.3;
	d.known = clone(c.traits);
	d.knownEra = st.era;
	c.prosperity -= 2;
	st.cultures.push(d);
	st.log.push({ era: st.era, text: `A daughter band leaves the ${c.name}: the ${d.name}, on the ${st.map.tiles[t.y][t.x]}.` });
	return d;
}

interface DriftChange {
	slot: number;
	f: number;
	from: number;
	to: number;
	borrowed: boolean;
}

// Drift acts on one feature at a time. Neighbour states are the pre-era snapshot passed in.
// Set-valued parts are skipped: how a set changes is defined by the pressure system (6SL.3, 6SL.4).
function drift(st: GameState, c: Culture, snapshot: CultureTraits[]): DriftChange[] {
	const r = st.rng,
		t = st.map.tiles[c.y][c.x],
		rt = retention(st, c),
		changes: DriftChange[] = [];
	const nbs = st.cultures
		.filter((k) => k.alive && k.id !== c.id)
		.map((k) => ({ k, w: contact(st, c, k) }))
		.filter((n) => n.w > 0);
	SLOTS.forEach((slot, si) => {
		if (c.held.has(si)) return;
		slot.features.forEach((f, fi) => {
			if (!isActive(c.traits, si, fi) || isSetPart(si, fi)) return;
			if (r() > 0.35) return;
			const cur = c.traits[si][fi][0],
				neutral = isNeutral(si, fi, cur),
				near = partTable(si, fi);
			const scores = f.values.map((_v, vi) => {
				if (!isAvailableIn(slot, c.traits[si], fi, vi)) return 0;
				// The land's pull moves a custom by small steps to near values; untagged parts aren't scaled.
				let s = (near ? near[cur][vi] / 1000 : 1) * aff(si, fi, vi, t) + (neutral ? 0.3 : 0.05);
				nbs.forEach((n) => {
					if (snapshot[n.k.id][si][fi][0] === vi) s += 0.9 * n.w;
				});
				if (vi === cur) s += rt * (neutral ? 0.6 : 1);
				return s;
			});
			const nxt = weighted(
				r,
				f.values.map((_, vi) => vi),
				scores
			);
			if (nxt !== cur) {
				c.traits[si][fi] = [nxt];
				changes.push({ slot: si, f: fi, from: cur, to: nxt, borrowed: nbs.some((n) => snapshot[n.k.id][si][fi][0] === nxt) });
			}
		});
	});
	return changes;
}

function prosperityStep(st: GameState, c: Culture, consolidations: number): number {
	const t = st.map.tiles[c.y][c.x];
	let d = 1.1 - 5.0 * (strainCount(st, c) / heldCount(c.traits)) + RICHNESS[t as Terrain] + 1.5 * (consolidations || 0);
	if (c.migrated) d -= 1;
	d = Math.max(-2, Math.min(2.5, d));
	c.prosperity = Math.max(0, Math.min(10, c.prosperity + d));
	return d;
}

export function defaultOrders(): Orders {
	return { held: new Set(), reforms: {}, move: null, split: false, consolidate: 0, teach: null };
}

export function endEra(st: GameState, orders: Orders): GameState {
	orders = orders || defaultOrders();
	const p = st.cultures[st.playerId as number];
	st.cultures.forEach((c) => {
		c.migrated = false;
		c.held = new Set();
	});
	if (p.alive) {
		p.held = new Set(orders.held);
		Object.entries(orders.reforms).forEach(([key, v]) => {
			const [si, fi] = key.split(':').map(Number);
			if (!isSetPart(si, fi) && p.traits[si][fi][0] !== v) {
				st.log.push({
					era: st.era,
					text: `You reform ${SLOTS[si].name.toLowerCase()} (${SLOTS[si].features[fi].label}): <em>${vname(si, fi, p.traits[si][fi][0])}</em> gives way to <em>${vname(si, fi, v)}</em>.`
				});
				p.traits[si][fi] = [v];
				p.held.add(si);
			}
		});
		if (orders.move && tryMove(st, p, orders.move.x, orders.move.y))
			st.log.push({ era: st.era, text: `You lead the ${p.name} to the ${st.map.tiles[p.y][p.x]}.` });
		if (orders.split) trySplit(st, p, true);
		if (orders.teach) {
			const k = st.cultures[orders.teach.kin],
				si = orders.teach.slot;
			if (k && k.alive && contact(st, p, k) >= 0.5) {
				const restored: string[] = [];
				SLOTS[si].features.forEach((f, fi) => {
					if (sameSet(p.traits[si][fi], st.ancestral[si][fi]) && !sameSet(k.traits[si][fi], st.ancestral[si][fi])) {
						k.traits[si][fi] = st.ancestral[si][fi].slice();
						restored.push(f.label);
					}
				});
				if (restored.length) {
					k.held.add(si);
					k.known = clone(k.traits);
					k.knownEra = st.era;
					st.log.push({
						era: st.era,
						text: `Your elders go among the ${k.name} and restore ${SLOTS[si].name.toLowerCase()} (${restored.join(', ')}): <em>${render(si, k.traits[si])}</em> once more.`
					});
				}
			}
		}
	}
	st.cultures.filter((c) => c.alive && !c.isPlayer && c.bornEra < st.era).forEach((c) => aiMove(st, c));
	st.cultures.filter((c) => c.alive && !c.isPlayer && c.bornEra < st.era).forEach((c) => trySplit(st, c, false));
	const snapshot = st.cultures.map((c) => clone(c.traits));
	st.cultures
		.filter((c) => c.alive)
		.forEach((c) => {
			const ch = drift(st, c, snapshot);
			if (c.isPlayer)
				ch.forEach((x) =>
					st.log.push({
						era: st.era,
						text: `Among your people, ${SLOTS[x.slot].name.toLowerCase()} shifts (${SLOTS[x.slot].features[x.f].label}): <em>${vname(x.slot, x.f, x.from)}</em> becomes <em>${vname(x.slot, x.f, x.to)}</em>${x.borrowed ? ' — learned from neighbours' : ''}.`
					})
				);
		});
	st.cultures
		.filter((c) => c.alive)
		.forEach((c) => {
			prosperityStep(st, c, c.isPlayer ? orders.consolidate : 0);
			if (c.prosperity <= 0) {
				c.alive = false;
				c.diedEra = st.era;
				st.log.push({
					era: st.era,
					text: `The ${c.name} are no more; what they kept is lost.${c.isPlayer ? ' Your testimony ends here.' : ''}`
				});
				if (c.isPlayer) st.playerDead = true;
			}
		});
	if (p.alive)
		st.cultures.forEach((c) => {
			if (c.alive && !c.isPlayer && contact(st, p, c) >= 0.5) {
				c.known = clone(c.traits);
				c.knownEra = st.era;
			}
		});
	st.era++;
	if (st.era > st.maxEra) st.over = true;
	return st;
}

// ---------- the comparative method, feature by feature ----------
export function reconstruct(st: GameState): ReconstructionResult {
	const alive = st.cultures.filter((c) => c.alive);
	const terrainOf = (c: Culture) => st.map.tiles[c.y][c.x];
	const names = (cs: Culture[]) => cs.map((c) => 'the ' + c.name).join(', ');
	// Only parts live in the ancestral culture are scored; a band witnesses only the parts live in it.
	const entries = SLOTS.map((slot, si) => {
		const feats = slot.features.flatMap((f, fi) => {
			if (!isActive(st.ancestral, si, fi)) return [];
			// A part is recovered as a whole: bands agree when they hold the same set.
			const byVal = new Map<string, { v: PartValue; cs: Culture[] }>();
			alive.forEach((c) => {
				if (!isActive(c.traits, si, fi)) return;
				const v = c.traits[si][fi],
					key = setKey(v);
				if (!byVal.has(key)) byVal.set(key, { v, cs: [] });
				byVal.get(key)!.cs.push(c);
			});
			const cands = [...byVal.entries()]
				.map(([, { v, cs }]) => {
					const seen = new Set<number>();
					let comps = 0;
					cs.forEach((c) => {
						if (seen.has(c.id)) return;
						comps++;
						const stack = [c];
						seen.add(c.id);
						while (stack.length) {
							const a = stack.pop()!;
							cs.forEach((b) => {
								if (!seen.has(b.id) && contact(st, a, b) >= 0.75) {
									seen.add(b.id);
									stack.push(b);
								}
							});
						}
					});
					return { v, cs, witnesses: comps, terrains: new Set(cs.map(terrainOf)).size };
				})
				.sort((a, b) => b.witnesses - a.witnesses || b.terrains - a.terrains || b.cs.length - a.cs.length);
			const best = cands[0],
				truth = st.ancestral[si][fi];
			let rec: PartValue | null = null,
				conf: 'secure' | 'suspect' | null = null;
			if (best && best.witnesses >= 2 && best.terrains >= 2) {
				rec = best.v;
				conf = 'secure';
			} else if (best && best.witnesses >= 3) {
				rec = best.v;
				conf = 'suspect';
			}
			const verdict: 'lost' | 'correct' | 'wrong' = rec === null ? 'lost' : sameSet(rec, truth) ? 'correct' : 'wrong';
			const pts = verdict === 'correct' ? (conf === 'secure' ? 2 : 1) : verdict === 'wrong' ? -1 : 0;
			const survivors = byVal.get(setKey(truth))?.cs;
			let note: string;
			if (rec === null) {
				note = !alive.length
					? 'no descendant survived to be asked'
					: best && best.witnesses === 2
						? `${names(best.cs)} agree on <em>${setName(si, fi, best.v)}</em>, but on the same kind of land; left blank as possible convergence${sameSet(best.v, truth) ? ', though it was right' : ''}`
						: survivors
							? `only ${names(survivors)} kept it; one witness proves nothing`
							: 'no agreement, and nobody kept the old way';
			} else if (verdict === 'correct') {
				note = conf === 'secure' ? `${names(best.cs)}: different land, never met` : `${names(best.cs)}: same land, so marked doubtful`;
			} else {
				note = `${names(best.cs)} all hold it${best.terrains < 2 ? ', all on the same land' : ''}; the truth ${survivors ? 'survived only among ' + names(survivors) : 'died out'}`;
			}
			return [{ f: fi, label: f.label, rec, conf, truth, verdict, pts, note }];
		});
		const recFv = slot.features.map((_, fi) => feats.find((x) => x.f === fi)?.rec ?? null);
		return { slot: si, feats, pts: feats.reduce((a, x) => a + x.pts, 0), recFv };
	});
	const all = entries.flatMap((e) => e.feats);
	const total = all.reduce((a, e) => a + e.pts, 0);
	const counts = {
		correct: all.filter((e) => e.verdict === 'correct').length,
		wrong: all.filter((e) => e.verdict === 'wrong').length,
		lost: all.filter((e) => e.verdict === 'lost').length
	};
	return { entries, total, max: all.length * 2, counts, survivors: alive.length };
}

// per slot, per feature: the values a player may reform to (terrain-favoured, or practised by a neighbour in contact)
export function allowedReforms(st: GameState, c: Culture): number[][][] {
	const t = st.map.tiles[c.y][c.x];
	const nbs = st.cultures.filter((k) => k.alive && k.id !== c.id && contact(st, c, k) >= 0.5);
	return SLOTS.map((slot, si) =>
		slot.features.map((f, fi) =>
			!isActive(c.traits, si, fi) || isSetPart(si, fi)
				? []
				: f.values
				.map((_, vi) => vi)
				.filter(
					(vi) =>
						vi !== c.traits[si][fi][0] &&
						isAvailable(c.traits, si, fi, vi) &&
						!isNeutral(si, fi, vi) &&
						(!strains(si, fi, vi, t) || nbs.some((k) => k.traits[si][fi][0] === vi))
				)
		)
	);
}

export { SLOTS, FEATURE_COUNT, LAND };
export { aff, isNeutral, isSetPart };
