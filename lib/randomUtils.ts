// Deterministic pseudo-random helpers so a given seed always reproduces
// the same artwork variation.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stable per-index jitter in [-1, 1], derived from seed + index + channel.
export function jitter(seed: number, index: number, channel = 0): number {
  const rng = mulberry32(seed + index * 1013 + channel * 9176);
  return rng() * 2 - 1;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}

import type { CompositionState } from "./compositionTypes";

// Randomize only the *expressive* parameters — never the text content.
export function randomizeVariation(state: CompositionState): CompositionState {
  const rng = mulberry32(state.seed + 7);
  const wobble = (base: number, amount: number) =>
    Math.min(1, Math.max(0, base + (rng() * 2 - 1) * amount));

  return {
    ...state,
    seed: randomSeed(),
    brush: {
      ...state.brush,
      edgeRoughness: wobble(state.brush.edgeRoughness, 0.18),
      flyingWhite: wobble(state.brush.flyingWhite, 0.16),
      randomness: wobble(state.brush.randomness, 0.2),
      pressureVariation: wobble(state.brush.pressureVariation, 0.16),
      bleed: wobble(state.brush.bleed, 0.12),
    },
    layout: {
      ...state.layout,
      characterSpacing: wobble(state.layout.characterSpacing, 0.06),
      lineSpacing: wobble(state.layout.lineSpacing, 0.06),
    },
  };
}
