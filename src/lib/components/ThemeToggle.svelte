<script lang="ts">
	type Mode = 'light' | 'system' | 'dark';
	const KEY = 'theme';

	function read(): Mode {
		try {
			return (localStorage.getItem(KEY) as Mode) || 'system';
		} catch {
			return 'system';
		}
	}
	function write(mode: Mode) {
		try {
			localStorage.setItem(KEY, mode);
		} catch {
			// private window, blocked storage, preview capture: ignore
		}
	}
	function apply(mode: Mode) {
		const root = document.documentElement;
		if (mode === 'system') root.removeAttribute('data-theme');
		else root.setAttribute('data-theme', mode);
	}

	let mode = $state<Mode>('system');

	$effect(() => {
		mode = read();
		apply(mode);
	});

	function set(next: Mode) {
		mode = next;
		write(next);
		apply(next);
	}
</script>

<div class="theme-toggle" role="group" aria-label="Colour theme">
	<button type="button" aria-pressed={mode === 'light'} onclick={() => set('light')}>☀</button>
	<button type="button" aria-pressed={mode === 'system'} onclick={() => set('system')}>◐</button>
	<button type="button" aria-pressed={mode === 'dark'} onclick={() => set('dark')}>☾</button>
</div>

<style>
	.theme-toggle {
		display: flex;
		gap: 2px;
		margin-left: auto;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm);
		padding: 2px;
	}
	.theme-toggle button {
		background: none;
		border: none;
		border-radius: calc(var(--radius-sm) - 1px);
		color: var(--color-text-muted);
		font-size: 13px;
		line-height: 1;
		padding: 4px 7px;
		cursor: pointer;
	}
	.theme-toggle button[aria-pressed='true'] {
		background: var(--color-primary);
		color: var(--color-on-primary);
	}
	@media print {
		.theme-toggle {
			display: none;
		}
	}
</style>
