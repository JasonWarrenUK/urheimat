// Evidence script for 6SL.12: how dense are situations over an average passive run?
// Run with: bun run scripts/evidence/storylet-density.ts [seeds]
//   Situations per step (mean, share of steps with none, one, two, three or more), and how often
//   each storylet fires, over passive runs (every situation let lie) of the full 15 steps.

import { newGame, begin, startTiles, endEra, defaultStep } from '../../src/lib/sim/engine';
import { STORYLETS } from '../../src/lib/sim/storylets';

const SEEDS = Number(process.argv[2] ?? 200);
const perStep: number[] = [];
const fired: Record<string, number> = Object.fromEntries(STORYLETS.map((s) => [s.id, 0]));
let stepsPlayed = 0;
for (let seed = 1; seed <= SEEDS; seed++) {
	const st = newGame(seed);
	const t = startTiles(st);
	begin(st, t[seed % t.length].x, t[seed % t.length].y);
	while (!st.over) {
		const p = st.cultures[st.playerId as number];
		if (!p.alive) break;
		perStep.push(st.situations.length);
		st.situations.forEach((s) => (fired[s.storylet] = (fired[s.storylet] ?? 0) + 1));
		stepsPlayed++;
		endEra(st, defaultStep());
	}
}
const share = (n: number) => ((100 * perStep.filter((x) => (n >= 3 ? x >= 3 : x === n)).length) / perStep.length).toFixed(1).padStart(5) + '%';
console.log(`${SEEDS} passive runs, ${stepsPlayed} steps with the player alive`);
console.log(`situations per step: mean ${(perStep.reduce((a, b) => a + b, 0) / perStep.length).toFixed(2)}; none ${share(0)}  one ${share(1)}  two ${share(2)}  three+ ${share(3)}`);
console.log('per storylet, firings per run:');
Object.entries(fired)
	.sort((a, b) => b[1] - a[1])
	.forEach(([id, n]) => console.log(`  ${id.padEnd(28)} ${(n / SEEDS).toFixed(2)}`));
