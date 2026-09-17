# Urheimat PHASE_1: Roadmap Overview

**23 tasks across 5 milestones.** Files: `.claude/roadmaps.json` (machine-readable), `docs/roadmaps/PHASE_1.md` (full task list with Mermaid dependency diagram).

> The phase opens with 19 of 22 tasks blocked. That is deliberate rather than pessimistic: the gameplay-loop spike holds the premise itself open, so the simulation and reconstruction work genuinely cannot be specified until it reports. Three tasks are actionable on day one, in three independent tracks.

---

## What we're building

Urheimat came out of the port as a complete, playable game with no remote, no persistence and no audience. It is also a game whose central argument, that reconstructing the past from surviving fragments is unreliable in specific and interesting ways, is currently made by a fairly thin model: sixteen customs whose parts drift by terrain affinity and proximity, compared flatly at the end against a single ancestral truth.

This phase pursues three things that do not depend on each other. It gets the game public, so there is somewhere real to ship to and someone other than its author can play it. It interrogates the design, because several of the mechanics have never been evaluated against play and the loop that contains them has never been questioned. And it deepens both halves of the simulation: the drift model that generates the evidence, and the scholar model that tries to read it.

The deepening is where most of the work sits, and most of it is about making the game fool its own scholars in ways that mirror how real reconstruction goes wrong. Prestige asymmetry creates areal features, where unrelated neighbours converge because they all copied the same prosperous culture. Substrate inheritance leaves traces of displaced peoples in whoever succeeded them. A second founding stock puts genuinely unrelated material into the record, so the scholars can be tempted into a false unity. None of these are difficulty settings; they are the specific failure modes the comparative method actually has.

## Milestone sequence and the reasoning behind it

**M1 Foundations and launch** exists because the game is client-side and therefore deployable today. Two tasks, ending in a public URL, needing nothing from any other milestone. Putting the deploy here rather than at the end of the persistence work means everything afterwards ships somewhere real rather than accumulating locally.

**M2 Design spikes** holds the two open questions. The gameplay-loop spike is the phase's critical path: it questions the premise, the victory conditions, the action economy and the six existing mechanics, and it decides how the condition, strain and action-budget states are derived once they stop being numbers. The UI spike follows it and the state-derivation work, because information architecture for states whose derivation is unsettled would be architecture built on sand. The UI spike also absorbs the mobile and accessibility work.

**M3 Persistence** is the other independent track. Saved runs, a signed-in player and a small leaderboard. It depends on the deploy only for the OAuth callback URL, and on nothing in the design or simulation milestones, so it can proceed in parallel throughout.

**M4 Simulation depth** is the largest milestone and sits entirely behind the loop spike. It contains the three state-derivation tasks, the four model changes (semantic drift, prestige asymmetry, second founding stock, substrate inheritance), two mechanic additions (taboo and archaism, richer inter-culture relations) and the content expansion.

**M5 Reconstruction** makes the scholars better and worse at once. The chronicle becomes the evidence base, attestation is derived from what actually happened in a run rather than from a die roll, the scholar model gains weighted evidence and competing hypotheses, and the scoring learns to handle two lineages.

## Decisions that shaped the structure

**The loop spike gates almost everything.** When the premise is genuinely open, writing thirteen downstream tasks as though their shape were settled would produce a plan that only looks like one. They are modelled as blocked, which is what blocked is for.

**Numbers leave the interface entirely.** Prosperity, strain and the action counter all become narrative state. This split across two spikes: the loop spike defines how each state is derived, the UI spike defines how it is shown. Prosperity is the hard one, since it currently drives death at zero and the daughter-band threshold, so the derivation has to preserve those mechanics while the player only ever reads prose.

**The second founding stock is noise, not a second goal.** The player leads a band from one stock and is still scored on recovering that stock's ancestral truth. The other exists so the record contains genuinely unrelated material.

**Attestation must be earned.** Deriving it from in-game events rather than a random roll is what makes being legible to the future a playable goal instead of a lottery. That requirement is what forces the chronicle to become a real evidence base first.

**The mechanics review folded into the loop spike.** Evaluating Hold, Reform, Teach, Consolidate, Daughter band and Migrate is inseparable from analysing the loop that contains them.

## External blockers (flag early)

None outside the author's control; the phase has no external gates. Three things are worth watching anyway:

- **The loop spike can invalidate its own downstream tasks.** If it concludes the premise should change substantially, some of M4 and M5 will need rewriting rather than merely unblocking. That is the accepted cost of asking the question properly.
- **Accessibility is inside a design spike.** Folding the mobile and accessibility work into the UI spike risks it becoming a stated intention rather than shipped work. The spike is required to produce concrete tasks, not principles; if it does not, that is a failure of the spike.
- **Saved runs will outlive the schema.** GameState changes throughout M4, so the serialised state needs a version from the start or early saved runs will break on load as the simulation deepens.
