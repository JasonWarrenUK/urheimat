<script lang="ts">
	import type { GameState } from '$lib/types';
	import { SLOTS, FEATURE_COUNT } from '$lib/sim/slots';
	import { endEra, freeLand, strainCount } from '$lib/sim/engine';
	import { game, type Tab as TabType } from '$lib/game-store.svelte';
	import WorldMap from './WorldMap.svelte';
	import TerrainLegend from './TerrainLegend.svelte';
	import TraitRow from './TraitRow.svelte';
	import KinCard from './KinCard.svelte';
	import TeachPicker from './TeachPicker.svelte';

	interface Props {
		gameState: GameState;
	}

	let { gameState }: Props = $props();

	const player = $derived(game.player()!);
	const terrain = $derived(gameState.map.tiles[player.y][player.x]);
	const aliveCount = $derived(gameState.cultures.filter((c) => c.alive).length);
	const kinList = $derived(gameState.cultures.filter((c) => !c.isPlayer));
	const actionsLeft = $derived(game.actionsLeft());

	const moveTiles = $derived.by(() => {
		if (game.mode !== 'move') return [];
		const out = [];
		for (let dy = -1; dy <= 1; dy++)
			for (let dx = -1; dx <= 1; dx++) {
				if ((dx || dy) && freeLand(gameState, player.x + dx, player.y + dy)) out.push({ x: player.x + dx, y: player.y + dy });
			}
		return out;
	});

	const orderSummary = $derived.by(() => {
		if (!player.alive) return 'Your people are gone. The kin go on without you.';
		const o: string[] = [];
		game.orders.held.forEach((si) => o.push(`hold ${SLOTS[si].name.toLowerCase()}`));
		Object.entries(game.orders.reforms).forEach(([key, v]) => {
			const [si, fi] = key.split(':').map(Number);
			o.push(`reform ${SLOTS[si].name.toLowerCase()} (${SLOTS[si].features[fi].label}) to ${SLOTS[si].features[fi].values[v].name}`);
		});
		if (game.orders.move) o.push(`migrate to the ${gameState.map.tiles[game.orders.move.y][game.orders.move.x]}`);
		if (game.orders.split) o.push('send out a daughter band (−2 prosperity)');
		if (game.orders.teach) o.push(`teach the ${gameState.cultures[game.orders.teach.kin].name} ${SLOTS[game.orders.teach.slot].name.toLowerCase()}`);
		if (game.orders.consolidate) o.push(`consolidate ×${game.orders.consolidate} (+1.5 prosperity each)`);
		if (o.length) return 'This era: ' + o.join('; ') + '.';
		if (game.mode === 'move') return 'Tap a neighbouring tile on the map. Moving costs a point of prosperity and loosens every custom for an era.';
		if (game.mode === 'teach') return 'Choose below.';
		return 'No orders yet. A held custom keeps all its parts this era; everything else may drift.';
	});

	function setTab(t: TabType) {
		game.tab = t;
		game.mode = null;
	}

	function endTheEra() {
		endEra(gameState, game.orders);
		game.resetOrders();
		game.endEraCheck();
	}

	function toggleMove() {
		if (game.orders.move) {
			game.orders.move = null;
			return;
		}
		if (actionsLeft <= 0) return;
		game.mode = game.mode === 'move' ? null : 'move';
	}

	function pickMoveTile(x: number, y: number) {
		game.orders.move = { x, y };
		game.mode = null;
	}

	function toggleSplit() {
		if (game.orders.split) {
			game.orders.split = false;
		} else {
			if (actionsLeft <= 0 || player.prosperity < 4) return;
			game.orders.split = true;
		}
	}

	function consolidate() {
		if (actionsLeft <= 0) return;
		game.orders.consolidate++;
	}

	function toggleTeach() {
		if (game.orders.teach) {
			game.orders.teach = null;
			return;
		}
		if (actionsLeft <= 0) return;
		game.mode = game.mode === 'teach' ? null : 'teach';
	}
</script>

<div class="row between">
	<h1 style="font-size:28px;margin:0">Urheimat</h1>
	<span class="muted">Era {gameState.era} of {gameState.maxEra}</span>
</div>

<WorldMap {gameState} selecting={moveTiles} moveTarget={game.orders.move} onPick={game.mode === 'move' ? pickMoveTile : undefined} />
<TerrainLegend />

<div class="status">
	<div>
		<b>{player.alive ? player.prosperity.toFixed(1) : '—'}</b>
		<span>prosperity</span>
		<div class="bar"><i class:low={player.prosperity < 3} style:width="{player.prosperity * 10}%"></i></div>
	</div>
	<div>
		<b>{player.alive ? strainCount(gameState, player) : '—'}</b>
		<span>of {FEATURE_COUNT} parts straining against the {terrain}</span>
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
			<TraitRow {gameState} {player} slotIndex={si} {terrain} orders={game.orders} />
		{/each}
	{:else if game.tab === 'kin'}
		<p class="small muted">You know what a people keeps only while you are in contact with them. Out of touch, your knowledge goes stale.</p>
		{#each kinList as k (k.id)}
			<KinCard {gameState} {player} kin={k} />
		{/each}
	{:else}
		<div class="log">
			{#each [...gameState.log].reverse() as l, i (i)}
				<p><span class="faint">{l.era === 0 ? '' : 'Era ' + l.era + '. '}</span>{@html l.text}</p>
			{/each}
		</div>
	{/if}
</div>

<div class="actions">
	<div class="orders">{orderSummary}</div>
	<div>
		{#if game.mode === 'teach'}
			<TeachPicker {gameState} {player} orders={game.orders} />
		{/if}
	</div>
	<div class="row">
		<button class="primary" onclick={endTheEra}>{gameState.playerDead ? 'Let the ages pass' : 'End the era'}</button>
		{#if player.alive}
			<button class:on={game.mode === 'move'} onclick={toggleMove}>Migrate</button>
			<button class:on={game.orders.split} onclick={toggleSplit}>Daughter band</button>
			<button class:on={game.orders.teach || game.mode === 'teach'} onclick={toggleTeach}>Teach</button>
			<button onclick={consolidate}>Consolidate</button>
		{/if}
		<span class="faint small">{player.alive ? `${actionsLeft} action${actionsLeft === 1 ? '' : 's'} left` : ''}</span>
	</div>
</div>
