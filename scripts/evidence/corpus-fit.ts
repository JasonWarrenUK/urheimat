// Evidence script for 4SD.4 / 4SD.10: is the corpus big enough? Measures Jason's four criteria.
// Run with: bun run scripts/evidence/corpus-fit.ts [--sweep]
//   1. Unique runs: how often two seeds end with the player's band on the same value, per part
//   2. Density: near neighbours per value within its part (corpus only); 0 = orphan
//   3. Spread: distinct values alive per part across all bands at run end
//   4. Kin familiarity: correlation of band likeness with kinship distance
// Criteria 1, 3 and 4 depend on the change mechanism too, not only the corpus.

import { newGame, begin, startTiles, endEra, defaultOrders } from '../../src/lib/sim/engine';
import { DEFAULT_LENS, NEAR, type Lens } from '../../src/lib/sim/lens';
import { bandSimilarity, partTable } from '../../src/lib/sim/similarity';
import { SLOTS } from '../../src/lib/sim/slots';
import type { Culture, CultureTraits } from '../../src/lib/types';

const SEEDS = 50, ERAS = 8;
const parts = SLOTS.flatMap((s, si) => s.features.map((f, fi) => ({ si, fi, name: `${s.id}.${f.id}`, values: f.values })));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const pct = (x: number) => (Number.isNaN(x) ? '  n/a' : (100 * x).toFixed(1).padStart(5) + '%');

function pearson(xs: number[], ys: number[]): number {
	const mx = mean(xs), my = mean(ys);
	let sxy = 0, sxx = 0, syy = 0;
	xs.forEach((x, i) => {
		sxy += (x - mx) * (ys[i] - my);
		sxx += (x - mx) ** 2;
		syy += (ys[i] - my) ** 2;
	});
	return sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
}

// Steps between two bands through their nearest common forebear. The founders all descend from
// the one ancestral people, which counts as a shared root above them.
function kinDistance(a: Culture, b: Culture, all: Culture[]): number {
	const line = (c: Culture) => {
		const chain = [c.id];
		let p = c.parent;
		while (p !== null) {
			chain.push(p);
			p = all[p].parent;
		}
		return chain;
	};
	const la = line(a), lb = line(b);
	const i = la.findIndex((id) => lb.includes(id));
	return i >= 0 ? i + lb.indexOf(la[i]) : la.length + lb.length;
}

const sameShare = (a: CultureTraits, b: CultureTraits) => mean(a.flatMap((s, si) => s.map((v, fi) => (v === b[si][fi] ? 1 : 0))));

function runs() {
	return Array.from({ length: SEEDS }, (_, i) => {
		const st = newGame(i + 1);
		const t = startTiles(st)[0];
		begin(st, t.x, t.y);
		for (let e = 0; e < ERAS; e++) endEra(st, defaultOrders());
		return st;
	});
}

function report(lens: Lens, label: string, states: ReturnType<typeof runs>) {
	console.log(`\n== ${label} ==`);
	const tagged = parts.filter((p) => partTable(p.si, p.fi, lens));
	console.log(`Tagged parts: ${tagged.length} of ${parts.length}`);

	// 1. Unique runs
	const players = states.map((st) => st.cultures[st.playerId as number].traits);
	const sameRun = mean(
		parts.map((p) => {
			let same = 0, n = 0;
			for (let i = 0; i < players.length; i++)
				for (let j = i + 1; j < players.length; j++) {
					n++;
					if (players[i][p.si][p.fi] === players[j][p.si][p.fi]) same++;
				}
			return same / n;
		})
	);
	console.log(`1 Unique runs: two seeds share a part's value ${pct(sameRun)} of the time (lower = more unique)`);

	// 2. Density
	const orphans: string[] = [];
	const neighbours = tagged.flatMap((p) => {
		const t = partTable(p.si, p.fi, lens)!;
		return p.values.map((v, a) => {
			const n = t[a].filter((s, b) => b !== a && s >= NEAR).length;
			if (!n) orphans.push(`${p.name}: ${v.name}`);
			return n;
		});
	});
	console.log(`2 Density: ${neighbours.length ? mean(neighbours).toFixed(2) : 'n/a'} near neighbours per tagged value (near ≥ ${NEAR}); ${orphans.length} orphans`);
	orphans.forEach((o) => console.log(`    orphan  ${o}`));

	// 3. Spread
	const spread = mean(states.flatMap((st) => parts.map((p) => new Set(st.cultures.filter((c) => c.alive).map((c) => c.traits[p.si][p.fi])).size / p.values.length)));
	console.log(`3 Spread: bands alive at the end use ${pct(spread)} of each part's values`);

	// 4. Kin familiarity
	const dist: number[] = [], sim: number[] = [], same: number[] = [];
	states.forEach((st) => {
		const alive = st.cultures.filter((c) => c.alive);
		alive.forEach((a, i) =>
			alive.slice(i + 1).forEach((b) => {
				dist.push(kinDistance(a, b, st.cultures));
				same.push(sameShare(a.traits, b.traits));
				sim.push(bandSimilarity(a.traits, b.traits, lens) ?? NaN);
			})
		);
	});
	console.log(`4 Kin familiarity (correlation with kin distance; more negative = kin feel more alike):`);
	console.log(`    identical values  r = ${pearson(dist, same).toFixed(3)}  (${dist.length} band pairs)`);
	console.log(`    tag similarity    r = ${tagged.length ? pearson(dist, sim).toFixed(3) : 'n/a (nothing tagged)'}`);

	// Concrete pairs, so numbers can be judged against intuition
	tagged.forEach((p) => {
		const t = partTable(p.si, p.fi, lens)!;
		console.log(`    ${p.name}`);
		p.values.forEach((v, a) =>
			console.log(`      ${v.name.padEnd(28)} ${t[a].map((s) => String(s).padStart(5)).join('')}`)
		);
	});
}

const states = runs();
report(DEFAULT_LENS, 'default lens', states);

if (process.argv.includes('--sweep')) {
	// Alternatives to the placeholder defaults, for Jason to choose between.
	const variants: [string, Lens][] = [
		['meaning-heavy (0.6 / 0.4)', { ...DEFAULT_LENS, about: { ...DEFAULT_LENS.about, weight: 0.6 }, readings: { ...DEFAULT_LENS.readings, weight: 0.4 } }],
		['readings: max', { ...DEFAULT_LENS, readings: { ...DEFAULT_LENS.readings, combine: 'max' } }],
		['readings: meanAll', { ...DEFAULT_LENS, readings: { ...DEFAULT_LENS.readings, combine: 'meanAll' } }]
	];
	// Drift uses the default lens, so the runs are shared; only the scoring differs.
	variants.forEach(([label, lens]) => report(lens, label, states));
}
