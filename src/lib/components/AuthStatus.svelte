<script lang="ts">
	import type { Session } from '@auth/sveltekit';

	interface Props {
		session: Session | null;
		authEnabled: boolean;
	}

	let { session, authEnabled }: Props = $props();
</script>

{#if authEnabled}
	<div class="auth-status">
		{#if session?.user}
			<span class="who">{session.user.name ?? 'Signed in'}</span>
			<form method="POST" action="/signout">
				<button type="submit">Sign out</button>
			</form>
		{:else}
			<form method="POST" action="/signin">
				<input type="hidden" name="providerId" value="github" />
				<button type="submit">Sign in with GitHub</button>
			</form>
		{/if}
	</div>
{/if}

<style>
	.auth-status {
		display: flex;
		align-items: center;
		gap: var(--space);
	}
	.who {
		color: var(--color-text-muted);
		font-size: 13px;
	}
	button {
		background: none;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		font-family: inherit;
		font-size: 13px;
		line-height: 1;
		padding: 5px 8px;
	}
	button:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
	@media print {
		.auth-status {
			display: none;
		}
	}
</style>
