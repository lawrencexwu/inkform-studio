// Style presets and the default composition.
//
// To add or tweak a style: edit STYLE_PRESETS below. Each preset only needs to
// declare the brush + layout deltas that define its aesthetic; everything else
// falls back to DEFAULT_COMPOSITION. To add a brand-new style, extend StyleKey
// in compositionTypes.ts and add a matching entry here.

import type {
  CompositionState,
  StyleKey,
  BrushState,
  LayoutState,
} from "./compositionTypes";

export const DEFAULT_COMPOSITION: CompositionState = {
  text: {
    title: "山高月小",
    body: "水落石出。曾日月之幾何，而江山不可復識矣。",
    signature: "癸巳春日",
    seal: "墨象",
  },
  mode: "poster",
  style: "modern_expressive",
  layout: {
    canvasRatio: "4:5",
    orientation: "vertical-rtl",
    margin: 0.11,
    characterSpacing: 0.16,
    lineSpacing: 0.34,
    alignment: "center",
    titleSize: 1.3,
    bodySize: 0.34,
    signatureSize: 0.26,
    titleEmphasis: 0.92,
    whitespaceIntensity: 0.72,
  },
  brush: {
    thickness: 0.82,
    pressureVariation: 0.86,
    inkDensity: 0.92,
    dryness: 0.4,
    flyingWhite: 0.52,
    edgeRoughness: 0.52,
    strokeTaper: 0.55,
    strokeSpeed: 0.5,
    randomness: 0.56,
    bleed: 0.34,
    cursiveLevel: 0.32,
    readability: 0.62,
    connectionStrength: 0.2,
  },
  seal: {
    enabled: true,
    text: "墨象",
    shape: "square",
    position: "bottom-left",
    opacity: 0.9,
    roughness: 0.5,
    size: 1,
  },
  paper: {
    backgroundColor: "#f4efe4",
    textureEnabled: true,
    textureIntensity: 0.4,
    transparent: false,
    border: false,
  },
  export: { scale: 2 },
  seed: 20260516,
};

interface StylePreset {
  label: string;
  sub: string;
  description: string;
  brush: Partial<BrushState>;
  layout: Partial<LayoutState>;
}

export const STYLE_PRESETS: Record<StyleKey, StylePreset> = {
  modern_expressive: {
    label: "現代寫意",
    sub: "Modern Expressive",
    description:
      "Bold, dramatic, high-contrast ink with wild scale tension and large brush gestures. Inspired by the spirit of contemporary Taiwanese expressive calligraphy (e.g. 董陽孜) — an aesthetic direction, not an imitation.",
    brush: {
      thickness: 0.84,
      inkDensity: 0.93,
      edgeRoughness: 0.55,
      flyingWhite: 0.55,
      pressureVariation: 0.88,
      randomness: 0.6,
      cursiveLevel: 0.34,
      readability: 0.6,
      bleed: 0.36,
    },
    layout: {
      titleSize: 1.3,
      titleEmphasis: 0.92,
      whitespaceIntensity: 0.72,
      characterSpacing: 0.16,
      bodySize: 0.34,
    },
  },
  classical_readable_cursive: {
    label: "古典行草",
    sub: "Classical Readable Cursive",
    description:
      "Elegant flowing 行草 rhythm with refined spacing. Inspired by classical readable cursive traditions.",
    brush: {
      thickness: 0.5,
      inkDensity: 0.62,
      edgeRoughness: 0.28,
      flyingWhite: 0.22,
      pressureVariation: 0.45,
      randomness: 0.3,
      cursiveLevel: 0.62,
      readability: 0.9,
      connectionStrength: 0.5,
      strokeTaper: 0.62,
    },
    layout: {
      titleEmphasis: 0.55,
      whitespaceIntensity: 0.5,
      characterSpacing: 0.12,
      lineSpacing: 0.28,
    },
  },
  hybrid_poster: {
    label: "海報混排",
    sub: "Hybrid Poster",
    description:
      "Readable yet dramatic — for posters, covers and branding. Inspired by modern poster calligraphy.",
    brush: {
      thickness: 0.7,
      inkDensity: 0.8,
      edgeRoughness: 0.45,
      flyingWhite: 0.4,
      pressureVariation: 0.6,
      randomness: 0.42,
      cursiveLevel: 0.32,
      readability: 0.8,
    },
    layout: {
      titleEmphasis: 0.92,
      whitespaceIntensity: 0.58,
      bodySize: 0.38,
      characterSpacing: 0.16,
    },
  },
};

export function applyStyle(
  state: CompositionState,
  style: StyleKey
): CompositionState {
  const preset = STYLE_PRESETS[style];
  return {
    ...state,
    style,
    brush: { ...state.brush, ...preset.brush },
    layout: { ...state.layout, ...preset.layout },
  };
}
