<script lang="ts">
	import type { GameState } from '$lib/types';
	import { SLOTS } from '$lib/sim/slots';
	import { render } from '$lib/sim/engine';
	import { game } from '$lib/game-store.svelte';

	interface Props {
		gameState: GameState;
		onScatter: () => void;
	}

	let { gameState, onScatter }: Props = $props();

	const byDomain = $derived.by(() => {
		const groups = new Map<string, { slotIndex: number }[]>();
		SLOTS.forEach((sl, i) => {
			if (!groups.has(sl.domain)) groups.set(sl.domain, []);
			groups.get(sl.domain)!.push({ slotIndex: i });
		});
		return [...groups.entries()];
	});
</script>

<h1>Urheimat</h1>
<p class="muted">The {gameState.peopleName}, a people of the {gameState.homeTerrain}. Nobody will ever write down what they believed.</p>
<div class="goal">
	<p>Three thousand years from now, scholars will gather the customs of every people descended from the {gameState.peopleName} and try to reconstruct the original by comparison.</p>
	<p>
		Each custom is made of parts, and the parts drift separately: a people may keep the Sky and lose the Father. The scholars work part by part.
		They trust a part only when it is kept by two peoples who never met and live on different kinds of land, or by three who never met on the
		same kind. Neighbours who agree may have borrowed. Peoples on the same land may have converged. Both fool them, and a false reconstruction
		counts against you.
	</p>
	<p>
		You lead one band through eight eras with three actions each. Hold what your kin will lose, adapt what you must to survive, teach neighbours
		what they have forgotten, send out daughters to be witnesses, and stay alive: a dead people testifies to nothing.
	</p>
</div>
<h2>What the {gameState.peopleName} know to be true</h2>
<div class="ancestral">
	{#each byDomain as [domain, slots] (domain)}
		<div class="domain">{domain}</div>
		{#each slots as { slotIndex } (slotIndex)}
			<div class="trait">
				<span class="name">{SLOTS[slotIndex].name}</span>
				<span class="val">{render(slotIndex, gameState.ancestral[slotIndex])}</span>
			</div>
		{/each}
	{/each}
</div>
<div class="row" style="margin-top:16px">
	<button class="primary" onclick={onScatter}>Scatter</button>
	<button onclick={() => game.reroll()}>Another people</button>
	<span class="faint small">world {game.seed}</span>
</div>
