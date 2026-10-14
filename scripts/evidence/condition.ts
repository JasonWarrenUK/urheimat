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
let runs = 0,
	startBands = 0,
	startFed = 0,
	originalAlive = 0;
for (let seed = 1; seed <= SEEDS; seed++) {
	const st = newGame(seed);
	const t = startTiles(st);
	const start = t[seed % t.length];
	begin(st, start.x, start.y);
	const p = st.cultures[st.playerId as number];
	runs++;
	// Target 2: how the six bands begin.
	st.cultures.forEach((c) => {
		startBands++;
		if (foodReading(st, c).adequacy >= 1) startFed++;
	});
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
	originalAlive += st.cultures.filter((c) => c.bornEra === 0 && c.alive).length;
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
console.log(`target 1: of the six starting bands, ${(originalAlive / runs).toFixed(2)} alive after ${ERAS} passive steps (aim: about 3)`);
console.log(`target 2: ${((startFed / startBands) * 100).toFixed(0)}% of starting bands begin fed, adequacy 1 or more (aim: most, a few hungry)`);

// ---------- controlled comparisons ----------
// Same band, same customs, one thing changed: what the model must show (the targets in the log).
import { SLOTS } from '../../src/lib/sim/slots';
import type { MapTerrain } from '../../src/lib/types';

const LIV = SLOTS.findIndex((s) => s.id === 'livelihood'),
	GEN = SLOTS.findIndex((s) => s.id === 'gender');
const part = (id: string) => SLOTS[LIV].features.findIndex((f) => f.id === id);
const val = (p: string, id: string) => SLOTS[LIV].features[part(p)].values.findIndex((v) => v.id === id);

// Pin the livelihood customs: the comparison tests the food model, and 6SL.3's pressures would
// otherwise redraw the customs mid-run (the land pulls a plough band off its herds).
function pin(c: ReturnType<typeof band>['c'], sources: [string, string][]) {
	[1, 2, 3].forEach((stage, i) => {
		const s = sources[i];
		c.traits[LIV][part(`s${stage}.source`)] = s ? [val(`s${stage}.source`, s[0])] : [];
		// An unused stage keeps a dormant labour value, as a band's customs always do.
		c.traits[LIV][part(`s${stage}.labour`)] = [val(`s${stage}.labour`, s ? s[1] : 'shared')];
	});
	c.traits[GEN][0] = [0, 1];
}

function band(seed: number, terrain: MapTerrain, sources: [string, string][]) {
	const st = newGame(seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	const c = st.cultures[st.playerId as number];
	st.cultures.forEach((k) => k !== c && (k.alive = false));
	st.map.tiles[c.y][c.x] = terrain;
	pin(c, sources);
	c.condition.numbers = 30;
	return { st, c };
}

function trial(label: string, terrain: MapTerrain, sources: [string, string][], steps = 10, move = false) {
	let heads = 0,
		soil = 0,
		left = 0,
		dead = 0;
	const N = 30;
	for (let seed = 1; seed <= N; seed++) {
		const { st, c } = band(seed, terrain, sources);
		const x = c.x,
			y = c.y;
		// The mean headcount over the steps, not the last one: a band that booms and crashes is not
		// the same as one that never grew, and a single step hides the difference.
		for (let i = 0; i < steps; i++) {
			pin(c, sources);
			if (c.alive) endEra(st, defaultStep());
			heads += c.alive ? c.condition.numbers / steps : 0;
		}
		if (!c.alive) dead++;
		const pools = st.map.stocks[`${x},${y}`] ?? {};
		soil += Math.min(...Object.values(pools).concat([1]));
		if (move) {
			// Leave the tile: the stocks it left should recover while the band works fresh land.
			const wasWorn = Math.min(...Object.values(pools).concat([1]));
			for (let i = 0; i < 4 && c.alive; i++) endEra(st, defaultStep());
			const after = st.map.stocks[`${x},${y}`] ?? {};
			left += c.alive && (c.x !== x || c.y !== y) ? Math.min(...Object.values(after).concat([1])) - wasWorn : 0;
		}
	}
	console.log(label.padEnd(46), 'mean headcount', (heads / N).toFixed(0).padStart(4), '| dead', String(dead).padStart(2), `of ${N}`, '| lowest pool on the held tile', (soil / N).toFixed(2), move ? `| recovery after leaving ${(left / N).toFixed(2)}` : '');
}
console.log('\ncontrolled comparisons (30 seeds, a lone band of 30, ten steps):');
trial('plough + large herds, river', 'river', [['crop/plough', 'shared'], ['herds/large', 'shared']]);
trial('plough + large herds, forest', 'forest', [['crop/plough', 'shared'], ['herds/large', 'shared']]);
trial('plough + small herds (no draught), river', 'river', [['crop/plough', 'shared'], ['herds/small', 'shared']]);
trial('hoe only, river', 'river', [['crop/hoe', 'shared']]);
trial('hunt only, forest', 'forest', [['hunt', 'shared']]);
trial('hunt only, desert', 'desert', [['hunt', 'shared']]);
trial('plough + large herds, river, then move away', 'river', [['crop/plough', 'shared'], ['herds/large', 'shared']], 15, true);
