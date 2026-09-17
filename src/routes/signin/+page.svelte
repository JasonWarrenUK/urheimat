<svelte:head>
	<title>Sign in · Urheimat</title>
</svelte:head>

<div id="app">
	<h1>Sign in</h1>
	<p>Signing in keeps your runs across sessions and devices.</p>
	<form method="POST">
		<input type="hidden" name="providerId" value="github" />
		<button type="submit">Sign in with GitHub</button>
	</form>
	<p><a href="/">Back to the game</a></p>
</div>
