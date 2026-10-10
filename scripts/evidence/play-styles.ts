// Evidence script for the 2DS.1 gameplay-loop spike (docs/spikes/2DS.1-gameplay-loop.md).
// Run with: bun run scripts/evidence/play-styles.ts

import {
	newGame, begin, startTiles, endEra, defaultOrders, reconstruct, strainedFeatures,
	freeLand, contact, SLOTS, FEATURE_COUNT, aff, sameSet
} from '../../src/lib/sim/engine';

type St = ReturnType<typeof newGame>;
type Policy = (st: St, era: number) => ReturnType<typeof defaultOrders>;

const player = (st: St) => st.cultures[st.playerId as number];
const ancestralSlots = (st: St) =>
	SLOTS.map((_, si) => si).filter((si) => player(st).traits[si].every((v, fi) => sameSet(v, st.ancestral[si][fi])));
const freeNeighbours = (st: St) => {
	const p = player(st), out: { x: number; y: number }[] = [];
	for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
		if ((dx || dy) && freeLand(st, p.x + dx, p.y + dy)) out.push({ x: p.x + dx, y: p.y + dy });
	return out;
};

const policies: Record<string, Policy> = {
	passive: () => defaultOrders(),
	consolidate3: () => ({ ...defaultOrders(), consolidate: 3 }),
	hold3: (st) => {
		// hold still-ancestral customs, those with a straining part first
		const strained = new Set(strainedFeatures(st, player(st)).map(([si]) => si));
		const slots = ancestralSlots(st).sort((a, b) => Number(strained.has(b)) - Number(strained.has(a)));
		return { ...defaultOrders(), held: new Set(slots.slice(0, 3)) };
	},
	splitWhenAble: (st) => {
		const o = defaultOrders();
		if (player(st).prosperity >= 4 && freeNeighbours(st).length) { o.split = true; o.consolidate = 2; }
		else o.consolidate = 3;
		return o;
	},
	reformStrain: (st) => {
		// trade truth for comfort: reform up to 3 straining parts to the most favoured value
		const p = player(st), t = st.map.tiles[p.y][p.x], o = defaultOrders();
		strainedFeatures(st, p).slice(0, 3).forEach(([si, fi]) => {
			let best = -1, bs = 0;
			SLOTS[si].features[fi].values.forEach((_, vi) => { const a = aff(si, fi, vi, t); if (a > bs) { bs = a; best = vi; } });
			if (best >= 0) o.reforms[`${si}:${fi}`] = best;
		});
		o.consolidate = 3 - Object.keys(o.reforms).length;
		return o;
	},
	migrateAlways: (st, era) => {
		const o = defaultOrders(), n = freeNeighbours(st);
		if (n.length) o.move = n[(st.seed + era) % n.length];
		o.consolidate = 2;
		return o;
	},
	teachElseHold: (st) => {
		const p = player(st), o = defaultOrders();
		outer: for (const k of st.cultures) {
			if (k.isPlayer || !k.alive || contact(st, p, k) < 0.5) continue;
			for (let si = 0; si < SLOTS.length; si++) {
				if (SLOTS[si].features.some((_, fi) => sameSet(p.traits[si][fi], st.ancestral[si][fi]) && !sameSet(k.traits[si][fi], st.ancestral[si][fi]))) {
					o.teach = { kin: k.id, slot: si };
					break outer;
				}
			}
		}
		const strained = new Set(strainedFeatures(st, p).map(([si]) => si));
		const slots = ancestralSlots(st).sort((a, b) => Number(strained.has(b)) - Number(strained.has(a)));
		o.held = new Set(slots.slice(0, o.teach ? 2 : 3));
		return o;
	}
};

const SEEDS = 400;
const rows: Record<string, unknown>[] = [];
const perSeed: Record<string, number[]> = {};
for (const [name, policy] of Object.entries(policies)) {
	const pct: number[] = [];
	let correct = 0, wrong = 0, lost = 0, survivors = 0, dead = 0, playerKept = 0;
	for (let seed = 1; seed <= SEEDS; seed++) {
		const st = newGame(seed);
		const tiles = startTiles(st);
		const t = tiles[seed % tiles.length];
		begin(st, t.x, t.y);
		while (!st.over) endEra(st, player(st).alive ? policy(st, st.era) : defaultOrders());
		const res = reconstruct(st);
		pct.push((100 * res.total) / res.max);
		correct += res.counts.correct; wrong += res.counts.wrong; lost += res.counts.lost;
		survivors += res.survivors;
		if (st.playerDead) dead++;
		const p = player(st);
		playerKept += p.traits.flat().filter((v, i) => sameSet(v, st.ancestral.flat()[i])).length;
	}
	perSeed[name] = pct;
	const sorted = [...pct].sort((a, b) => a - b);
	const mean = pct.reduce((a, b) => a + b, 0) / SEEDS;
	const sd = Math.sqrt(pct.reduce((a, b) => a + (b - mean) ** 2, 0) / SEEDS);
	rows.push({
		policy: name,
		'score% mean': mean.toFixed(1),
		sd: sd.toFixed(1),
		p10: sorted[Math.floor(SEEDS * 0.1)].toFixed(0),
		p90: sorted[Math.floor(SEEDS * 0.9)].toFixed(0),
		correct: (correct / SEEDS).toFixed(1),
		wrong: (wrong / SEEDS).toFixed(1),
		lost: (lost / SEEDS).toFixed(1),
		survivors: (survivors / SEEDS).toFixed(1),
		'player dead%': ((100 * dead) / SEEDS).toFixed(0),
		'player kept': (playerKept / SEEDS).toFixed(1)
	});
}
console.log('features:', FEATURE_COUNT, 'slots:', SLOTS.length, 'seeds:', SEEDS);
console.table(rows);
// how often does each policy beat passive on the same seed
for (const name of Object.keys(policies)) {
	if (name === 'passive') continue;
	const wins = perSeed[name].filter((v, i) => v > perSeed.passive[i]).length;
	const losses = perSeed[name].filter((v, i) => v < perSeed.passive[i]).length;
	console.log(`${name} vs passive, same seed: better ${wins}, worse ${losses}, equal ${SEEDS - wins - losses}`);
}
