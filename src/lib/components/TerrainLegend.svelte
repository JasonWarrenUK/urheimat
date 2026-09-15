<script lang="ts">
	import { TERRAIN_COLOUR, TERRAIN_LABEL } from '$lib/sim/display';

	const terrains = Object.keys(TERRAIN_COLOUR) as (keyof typeof TERRAIN_COLOUR)[];
</script>

<div class="legend">
	{#each terrains as t (t)}
		<span style:--c={TERRAIN_COLOUR[t]}>{TERRAIN_LABEL[t]}</span>
	{/each}
</div>
