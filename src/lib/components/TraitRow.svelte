<script lang="ts">
	import type { Culture, GameState, MapTerrain } from '$lib/types';
	import { SLOTS } from '$lib/sim/slots';
	import { render, sameCustom, sameSet, strains } from '$lib/sim/engine';

	interface Props {
		gameState: GameState;
		player: Culture;
		slotIndex: number;
		terrain: MapTerrain;
	}

	let { gameState, player, slotIndex, terrain }: Props = $props();

	const slot = $derived(SLOTS[slotIndex]);
	const absent = $derived(player.absent.includes(slot.id));
	const changed = $derived(!sameCustom(player.traits[slotIndex], gameState.ancestral[slotIndex]));
	const strained = $derived(slot.features.filter((_f, fi) => player.traits[slotIndex][fi].some((vi) => strains(slotIndex, fi, vi, terrain))).map((f) => f.label));
	const kin = $derived(gameState.cultures.filter((c) => c.alive && !c.isPlayer));
	const wholeCount = $derived(kin.filter((k) => sameCustom(k.known[slotIndex], gameState.ancestral[slotIndex])).length);
	const partCount = $derived(
		kin.filter((k) => !sameCustom(k.known[slotIndex], gameState.ancestral[slotIndex]) && k.known[slotIndex].some((v, fi) => sameSet(v, gameState.ancestral[slotIndex][fi]))).length
	);
</script>

<div class="trait">
	<div>
		<div class="name">
			{slot.name}{#if changed}<span class="faint"> (was: {render(slotIndex, gameState.ancestral[slotIndex])})</span>{/if}
		</div>
		<div class="val" class:changed>
			{absent ? 'No longer kept' : render(slotIndex, player.traits[slotIndex])}
		</div>
		<div class="fit" class:strain={!absent && strained.length > 0} class:ok={absent || strained.length === 0}>
			{absent ? 'nothing to strain' : strained.length ? `strains against the ${terrain}: ${strained.join(', ')}` : `fits the ${terrain}`}
			<span class="faint"> · {wholeCount} kin keep it whole, {partCount} in part, as far as you know</span>
		</div>
	</div>
</div>
