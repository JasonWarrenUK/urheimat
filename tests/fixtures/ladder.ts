export const seed = 12345;
// A route that is always fed, with two tiers: surfaces at once, forces the outcome when the second is refused.
export const always = { id: 'always', kind: 'death' as const, feeds: [{ when: [], by: 1 }], hold: 1, tiers: 2, fade: 0.5, forced: { death: true as const } };
// A route that nothing feeds, for fading and stepping down.
export const never = { id: 'never', kind: 'death' as const, feeds: [{ when: [{ year: [9999, 9999] as [number, number] }], by: 1 }], hold: 1, tiers: 2, fade: 0.5, forced: { death: true as const } };
