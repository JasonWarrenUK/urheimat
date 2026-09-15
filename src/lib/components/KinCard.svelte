<script lang="ts">
	import type { Culture, GameState } from '$lib/types';
	import { SLOTS, FEATURE_COUNT } from '$lib/sim/slots';
	import { contact, sameCustom, vname } from '$lib/sim/engine';
	import { CULTURE_COLOUR, TERRAIN_LABEL } from '$lib/sim/display';

	interface Props {
		gameState: GameState;
		player: Culture;
		kin: Culture;
	}

	let { gameState, player, kin }: Props = $props();

	const w = $derived(contact(gameState, player, kin));
	const rel = $derived(
		!kin.alive ? `gone in era ${kin.diedEra}` : w >= 1 ? 'close neighbours' : w >= 0.5 ? 'in touch' : w > 0 ? 'distant' : 'out of touch'
	);
	const terrain = $derived(kin.alive ? gameState.map.tiles[kin.y][kin.x] : null);
	const diffs = $derived(
		SLOTS.map((slot, si) => {
			if (sameCustom(kin.known[si], gameState.ancestral[si])) return null;
			const parts = slot.features
				.map((_f, fi) => (kin.known[si][fi] === gameState.ancestral[si][fi] ? null : vname(si, fi, kin.known[si][fi])))
				.filter((x): x is string => x !== null);
			return `${slot.name.toLowerCase()}: ${parts.join(', ')}`;
		}).filter((x): x is string => x !== null)
	);
	const keptParts = $derived(kin.known.reduce((a, fv, si) => a + fv.filter((v, fi) => v === gameState.ancestral[si][fi]).length, 0));
</script>

<div class="kin" class:dead={!kin.alive}>
	<div class="head">
		<b><span style:color={CULTURE_COLOUR[kin.id % CULTURE_COLOUR.length]}>●</span> the {kin.name}</b>
		<span class="small muted">{kin.alive ? `${TERRAIN_LABEL[terrain!]}, ` : ''}{rel}</span>
	</div>
	<div class="small faint">
		{#if kin.parent !== null}daughter of the {gameState.cultures[kin.parent].name}; {/if}
		as last known (era {kin.knownEra}), keeps {keptParts} of {FEATURE_COUNT} ancestral parts{#if kin.alive}; prosperity {w >= 0.5 ? kin.prosperity.toFixed(0) : 'unknown'}{/if}
	</div>
	<div class="diff">
		{#if diffs.length}
			{diffs.join(' · ')}
		{:else}
			Nothing known to have changed.
		{/if}
	</div>
</div>
