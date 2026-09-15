<script lang="ts">
	import type { GameState, Point } from '$lib/types';
	import { W, H } from '$lib/sim/engine';
	import { TERRAIN_COLOUR, CULTURE_COLOUR, themeCanvasColours } from '$lib/sim/display';

	interface Props {
		gameState: GameState;
		selecting?: Point[];
		moveTarget?: Point | null;
		onPick?: (x: number, y: number) => void;
	}

	let { gameState, selecting = [], moveTarget = null, onPick }: Props = $props();

	let canvas: HTMLCanvasElement | undefined = $state();

	function draw() {
		if (!canvas) return;
		const widthPx = canvas.parentElement?.clientWidth || 360;
		const ts = Math.floor(widthPx / W);
		canvas.width = ts * W;
		canvas.height = ts * H;
		const g = canvas.getContext('2d');
		if (!g) return;
		const theme = themeCanvasColours();

		for (let y = 0; y < H; y++)
			for (let x = 0; x < W; x++) {
				const t = gameState.map.tiles[y][x];
				g.fillStyle = TERRAIN_COLOUR[t];
				g.fillRect(x * ts, y * ts, ts, ts);
				g.strokeStyle = 'rgba(0,0,0,.25)';
				g.strokeRect(x * ts + 0.5, y * ts + 0.5, ts - 1, ts - 1);
				if (t === 'mountain') {
					g.fillStyle = 'rgba(255,255,255,.35)';
					g.beginPath();
					g.moveTo(x * ts + ts * 0.2, y * ts + ts * 0.8);
					g.lineTo(x * ts + ts * 0.5, y * ts + ts * 0.25);
					g.lineTo(x * ts + ts * 0.8, y * ts + ts * 0.8);
					g.fill();
				}
				if (t === 'forest') {
					g.fillStyle = 'rgba(0,0,0,.25)';
					for (let k = 0; k < 3; k++) {
						g.beginPath();
						g.arc(x * ts + ts * (0.3 + 0.2 * k), y * ts + ts * (0.4 + 0.15 * (k % 2)), ts * 0.09, 0, 7);
						g.fill();
					}
				}
				if (t === 'river') {
					g.strokeStyle = 'rgba(120,180,255,.6)';
					g.lineWidth = 2;
					g.beginPath();
					g.moveTo(x * ts + ts * 0.2, y * ts + ts * 0.2);
					g.quadraticCurveTo(x * ts + ts * 0.7, y * ts + ts * 0.4, x * ts + ts * 0.3, y * ts + ts * 0.8);
					g.stroke();
					g.lineWidth = 1;
				}
				if (selecting.some((q) => q.x === x && q.y === y)) {
					g.strokeStyle = theme.ink;
					g.lineWidth = 2;
					g.strokeRect(x * ts + 3, y * ts + 3, ts - 6, ts - 6);
					g.lineWidth = 1;
				}
			}

		g.fillStyle = theme.ink;
		g.font = `${Math.round(ts * 0.5)}px serif`;
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		g.fillText('✦', gameState.map.cx * ts + ts / 2, gameState.map.cy * ts + ts / 2);

		gameState.cultures.forEach((c) => {
			if (!c.alive) return;
			const px = c.x * ts + ts / 2,
				py = c.y * ts + ts / 2,
				rr = ts * 0.3;
			g.beginPath();
			g.arc(px, py, rr, 0, 7);
			g.fillStyle = CULTURE_COLOUR[c.id % CULTURE_COLOUR.length];
			g.fill();
			g.strokeStyle = c.isPlayer ? '#fff' : 'rgba(0,0,0,.6)';
			g.lineWidth = c.isPlayer ? 3 : 1;
			g.stroke();
			g.lineWidth = 1;
			g.fillStyle = '#1a140e';
			g.font = `bold ${Math.round(ts * 0.34)}px serif`;
			g.fillText(c.name[0], px, py + 1);
		});

		if (moveTarget) {
			const { x, y } = moveTarget;
			g.strokeStyle = theme.accent;
			g.setLineDash([4, 3]);
			g.strokeRect(x * ts + 3, y * ts + 3, ts - 6, ts - 6);
			g.setLineDash([]);
		}
	}

	function handleClick(e: MouseEvent) {
		if (!canvas || !onPick) return;
		const r = canvas.getBoundingClientRect();
		const x = Math.floor(((e.clientX - r.left) / r.width) * W);
		const y = Math.floor(((e.clientY - r.top) / r.height) * H);
		if (selecting.some((q) => q.x === x && q.y === y)) onPick(x, y);
	}

	$effect(() => {
		// Redraw whenever the map, cultures, selection or move target change.
		void gameState.era;
		void selecting;
		void moveTarget;
		draw();
	});

	$effect(() => {
		const handleResize = () => draw();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	// The canvas reads theme colours via getComputedStyle at draw time, which does not
	// re-run on its own: matchMedia only fires for the OS preference, never for an
	// explicit data-theme write, so both signals are needed to keep the map in sync
	// with the toggle (see artefact-conventions.md, "Diagrams under a runtime toggle").
	$effect(() => {
		const media = matchMedia('(prefers-color-scheme: dark)');
		const handleSchemeChange = () => draw();
		media.addEventListener('change', handleSchemeChange);

		const observer = new MutationObserver(() => draw());
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		return () => {
			media.removeEventListener('change', handleSchemeChange);
			observer.disconnect();
		};
	});
</script>

<canvas bind:this={canvas} onclick={handleClick} aria-label="World map"></canvas>

<style>
	canvas {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--color-line);
		background: var(--color-surface-raised);
		border-radius: var(--radius-sm);
		touch-action: manipulation;
	}
</style>
