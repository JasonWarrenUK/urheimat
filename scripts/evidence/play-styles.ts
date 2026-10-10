// Evidence script for the 2DS.1 gameplay-loop spike (docs/spikes/2DS.1-gameplay-loop.md).
// Run with: bun run scripts/evidence/play-styles.ts
// The order menu is gone (6SL.2): a step carries a move and answers, and until 6SL.3 raises
// situations the only policies worth comparing are staying put and moving on.

import { newGame, begin, startTiles, endEra, defaultStep, reconstruct, freeLand, SLOTS, FEATURE_COUNT, sameSet } from '../../src/lib/sim/engine';

type St = ReturnType<typeof newGame>;
type Policy = (st: St, era: number) => ReturnType<typeof defaultStep>;

const player = (st: St) => st.cultures[st.playerId as number];
const freeNeighbours = (st: St) => {
	const p = player(st), out: { x: number; y: number }[] = [];
	for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
		if ((dx || dy) && freeLand(st, p.x + dx, p.y + dy)) out.push({ x: p.x + dx, y: p.y + dy });
	return out;
};

const policies: Record<string, Policy> = {
	passive: () => defaultStep(),
	migrateAlways: (st, era) => {
		const s = defaultStep(), n = freeNeighbours(st);
		if (n.length) s.move = n[(st.seed + era) % n.length];
		return s;
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
		while (!st.over) endEra(st, player(st).alive ? policy(st, st.era) : defaultStep());
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
