// Evidence script for the 6SL.6 condition model (docs/spikes/6SL.6-condition-strands-log.md).
// Run with: bun run scripts/evidence/condition.ts [seeds]
//
// Passive play: what the headcount, food and deaths do over a run. Used to tune src/lib/sim/figures.ts
// against targets set by Jason (see the log): a typical band neither grows without limit nor starves
// out within a few steps; a plough band on a river beats one in forest; a band that stays fifteen
// steps draws its pools down; a move to fresh land recovers.

import { newGame, begin, startTiles, endEra, defaultStep } from '../../src/lib/sim/engine';
import { foodReading, heldSources } from '../../src/lib/sim/food';
import { stockOf } from '../../src/lib/sim/pools';

const SEEDS = Number(process.argv[2] ?? 200),
	ERAS = 15;

const numbers = Array(ERAS + 1).fill(0), adequacy = Array(ERAS + 1).fill(0), reserve = Array(ERAS + 1).fill(0), health = Array(ERAS + 1).fill(0);
const alive = Array(ERAS + 1).fill(0), bands = Array(ERAS + 1).fill(0), pools = Array(ERAS + 1).fill(0);
const deaths: Record<string, number> = {};
let runs = 0;
for (let seed = 1; seed <= SEEDS; seed++) {
	const st = newGame(seed);
	const t = startTiles(st);
	const start = t[seed % t.length];
	begin(st, start.x, start.y);
	const p = st.cultures[st.playerId as number];
	runs++;
	for (let era = 1; era <= ERAS; era++) {
		endEra(st, defaultStep());
		const live = st.cultures.filter((c) => c.alive);
		bands[era] += live.length;
		live.forEach((c) => {
			numbers[era] += c.condition.numbers;
			adequacy[era] += Math.min(foodReading(st, c).adequacy, 5);
			reserve[era] += c.condition.buffer;
			health[era] += c.condition.health;
			alive[era]++;
		});
		if (p.alive) {
			const held = heldSources(p);
			if (held.length) pools[era] += held.reduce((n, s) => n + stockOf(st, p.x, p.y, s.id === 'crop/hoe' || s.id === 'crop/plough' ? 'soil' : s.id.startsWith('herds') ? 'pasture' : s.id === 'catch' ? 'fish' : s.id === 'hunt' ? 'game' : 'plants'), 0) / held.length;
		}
	}
	st.bandEvents.filter((e) => e.kind === 'death').forEach((e) => (deaths[e.reason] = (deaths[e.reason] ?? 0) + 1));
}
const rows = [];
for (let era = 1; era <= ERAS; era++)
	rows.push({
		era,
		'bands alive': (bands[era] / runs).toFixed(1),
		'mean headcount': (numbers[era] / alive[era]).toFixed(0),
		'mean adequacy': (adequacy[era] / alive[era]).toFixed(2),
		'mean reserve': (reserve[era] / alive[era]).toFixed(3),
		'mean health': (health[era] / alive[era]).toFixed(1)
	});
console.table(rows);
console.log('deaths by reason over', runs, 'runs:', deaths);
