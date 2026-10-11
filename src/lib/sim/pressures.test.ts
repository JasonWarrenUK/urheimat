import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/pressures';
import type { Culture, GameState, Pull, Terrain } from '$lib/types';
import { begin, defaultStep, endEra, newGame, startTiles, H, W } from './engine';
import { accumulate, change, contributions, displaced, hold, PRESSURES_PER_STEP, pressureStep, resolve, surface, thirdCourse } from './pressures';
import { answer, holds } from './storylets';
import { SLOTS } from './slots';

const custom = (id: string) => SLOTS.findIndex((s) => s.id === id);
const part = (si: number, id: string) => SLOTS[si].features.findIndex((f) => f.id === id);
const value = (si: number, fi: number, id: string) => SLOTS[si].features[fi].values.findIndex((v) => v.id === id);
const at = (where: { custom: string; part: string }) => {
	const si = custom(where.custom),
		fi = part(si, where.part);
	return { si, fi, v: (id: string) => value(si, fi, id) };
};

function fresh(seed = fixtures.seed): GameState {
	const st = newGame(seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	return st;
}
const player = (st: GameState) => st.cultures[st.playerId as number];
// Put a band on a tile of the given land, away from every other band.
function place(st: GameState, c: Culture, terrain: Terrain): void {
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++)
			if (st.map.tiles[y][x] === terrain && !st.cultures.some((k) => k.alive && k.id !== c.id && Math.max(Math.abs(k.x - x), Math.abs(k.y - y)) <= 3)) {
				c.x = x;
				c.y = y;
				return;
			}
	// No lonely tile of that land on this map: paint one in a corner instead.
	st.map.tiles[0][0] = terrain;
	st.cultures.forEach((k) => k.id !== c.id && Math.max(k.x, k.y) <= 3 && ((k.x = W - 1), (k.y = H - 1)));
	c.x = 0;
	c.y = 0;
}
const alone = (st: GameState, c: Culture) => st.cultures.forEach((k) => k.id !== c.id && (k.alive = false));
const of = (pulls: readonly Omit<Pull, 'live'>[], si: number, fi: number) => pulls.filter((p) => p.custom === si && p.part === fi);

describe('sources', () => {
	it('hold reads conservatism and a recent move', () => {
		const st = fresh(),
			c = player(st);
		const h = hold(c);
		expect(h).toBeGreaterThanOrEqual(2);
		c.migrated = true;
		expect(hold(c)).toBeLessThan(h);
	});
	it('the land pulls a strained livelihood towards what the land feeds, strongly', () => {
		const st = fresh(),
			c = player(st);
		alone(st, c);
		place(st, c, 'desert');
		const { si, fi, v } = at(fixtures.livelihood);
		c.traits[si][fi] = [v(fixtures.livelihood.fish)];
		const pulls = of(contributions(st, c), si, fi);
		expect(pulls.length).toBe(1);
		expect(pulls[0].source).toEqual({ kind: 'land' });
		expect(pulls[0].op).toBe('add');
		expect(pulls[0].strength).toBeGreaterThan(2);
		// A full set swaps out the fish, which the desert excludes.
		expect(displaced(st, c, { ...pulls[0], live: true })).toBe(v(fixtures.livelihood.fish));
	});
	it('a neighbour in contact pulls towards its practice, by the strength of the contact', () => {
		const st = fresh(),
			c = player(st);
		const k = st.cultures.find((x) => !x.isPlayer)!;
		st.cultures.forEach((x) => x.id !== c.id && x.id !== k.id && (x.alive = false));
		const { si, fi, v } = at(fixtures.guest);
		c.traits[si][fi] = [v(fixtures.guest.bar)];
		k.traits[si][fi] = [v(fixtures.guest.welcome)];
		place(st, c, 'river');
		k.x = c.x + 1;
		k.y = c.y;
		const near = of(contributions(st, c), si, fi).find((p) => p.source.kind === 'neighbour')!;
		expect(near).toMatchObject({ op: 'adopt', value: v(fixtures.guest.welcome), strength: 1, source: { kind: 'neighbour', band: k.id } });
		k.x = c.x + 3;
		const far = of(contributions(st, c), si, fi).find((p) => p.source.kind === 'neighbour')!;
		expect(far.strength).toBeCloseTo(0.2);
	});
	it('a lost value pulls back weakly, and returning forgets it', () => {
		const st = fresh(),
			c = player(st);
		alone(st, c);
		const { si, fi, v } = at(fixtures.guest);
		const was = c.traits[si][fi][0];
		const other = was === v(fixtures.guest.bar) ? v(fixtures.guest.welcome) : v(fixtures.guest.bar);
		change(st, c, si, fi, [other]);
		expect(c.lost).toEqual([{ custom: si, part: fi, value: was, step: st.era }]);
		const memory = of(contributions(st, c), si, fi).find((p) => p.source.kind === 'memory')!;
		expect(memory).toMatchObject({ op: 'adopt', value: was, strength: 0.3 });
		change(st, c, si, fi, [was]);
		expect(c.lost.some((l) => l.value === was)).toBe(false);
	});
	it('the desert pulls the greatest power towards being unwed: absence as a drop', () => {
		const st = fresh(),
			c = player(st);
		alone(st, c);
		place(st, c, 'desert');
		const { si, fi, v } = at(fixtures.consort);
		c.traits[si][fi] = [v(fixtures.consort.earth)];
		const empty = of(contributions(st, c), si, fi).find((p) => p.source.kind === 'absence')!;
		expect(empty).toMatchObject({ op: 'drop', value: v(fixtures.consort.earth) });
		expect(empty.strength).toBeGreaterThan(0);
	});
	it('what feeds a band pulls on its descent', () => {
		const st = fresh(),
			c = player(st);
		alone(st, c);
		const live = at(fixtures.livelihood),
			line = at({ custom: fixtures.descent.custom, part: fixtures.descent.line });
		c.traits[live.si][live.fi] = [live.v(fixtures.livelihood.herds)];
		c.traits[line.si][line.fi] = [line.v(fixtures.descent.mother)];
		const herds = of(contributions(st, c), line.si, line.fi).find((p) => p.source.kind === 'custom')!;
		expect(herds).toMatchObject({ op: 'adopt', value: line.v(fixtures.descent.father), source: { kind: 'custom', custom: 'livelihood' } });
	});
	it('a land lived on keeps pulling after a move, at a share of what the seat does', () => {
		const st = fresh(),
			c = player(st);
		alone(st, c);
		place(st, c, 'forest');
		const { si, fi, v } = at(fixtures.livelihood);
		c.traits[si][fi] = [v('crop/hoe')];
		expect(contributions(st, c).some((p) => p.source.kind === 'landscape')).toBe(false);
		c.lands = { steppe: 6, forest: 2 };
		const remembered = of(contributions(st, c), si, fi).find((p) => p.source.kind === 'landscape')!;
		expect(remembered.source).toEqual({ kind: 'landscape', terrain: 'steppe' });
		expect(remembered.strength).toBeGreaterThan(0);
		expect(remembered.strength).toBeLessThan(2);
	});
});

describe('building and surfacing', () => {
	it('pulls build while fed, fade when not and surface strongest first to the cap', () => {
		const st = fresh(),
			c = player(st);
		const mk = (value: number, strength: number): Omit<Pull, 'live'> => ({ custom: 0, part: 0, op: 'adopt', value, strength, source: { kind: 'land' } });
		accumulate(c, [mk(1, 1)]);
		accumulate(c, [mk(1, 1)]);
		expect(c.pulls[0].strength).toBe(2);
		accumulate(c, []);
		expect(c.pulls[0].strength).toBe(1);
		expect(c.pulls[0].live).toBe(false);
		for (let i = 0; i < 5; i++) accumulate(c, []);
		expect(c.pulls).toEqual([]);
		const { si, fi } = at(fixtures.guest);
		const h = hold(c);
		const held = c.traits[si][fi][0];
		const others = SLOTS[si].features[fi].values.map((_, vi) => vi).filter((vi) => vi !== held);
		c.pulls = others.map((vi, i) => ({ custom: si, part: fi, op: 'adopt', value: vi, strength: h + i, source: { kind: 'land' }, live: true }));
		c.pulls.push({ custom: si, part: fi, op: 'adopt', value: held, strength: h + 10, source: { kind: 'land' }, live: true }); // already held: does not stand
		const due = surface(c);
		expect(due.length).toBe(Math.min(PRESSURES_PER_STEP, others.length));
		expect(due.map((p) => p.strength)).toEqual([...due.map((p) => p.strength)].sort((a, b) => b - a));
		expect(c.pulls.some((p) => p.value === held)).toBe(false);
		expect(c.pulls.length).toBe(others.length - due.length);
	});
});

describe('answers', () => {
	const pullOn = (c: Culture, source: Pull['source']): Pull => {
		const { si, fi, v } = at(fixtures.guest);
		const held = c.traits[si][fi][0];
		const to = held === v(fixtures.guest.bar) ? v(fixtures.guest.welcome) : v(fixtures.guest.bar);
		return { custom: si, part: fi, op: 'adopt', value: to, strength: 6, source, live: true };
	};
	it('letting a land pull lie yields to it, and the chronicle says why', () => {
		const st = fresh(),
			c = player(st);
		const p = pullOn(c, { kind: 'land' });
		resolve(st, c, { pull: p, third: null }, null);
		expect(c.traits[p.custom][p.part]).toEqual([p.value]);
		expect(st.log.at(-1)?.text).toMatch(/Among your people, .* would have it\./);
	});
	it('holding fast keeps the pull at half strength', () => {
		const st = fresh(),
			c = player(st);
		const p = pullOn(c, { kind: 'land' });
		const before = c.traits[p.custom][p.part][0];
		resolve(st, c, { pull: p, third: null }, 'hold');
		expect(c.traits[p.custom][p.part]).toEqual([before]);
		expect(c.pulls).toEqual([{ ...p, strength: 3, live: false }]);
	});
	it('a memory let lie fizzles; restored, it returns', () => {
		const st = fresh(),
			c = player(st);
		const p = pullOn(c, { kind: 'memory' });
		const before = c.traits[p.custom][p.part][0];
		resolve(st, c, { pull: p, third: null }, null);
		expect(c.traits[p.custom][p.part]).toEqual([before]);
		expect(c.pulls).toEqual([]);
		resolve(st, c, { pull: p, third: null }, 'adopt');
		expect(c.traits[p.custom][p.part]).toEqual([p.value]);
		expect(st.log.at(-1)?.text).toMatch(/the old way restored/);
	});
	it('the third course takes a value near by meaning that the land prefers over the held one', () => {
		// Search seeds and lands for a surfaced land pull that offers one, then check what it offers.
		let found = 0;
		for (let seed = 1; seed <= 40 && found < 3; seed++) {
			const st = fresh(seed),
				c = player(st);
			alone(st, c);
			for (const terrain of ['desert', 'coast', 'marsh', 'steppe'] as Terrain[]) {
				place(st, c, terrain);
				for (const k of contributions(st, c)) {
					if (k.source.kind !== 'land' || k.op !== 'adopt') continue;
					const p: Pull = { ...k, live: true };
					const third = thirdCourse(st, c, p);
					if (third === null) continue;
					found++;
					const held = c.traits[p.custom][p.part][0];
					expect(third).not.toBe(p.value);
					expect(third).not.toBe(held);
					resolve(st, c, { pull: p, third }, 'third');
					expect(c.traits[p.custom][p.part]).toEqual([third]);
					expect(st.log.at(-1)?.text).toMatch(/the meaning kept/);
					c.traits[p.custom][p.part] = [held];
				}
			}
		}
		expect(found).toBeGreaterThan(0);
	});
});

describe('the step', () => {
	it('raises pressures for the player, resolves them for AI bands and spends no rng', () => {
		const st = fresh();
		const p = player(st);
		const before = st.rng.state;
		const k = st.cultures.find((x) => !x.isPlayer)!;
		k.pulls = [{ custom: custom('guest'), part: 0, op: 'adopt', value: (k.traits[custom('guest')][0][0] + 1) % SLOTS[custom('guest')].features[0].values.length, strength: 99, source: { kind: 'land' }, live: true }];
		expect(pressureStep(st, k)).toEqual([]);
		expect(k.pulls.some((x) => x.strength === 99)).toBe(false);
		expect(st.rng.state).toBe(before);
		p.pulls = [{ custom: custom('guest'), part: 0, op: 'adopt', value: (p.traits[custom('guest')][0][0] + 1) % SLOTS[custom('guest')].features[0].values.length, strength: 99, source: { kind: 'land' }, live: true }];
		const raised = pressureStep(st, p);
		expect(raised.length).toBeGreaterThanOrEqual(1);
		expect(raised[0].pressure?.pull.strength).toBeGreaterThanOrEqual(99);
		expect(raised[0].text).toMatch(/wears on/);
		expect(raised[0].answers.map((a) => a.id)).toContain('hold');
		st.situations = raised;
		expect(holds(st, p, { pressure: { custom: 'guest', part: 'stance', source: 'land' } })).toBe(true);
		expect(holds(st, p, { pressure: { custom: 'guest', source: 'neighbour' } })).toBe(false);
		// An answer routes to the pressure: holding keeps it building.
		answer(st, p, { move: null, answers: { [raised[0].id]: 'hold' } });
		expect(p.pulls.some((x) => x.strength === raised[0].pressure!.pull.strength / 2)).toBe(true);
	});
	it('over a run, every change to the player\'s customs is a pressure let lie, and the land is counted', () => {
		const st = fresh();
		const p = player(st);
		let changes = 0,
			pressures = 0;
		for (let i = 0; i < 15 && !st.over; i++) {
			const before = p.traits.map((fv) => fv.map((v) => v.join()));
			pressures += st.situations.filter((s) => s.pressure).length;
			endEra(st, defaultStep());
			if (p.alive) changes += p.traits.reduce((n, fv, si) => n + fv.filter((v, fi) => v.join() !== before[si][fi]).length, 0);
		}
		expect(pressures).toBeGreaterThan(0);
		expect(Object.values(p.lands).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
		// Storylet consequences can also change a custom, so changes may exceed pressures; never the reverse.
		expect(changes).toBeGreaterThan(0);
	});
});
