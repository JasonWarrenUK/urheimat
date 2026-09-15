import { SvelteSet } from 'svelte/reactivity';
import type { GameState, Orders } from '$lib/types';
import { begin, newGame } from '$lib/sim/engine';

export type Tab = 'ours' | 'kin' | 'chronicle';
export type Mode = 'move' | 'teach' | null;
export type Phase = 'intro' | 'choose-start' | 'playing' | 'ending';

// held must be a SvelteSet: $state's deep proxy does not wrap Set/Map, so a plain
// Set here would mutate silently and never notify $derived reads like actionsLeft().
function freshOrders(): Orders {
	return { held: new SvelteSet<number>(), reforms: {}, move: null, split: false, consolidate: 0, teach: null };
}

class GameStore {
	state = $state<GameState | null>(null);
	phase = $state<Phase>('intro');
	orders = $state<Orders>(freshOrders());
	tab = $state<Tab>('ours');
	mode = $state<Mode>(null);
	picker = $state<number | null>(null);
	seed = $state(Date.now() % 100000);

	player() {
		if (!this.state || this.state.playerId === null) return null;
		return this.state.cultures[this.state.playerId];
	}

	resetOrders() {
		this.orders = freshOrders();
		this.mode = null;
		this.picker = null;
	}

	newGame() {
		this.state = newGame(this.seed);
		this.phase = 'intro';
		this.resetOrders();
	}

	reroll() {
		this.seed = (this.seed * 7919 + 13) % 100000;
		this.newGame();
	}

	scatter() {
		this.phase = 'choose-start';
	}

	chooseStart(x: number, y: number) {
		if (!this.state) return;
		begin(this.state, x, y);
		this.resetOrders();
		this.tab = 'ours';
		this.phase = 'playing';
	}

	endEraCheck() {
		if (this.state?.over) this.phase = 'ending';
	}

	actionsUsed(): number {
		return (
			this.orders.held.size +
			Object.keys(this.orders.reforms).length +
			(this.orders.move ? 1 : 0) +
			(this.orders.split ? 1 : 0) +
			(this.orders.teach ? 1 : 0) +
			this.orders.consolidate
		);
	}

	actionsLeft(): number {
		return 3 - this.actionsUsed();
	}
}

export const game = new GameStore();
