<script lang="ts">
	import type { Culture, GameState, MapTerrain, Orders } from '$lib/types';
	import { SLOTS } from '$lib/sim/slots';
	import { aff, allowedReforms, render, sameCustom, vname } from '$lib/sim/engine';
	import { game } from '$lib/game-store.svelte';

	interface Props {
		gameState: GameState;
		player: Culture;
		slotIndex: number;
		terrain: MapTerrain;
		orders: Orders;
	}

	let { gameState, player, slotIndex, terrain, orders }: Props = $props();

	const slot = $derived(SLOTS[slotIndex]);
	const held = $derived(orders.held.has(slotIndex));
	const reformed = $derived(slot.features.map((_f, fi) => orders.reforms[slotIndex + ':' + fi]));
	const anyReformed = $derived(reformed.some((x) => x !== undefined));
	const shown = $derived(player.traits[slotIndex].map((v, fi) => (reformed[fi] !== undefined ? reformed[fi] : v)));
	const changed = $derived(!sameCustom(player.traits[slotIndex], gameState.ancestral[slotIndex]));
	const strained = $derived(slot.features.filter((_f, fi) => aff(slotIndex, fi, player.traits[slotIndex][fi], terrain) === 0).map((f) => f.label));
	const kin = $derived(gameState.cultures.filter((c) => c.alive && !c.isPlayer));
	const wholeCount = $derived(kin.filter((k) => sameCustom(k.known[slotIndex], gameState.ancestral[slotIndex])).length);
	const partCount = $derived(
		kin.filter((k) => !sameCustom(k.known[slotIndex], gameState.ancestral[slotIndex]) && k.known[slotIndex].some((v, fi) => v === gameState.ancestral[slotIndex][fi])).length
	);
	const allowed = $derived(allowedReforms(gameState, player)[slotIndex]);
	const hasReform = $derived(allowed.some((a) => a.length));
	const showPicker = $derived(game.picker === slotIndex);

	function toggleHold() {
		if (orders.held.has(slotIndex)) {
			orders.held.delete(slotIndex);
		} else {
			if (game.actionsLeft() <= 0) return;
			orders.held.add(slotIndex);
		}
	}

	function toggleReform() {
		const keys = Object.keys(orders.reforms).filter((k) => k.startsWith(slotIndex + ':'));
		if (keys.length) {
			keys.forEach((k) => delete orders.reforms[k]);
			game.picker = null;
		} else {
			if (game.actionsLeft() <= 0) return;
			game.picker = game.picker === slotIndex ? null : slotIndex;
		}
	}

	function pick(fi: number, vi: number) {
		orders.reforms[slotIndex + ':' + fi] = vi;
		game.picker = null;
	}
</script>

<div class="trait" class:held={held || anyReformed}>
	<div>
		<div class="name">
			{slot.name}{#if changed}<span class="faint"> (was: {render(slotIndex, gameState.ancestral[slotIndex])})</span>{/if}
		</div>
		<div class="val" class:changed>
			{render(slotIndex, shown)}{#if anyReformed}<span class="faint small"> (reforming)</span>{/if}
		</div>
		<div class="fit" class:strain={strained.length > 0} class:ok={strained.length === 0}>
			{strained.length ? `strains against the ${terrain}: ${strained.join(', ')}` : `fits the ${terrain}`}
			<span class="faint"> · {wholeCount} kin keep it whole, {partCount} in part, as far as you know</span>
		</div>
	</div>
	{#if player.alive}
		<div class="ctl">
			<button class="tiny" class:on={held} onclick={toggleHold}>{held ? 'Holding' : 'Hold'}</button>
			{#if hasReform}
				<button class="tiny" class:on={anyReformed} onclick={toggleReform}>{anyReformed ? 'Undo' : 'Reform'}</button>
			{/if}
		</div>
	{/if}
</div>
{#if showPicker}
	<div class="picker">
		<div class="small muted">Reform one part of {slot.name.toLowerCase()} to something the {terrain} favours or a neighbour practises:</div>
		{#each slot.features as f, fi (f.id)}
			{#each allowed[fi] as vi (vi)}
				<button onclick={() => pick(fi, vi)}>
					{f.label}: {vname(slotIndex, fi, vi)}
					<span class="faint small">{aff(slotIndex, fi, vi, terrain) > 0 ? `fits the ${terrain}` : 'from neighbours'}</span>
				</button>
			{/each}
		{/each}
	</div>
{/if}
