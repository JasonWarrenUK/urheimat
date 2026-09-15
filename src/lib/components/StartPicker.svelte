<script lang="ts">
	import type { GameState } from '$lib/types';
	import { startTiles } from '$lib/sim/engine';
	import WorldMap from './WorldMap.svelte';
	import TerrainLegend from './TerrainLegend.svelte';
	import { game } from '$lib/game-store.svelte';

	interface Props {
		gameState: GameState;
	}

	let { gameState }: Props = $props();

	const tiles = $derived(startTiles(gameState));
</script>

<h1>Urheimat</h1>
<p>Where does your band go? Tap a tile within two days' walk of the homeland. The land you choose will pull your customs after it.</p>
<WorldMap {gameState} selecting={tiles} onPick={(x, y) => game.chooseStart(x, y)} />
<TerrainLegend />
<p class="faint small">Terrain decides which customs come easily and which you must strain to keep.</p>
