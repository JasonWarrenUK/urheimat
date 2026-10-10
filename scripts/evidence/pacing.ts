// Evidence script for the 2DS.1 gameplay-loop spike (docs/spikes/2DS.1-gameplay-loop.md).
// Run with: bun run scripts/evidence/pacing.ts

import { newGame, begin, startTiles, endEra, defaultStep, strainCount, FEATURE_COUNT } from '../../src/lib/sim/engine';

// Passive play, 400 seeds: what changes era by era with no orders at all.
const SEEDS = 400, ERAS = 8;
const kept = Array(ERAS + 1).fill(0), keptN = Array(ERAS + 1).fill(0);
const changes = Array(ERAS + 1).fill(0), alive = Array(ERAS + 1).fill(0), strain = Array(ERAS + 1).fill(0);
const deaths = Array(ERAS + 1).fill(0), splits = Array(ERAS + 1).fill(0), prosp = Array(ERAS + 1).fill(0);
for (let seed = 1; seed <= SEEDS; seed++) {
	const st = newGame(seed);
	const tiles = startTiles(st);
	const t = tiles[seed % tiles.length];
	begin(st, t.x, t.y);
	const p = st.cultures[st.playerId as number];
	const key = (flat: number[][]) => flat.map((v) => v.join('+'));
	const truth = key(st.ancestral.flat());
	for (let era = 1; era <= ERAS; era++) {
		const before = key(p.traits.flat()), nBefore = st.cultures.length, aliveBefore = st.cultures.filter((c) => c.alive).length;
		endEra(st, defaultStep());
		splits[era] += st.cultures.length - nBefore;
		deaths[era] += aliveBefore + (st.cultures.length - nBefore) - st.cultures.filter((c) => c.alive).length;
		alive[era] += st.cultures.filter((c) => c.alive).length;
		if (p.alive) {
			const after = key(p.traits.flat());
			changes[era] += after.filter((v, i) => v !== before[i]).length;
			kept[era] += after.filter((v, i) => v === truth[i]).length;
			strain[era] += strainCount(st, p);
			prosp[era] += p.prosperity;
			keptN[era]++;
		}
	}
}
const rows = [];
for (let era = 1; era <= ERAS; era++)
	rows.push({
		era,
		'parts changed in player band': (changes[era] / keptN[era]).toFixed(1),
		'original parts still kept': `${(kept[era] / keptN[era]).toFixed(1)} of ${FEATURE_COUNT}`,
		'parts straining': (strain[era] / keptN[era]).toFixed(1),
		prosperity: (prosp[era] / keptN[era]).toFixed(1),
		'bands alive': (alive[era] / SEEDS).toFixed(1),
		'splits': (splits[era] / SEEDS).toFixed(2),
		'deaths': (deaths[era] / SEEDS).toFixed(2)
	});
console.table(rows);
