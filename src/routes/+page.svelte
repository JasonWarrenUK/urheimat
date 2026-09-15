<script lang="ts">
	import { game } from '$lib/game-store.svelte';
	import IntroScreen from '$lib/components/IntroScreen.svelte';
	import StartPicker from '$lib/components/StartPicker.svelte';
	import GameScreen from '$lib/components/GameScreen.svelte';
	import ReconstructorNotebook from '$lib/components/ReconstructorNotebook.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	if (!game.state) game.newGame();
</script>

<svelte:head>
	<title>Urheimat</title>
</svelte:head>

<div id="app">
	<div class="row" style="justify-content:flex-end;padding-top:2px">
		<ThemeToggle />
	</div>
	{#if game.state}
		{#if game.phase === 'intro'}
			<IntroScreen gameState={game.state} onScatter={() => game.scatter()} />
		{:else if game.phase === 'choose-start'}
			<StartPicker gameState={game.state} />
		{:else if game.phase === 'playing'}
			<GameScreen gameState={game.state} />
		{:else if game.phase === 'ending'}
			<ReconstructorNotebook gameState={game.state} />
		{/if}
	{/if}
</div>
