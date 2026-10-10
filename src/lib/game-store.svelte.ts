import type { GameState, StepInput } from '$lib/types';
import { begin, newGame } from '$lib/sim/engine';

export type Tab = 'ours' | 'kin' | 'chronicle';
export type Phase = 'intro' | 'choose-start' | 'playing' | 'ending';

function freshStep(): StepInput {
	return { move: null, answers: {} };
}

class GameStore {
	state = $state<GameState | null>(null);
	phase = $state<Phase>('intro');
	step = $state<StepInput>(freshStep());
	tab = $state<Tab>('ours');
	choosingMove = $state(false);
	seed = $state(Date.now() % 100000);

	player() {
		if (!this.state || this.state.playerId === null) return null;
		return this.state.cultures[this.state.playerId];
	}

	resetStep() {
		this.step = freshStep();
		this.choosingMove = false;
	}

	newGame() {
		this.state = newGame(this.seed);
		this.phase = 'intro';
		this.resetStep();
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
		this.resetStep();
		this.tab = 'ours';
		this.phase = 'playing';
	}

	endEraCheck() {
		if (this.state?.over) this.phase = 'ending';
	}
}

export const game = new GameStore();
