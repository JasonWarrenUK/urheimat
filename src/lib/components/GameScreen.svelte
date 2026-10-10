<script lang="ts">
	import type { GameState } from '$lib/types';
	import { SLOTS } from '$lib/sim/slots';
	import { endEra, foodHeldCount, foodStrainCount, freeLand, strainCount } from '$lib/sim/engine';
	import { ageOf, leaderOf, yearOf, YEARS_PER_STEP } from '$lib/sim/family';
	import { game, type Tab as TabType } from '$lib/game-store.svelte';
	import WorldMap from './WorldMap.svelte';
	import TerrainLegend from './TerrainLegend.svelte';
	import TraitRow from './TraitRow.svelte';
	import KinCard from './KinCard.svelte';

	interface Props {
		gameState: GameState;
	}

	let { gameState }: Props = $props();

	const player = $derived(game.player()!);
	const terrain = $derived(gameState.map.tiles[player.y][player.x]);
	const leader = $derived(leaderOf(player));
	const year = $derived(yearOf(gameState.era));
	const ordinal = $derived(['th', 'st', 'nd', 'rd'][leader.generation % 10 < 4 && Math.floor(leader.generation / 10) !== 1 ? leader.generation % 10 : 0]);
	const aliveCount = $derived(gameState.cultures.filter((c) => c.alive).length);
	const kinList = $derived(gameState.cultures.filter((c) => !c.isPlayer));

	const moveTiles = $derived.by(() => {
		if (!game.choosingMove) return [];
		const out = [];
		for (let dy = -1; dy <= 1; dy++)
			for (let dx = -1; dx <= 1; dx++) {
				if ((dx || dy) && freeLand(gameState, player.x + dx, player.y + dy)) out.push({ x: player.x + dx, y: player.y + dy });
			}
		return out;
	});

	const stepSummary = $derived.by(() => {
		if (!player.alive) return 'Your people are gone. The kin go on without you.';
		if (game.step.move) return `This step you lead the ${player.name} to the ${gameState.map.tiles[game.step.move.y][game.step.move.x]}.`;
		if (game.choosingMove) return 'Tap a neighbouring tile on the map. Moving costs a point of prosperity and loosens every custom for a step.';
		return gameState.situations.length ? 'Answer what has arisen, or let it lie.' : 'Nothing presses on your people this step.';
	});

	function setTab(t: TabType) {
		game.tab = t;
		game.choosingMove = false;
	}

	function takeStep() {
		endEra(gameState, game.step);
		game.resetStep();
		game.endEraCheck();
	}

	function toggleMove() {
		if (game.step.move) {
			game.step.move = null;
			return;
		}
		game.choosingMove = !game.choosingMove;
	}

	function pickMoveTile(x: number, y: number) {
		game.step.move = { x, y };
		game.choosingMove = false;
	}

	function answer(situation: string, id: string | null) {
		if (id === null) delete game.step.answers[situation];
		else game.step.answers[situation] = id;
	}
</script>

<div class="row between">
	<h1 style="font-size:28px;margin:0">Urheimat</h1>
	<span class="muted">Year {year}, step {gameState.era} of {gameState.maxEra}</span>
	<span class="muted">Led by {leader.name}, {ageOf(leader, year)}, of the {leader.generation}{ordinal} generation since the scattering</span>
</div>

<WorldMap {gameState} selecting={moveTiles} moveTarget={game.step.move} onPick={game.choosingMove ? pickMoveTile : undefined} />
<TerrainLegend />

<div class="status">
	<div>
		<b>{player.alive ? player.prosperity.toFixed(1) : '—'}</b>
		<span>prosperity</span>
		<div class="bar"><i class:low={player.prosperity < 3} style:width="{player.prosperity * 10}%"></i></div>
	</div>
	<div>
		<b>{player.alive ? foodStrainCount(gameState, player) : '—'}</b>
		<span>of {foodHeldCount(player)} ways they are fed strain against the {terrain}; {player.alive ? strainCount(gameState, player) - foodStrainCount(gameState, player) : '—'} of their customs strain too, which costs nothing yet</span>
	</div>
	<div>
		<b>{aliveCount}</b>
		<span>peoples alive</span>
	</div>
</div>

<div class="tabs">
	{#each [['ours', 'Our customs'], ['kin', 'Our kin'], ['chronicle', 'Chronicle']] as [t, label] (t)}
		<button class:on={game.tab === t} onclick={() => setTab(t as TabType)}>{label}</button>
	{/each}
</div>

<div id="panel">
	{#if game.tab === 'ours'}
		{#each SLOTS as _sl, si (si)}
			{#if si === 0 || SLOTS[si].domain !== SLOTS[si - 1].domain}
				<div class="domain">{SLOTS[si].domain}</div>
			{/if}
			<TraitRow {gameState} {player} slotIndex={si} {terrain} />
		{/each}
	{:else if game.tab === 'kin'}
		<p class="small muted">You know what a people keeps only while you are in contact with them. Out of touch, your knowledge goes stale.</p>
		{#each kinList as k (k.id)}
			<KinCard {gameState} {player} kin={k} />
		{/each}
	{:else}
		<div class="log">
			{#each [...gameState.log].reverse() as l, i (i)}
				<p><span class="faint">{l.era === 0 ? '' : 'Year ' + yearOf(l.era) + '. '}</span>{@html l.text}</p>
			{/each}
		</div>
	{/if}
</div>

<div class="actions">
	<div class="orders">{stepSummary}</div>
	{#if player.alive && gameState.situations.length}
		<div class="situations">
			{#each gameState.situations as s (s.id)}
				<div class="situation">
					<p>{s.text}</p>
					<div class="row">
						{#each s.answers as a (a.id)}
							<button class="tiny" class:on={game.step.answers[s.id] === a.id} onclick={() => answer(s.id, a.id)}>{a.text}</button>
						{/each}
						<button class="tiny" class:on={game.step.answers[s.id] === undefined} onclick={() => answer(s.id, null)}>Let it lie</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
	<div class="row">
		<button class="primary" onclick={takeStep}>{gameState.playerDead ? 'Let the ages pass' : `Let ${YEARS_PER_STEP} years pass`}</button>
		{#if player.alive}
			<button class:on={game.choosingMove || !!game.step.move} onclick={toggleMove}>{game.step.move ? 'Stay instead' : 'Migrate'}</button>
		{/if}
	</div>
</div>
