<script lang="ts">
	import type { Culture, GameState, Orders } from '$lib/types';
	import { SLOTS } from '$lib/sim/slots';
	import { contact } from '$lib/sim/engine';
	import { game } from '$lib/game-store.svelte';

	interface Props {
		gameState: GameState;
		player: Culture;
		orders: Orders;
	}

	let { gameState, player, orders }: Props = $props();

	interface TeachOption {
		kin: Culture;
		slotIndex: number;
		parts: string[];
	}

	const options = $derived.by((): TeachOption[] => {
		const nb = gameState.cultures.filter((c) => c.alive && !c.isPlayer && contact(gameState, player, c) >= 0.5);
		const out: TeachOption[] = [];
		nb.forEach((k) => {
			SLOTS.forEach((sl, si) => {
				const parts = sl.features
					.filter((_f, fi) => player.traits[si][fi] === gameState.ancestral[si][fi] && k.traits[si][fi] !== gameState.ancestral[si][fi])
					.map((f) => f.label);
				if (parts.length) out.push({ kin: k, slotIndex: si, parts });
			});
		});
		return out;
	});

	function choose(kin: number, slotIndex: number) {
		orders.teach = { kin, slot: slotIndex };
		game.mode = null;
	}
</script>

<div class="picker">
	<div class="small muted">
		{#if options.length}
			Send your elders to a people in contact and restore the parts of a custom they have lost and you still keep:
		{:else}
			Nobody in contact has lost a part you still keep.
		{/if}
	</div>
	{#each options as o (o.kin.id + ':' + o.slotIndex)}
		<button onclick={() => choose(o.kin.id, o.slotIndex)}>
			the {o.kin.name}: {SLOTS[o.slotIndex].name.toLowerCase()}
			<span class="faint small">({o.parts.join(', ')})</span>
		</button>
	{/each}
</div>
