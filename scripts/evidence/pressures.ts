// Evidence script for 6SL.3: how do layer 1 pressures fall over an average passive run?
// Run with: bun run scripts/evidence/pressures.ts [seeds]
//   Pressures per step for the player's band (mean; share of steps with none, one, two, three), by
//   source and operation, how often a third course is offered and custom changes per band per step
//   for the player and for AI bands, over passive runs (every situation let lie) of the full 15 steps.

import { newGame, begin, startTiles, endEra, defaultStep, sameSet } from '../../src/lib/sim/engine';
import { hold, PRESSURES_PER_STEP } from '../../src/lib/sim/pressures';

const SEEDS = Number(process.argv[2] ?? 200);
const perStep: number[] = [];
const byStep: number[] = [];
const bySource: Record<string, number> = {};
const byOp: Record<string, number> = {};
let pressures = 0,
	thirds = 0,
	backlog = 0,
	building = 0,
	storylets = 0,
	playerChanges = 0,
	playerSteps = 0,
	aiChanges = 0,
	aiSteps = 0;
for (let seed = 1; seed <= SEEDS; seed++) {
	const st = newGame(seed);
	const t = startTiles(st);
	begin(st, t[seed % t.length].x, t[seed % t.length].y);
	for (let i = 0; !st.over; i++) {
		const p = st.cultures[st.playerId as number];
		if (!p.alive) break;
		const here = st.situations.filter((s) => s.pressure);
		perStep.push(here.length);
		backlog += p.pulls.filter((x) => x.strength >= hold(p)).length;
		building += p.pulls.length;
		byStep[i] = (byStep[i] ?? 0) + here.length;
		storylets += st.situations.length - here.length;
		here.forEach((s) => {
			pressures++;
			const pr = s.pressure!;
			bySource[pr.pull.source.kind] = (bySource[pr.pull.source.kind] ?? 0) + 1;
			byOp[pr.pull.op] = (byOp[pr.pull.op] ?? 0) + 1;
			if (pr.third !== null) thirds++;
		});
		const before = st.cultures.map((c) => ({ alive: c.alive, traits: c.traits.map((fv) => fv.map((v) => [...v])) }));
		endEra(st, defaultStep());
		st.cultures.forEach((c, ci) => {
			if (!before[ci]?.alive) return;
			const n = c.traits.reduce((a, fv, si) => a + fv.filter((v, fi) => !sameSet(v, before[ci].traits[si][fi])).length, 0);
			if (c.isPlayer) {
				playerChanges += n;
				playerSteps++;
			} else {
				aiChanges += n;
				aiSteps++;
			}
		});
	}
}
const share = (n: number) => ((100 * perStep.filter((x) => x === n).length) / perStep.length).toFixed(1).padStart(5) + '%';
const steps = perStep.length;
console.log(`${SEEDS} passive runs, ${steps} steps with the player alive, cap ${PRESSURES_PER_STEP}`);
console.log(`pressures per step: mean ${(pressures / steps).toFixed(2)}; none ${share(0)}  one ${share(1)}  two ${share(2)}  three ${share(3)}`);
console.log(`storylets per step alongside: ${(storylets / steps).toFixed(2)}`);
console.log('per step: ' + byStep.map((n) => (n / SEEDS).toFixed(1)).join(' '));
console.log('by source: ' + Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${((100 * n) / pressures).toFixed(0)}%`).join(', '));
console.log('by operation: ' + Object.entries(byOp).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${((100 * n) / pressures).toFixed(0)}%`).join(', '));
console.log(`third course offered on ${((100 * thirds) / pressures).toFixed(0)}% of pressures`);
console.log(`pulls on the player's band per step: ${(building / steps).toFixed(1)} building, of which ${(backlog / steps).toFixed(1)} past the hold and waiting`);
console.log(`custom changes per band per step: player ${(playerChanges / playerSteps).toFixed(2)}, ai ${(aiChanges / aiSteps).toFixed(2)}`);
