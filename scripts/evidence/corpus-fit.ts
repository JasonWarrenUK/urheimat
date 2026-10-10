// Evidence script for 4SD.4 / 4SD.10: is the corpus big enough? Measures Jason's four criteria.
// Run with: bun run scripts/evidence/corpus-fit.ts [--sweep] [--web]
//   1. Unique runs: how often two seeds end with the player's band on the same value, per part
//   2. Density: near neighbours per value within its part (corpus only); 0 = orphan
//   3. Spread: distinct values alive per part across all bands at run end
//   4. Kin familiarity: correlation of band likeness with kinship distance
// Criteria 1, 3 and 4 depend on the change mechanism too, not only the corpus.

import { newGame, begin, startTiles, endEra, defaultStep, sameSet } from '../../src/lib/sim/engine';
import { DEFAULT_LENS, NEAR, type Lens } from '../../src/lib/sim/lens';
import { isActive } from '../../src/lib/sim/predicates';
import { bandSimilarity, partTable } from '../../src/lib/sim/similarity';
import { SLOTS } from '../../src/lib/sim/slots';
import type { Culture, CultureTraits } from '../../src/lib/types';

const SEEDS = 50, ERAS = 8;
const parts = SLOTS.flatMap((s, si) => s.features.map((f, fi) => ({ si, fi, name: `${s.id}.${f.id}`, values: f.values })));
const mean = (xs: number[]) => ((xs = xs.filter((x) => !Number.isNaN(x))), xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
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

// Dormant parts are left out wherever a band's values are compared.
const sameShare = (a: CultureTraits, b: CultureTraits) =>
	mean(a.flatMap((s, si) => s.flatMap((v, fi) => (isActive(a, si, fi) && isActive(b, si, fi) ? [sameSet(v, b[si][fi]) ? 1 : 0] : []))));

function runs() {
	return Array.from({ length: SEEDS }, (_, i) => {
		const st = newGame(i + 1);
		const t = startTiles(st)[0];
		begin(st, t.x, t.y);
		for (let e = 0; e < ERAS; e++) endEra(st, defaultStep());
		return st;
	});
}

// ---------- the web ----------
// Jason's objective for the default lens: within each part, one web of connections (every value
// reachable from every other, no orphans) that still keeps values far apart (few edges, long
// chains), rather than a clique. Each candidate is a lens and a rule for drawing edges from its
// table; the metrics are per part, averaged over parts with three or more values.
type EdgeRule = (t: number[][]) => boolean[][];
const above = (near: number): EdgeRule => (t) => t.map((row, a) => row.map((s, b) => a !== b && s >= near));
// Each value links to its k closest; a link either way counts.
const knn = (k: number): EdgeRule => (t) => {
	const n = t.length, e = t.map(() => t.map(() => false));
	t.forEach((row, a) => {
		const order = row.map((s, b) => [s, b] as const).filter(([, b]) => b !== a).sort((x, y) => y[0] - x[0]).slice(0, k);
		order.forEach(([, b]) => { e[a][b] = true; e[b][a] = true; });
	});
	return e;
};
// A maximum spanning tree (the fewest edges that connect everything), plus every pair above `near`.
const treePlus = (near: number): EdgeRule => (t) => {
	const n = t.length, e = above(near)(t), inTree = [0];
	while (inTree.length < n) {
		let best: [number, number, number] = [-1, -1, -1];
		inTree.forEach((a) => t[a].forEach((s, b) => { if (!inTree.includes(b) && s > best[2]) best = [a, b, s]; }));
		e[best[0]][best[1]] = true; e[best[1]][best[0]] = true; inTree.push(best[1]);
	}
	return e;
};

function report(lens: Lens, label: string, states: ReturnType<typeof runs>) {
	console.log(`\n== ${label} ==`);
	const tagged = parts.filter((p) => partTable(p.si, p.fi, lens));
	console.log(`Tagged parts: ${tagged.length} of ${parts.length}`);

	// 1. Unique runs
	const players = states.map((st) => st.cultures[st.playerId as number].traits);
	const sameRun = mean(
		parts.flatMap((p) => {
			let same = 0, n = 0;
			for (let i = 0; i < players.length; i++)
				for (let j = i + 1; j < players.length; j++) {
					if (!isActive(players[i], p.si, p.fi) || !isActive(players[j], p.si, p.fi)) continue;
					n++;
					if (players[i][p.si][p.fi] === players[j][p.si][p.fi]) same++;
				}
			return n ? [same / n] : [];
		})
	);
	console.log(`1 Unique runs: two seeds share a part's value ${pct(sameRun)} of the time (lower = more unique)`);

	// 2. Density
	const orphans: string[] = [];
	const neighbours = tagged.flatMap((p) => {
		const t = partTable(p.si, p.fi, lens)!;
		return p.values.map((v, a) => {
			const n = treePlus(NEAR)(t)[a].filter(Boolean).length;
			if (!n) orphans.push(`${p.name}: ${v.name}`);
			return n;
		});
	});
	console.log(`2 Density: ${neighbours.length ? mean(neighbours).toFixed(2) : 'n/a'} near neighbours per tagged value (spanning tree plus pairs ≥ ${NEAR}); ${orphans.length} orphans`);
	orphans.forEach((o) => console.log(`    orphan  ${o}`));

	// 3. Spread
	const spread = mean(
		states.flatMap((st) =>
			parts.flatMap((p) => {
				const live = st.cultures.filter((c) => c.alive && isActive(c.traits, p.si, p.fi));
				return live.length ? [new Set(live.flatMap((c) => c.traits[p.si][p.fi])).size / p.values.length] : [];
			})
		)
	);
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

function webMetrics(e: boolean[][]) {
	const n = e.length;
	const comp = Array(n).fill(-1); let c = 0;
	for (let s = 0; s < n; s++) if (comp[s] < 0) { const q = [s]; comp[s] = c; while (q.length) { const a = q.pop()!; e[a].forEach((x, b) => { if (x && comp[b] < 0) { comp[b] = c; q.push(b); } }); } c++; }
	const orphans = e.filter((row) => !row.some(Boolean)).length;
	const edges = e.flat().filter(Boolean).length / 2;
	const paths: number[] = [];
	for (let s = 0; s < n; s++) { const d = Array(n).fill(-1); d[s] = 0; const q = [s]; while (q.length) { const a = q.shift()!; e[a].forEach((x, b) => { if (x && d[b] < 0) { d[b] = d[a] + 1; q.push(b); } }); } d.forEach((x, b) => { if (b > s && x > 0) paths.push(x); }); }
	return { components: c, orphans, density: edges / (n * (n - 1) / 2), path: mean(paths) };
}
if (process.argv.includes('--web')) {
	const max: Lens = { ...DEFAULT_LENS, readings: { ...DEFAULT_LENS.readings, combine: 'max' } };
	const cands: [string, Lens, EdgeRule][] = [];
	for (const [ln, lens] of [['meanBest', DEFAULT_LENS], ['max', max]] as const) {
		for (const near of [400, 500, 600]) cands.push([`${ln}, near ${near}`, lens, above(near)]);
		for (const k of [1, 2]) cands.push([`${ln}, ${k}-nearest`, lens, knn(k)]);
		cands.push([`${ln}, tree + near 600`, lens, treePlus(600)]);
	}
	const big = parts.filter((p) => p.values.length >= 3);
	console.log(`\n== the web: ${big.length} parts with three or more values ==`);
	console.log(`${'candidate'.padEnd(24)} one web  orphans  edge density  mean path`);
	cands.forEach(([label, lens, rule]) => {
		const ms = big.map((p) => webMetrics(rule(partTable(p.si, p.fi, lens)!)));
		const oneWeb = ms.filter((m) => m.components === 1).length / ms.length;
		console.log(`${label.padEnd(24)} ${pct(oneWeb)}  ${String(ms.reduce((a, m) => a + m.orphans, 0)).padStart(7)}  ${pct(mean(ms.map((m) => m.density))).padStart(12)}  ${mean(ms.map((m) => m.path)).toFixed(2).padStart(9)}`);
	});
}
