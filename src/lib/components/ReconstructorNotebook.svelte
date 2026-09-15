<script lang="ts">
	import type { GameState } from '$lib/types';
	import { SLOTS, FEATURE_COUNT } from '$lib/sim/slots';
	import { reconstruct, render, vname } from '$lib/sim/engine';
	import { game } from '$lib/game-store.svelte';

	interface Props {
		gameState: GameState;
	}

	let { gameState }: Props = $props();

	const result = $derived(reconstruct(gameState));
	const player = $derived(gameState.playerId !== null ? gameState.cultures[gameState.playerId] : null);
</script>

<h1 style="font-size:30px">The Reconstructor's notebook</h1>
<p class="muted">
	Three thousand years on. {result.survivors} peoples descend from the {gameState.peopleName}{#if player?.alive}, among them the {player.name}{:else}; the {player?.name} are not among them{/if}. Reconstructed forms are marked with an asterisk, as is the custom; an ellipsis is a part the scholars could not recover.
</p>
<div class="score">{result.total} <small>of {result.max}</small></div>
<p class="small muted">
	Of {FEATURE_COUNT} parts: {result.counts.correct} recovered, {result.counts.wrong} reconstructed wrongly, {result.counts.lost} unrecoverable. Secure recoveries score 2, doubtful ones 1, false ones −1.
</p>
<div class="notebook">
	{#each result.entries as entry, i (entry.slot)}
		{#if i === 0 || SLOTS[entry.slot].domain !== SLOTS[result.entries[i - 1].slot].domain}
			<div class="domain">{SLOTS[entry.slot].domain}</div>
		{/if}
		<div class="entry">
			<div class="slot">{SLOTS[entry.slot].name} <span class="faint">· {entry.pts >= 0 ? '+' : ''}{entry.pts}</span></div>
			<div class="rec"><span class="star">*</span>{render(entry.slot, entry.recFv)}</div>
			<div class="small muted">In truth: {render(entry.slot, gameState.ancestral[entry.slot])}</div>
			{#each entry.feats as f (f.f)}
				<div class="note">
					<span class="verdict v-{f.verdict}">{f.verdict === 'correct' ? (f.conf === 'secure' ? 'secure' : 'doubtful') : f.verdict}</span>
					{f.label}{#if f.verdict === 'wrong'}: <em>{vname(entry.slot, f.f, f.rec as number)}</em> for <em>{vname(entry.slot, f.f, f.truth)}</em>{/if}
					— {@html f.note}
				</div>
			{/each}
		</div>
	{/each}
</div>
<div class="row" style="margin-top:18px">
	<button class="primary" onclick={() => game.reroll()}>A new people</button>
	<button onclick={() => game.newGame()}>The same people again</button>
</div>
