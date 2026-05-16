// Central composition state model for Inkform Studio.
// Keep this the single source of truth — UI controls, the layout engine,
// the renderer and export utilities all read/write this shape.

export type CompositionMode = "poster" | "scroll" | "editorial" | "brand";

export type StyleKey =
  | "modern_expressive"
  | "classical_readable_cursive"
  | "hybrid_poster";

export type CanvasRatio =
  | "1:1"
  | "4:5"
  | "3:4"
  | "9:16"
  | "16:9"
  | "a4-portrait"
  | "a4-landscape";

export type Orientation =
  | "vertical-rtl"
  | "vertical-ltr"
  | "horizontal-ltr"
  | "horizontal-center";

export type Alignment = "start" | "center" | "end";

export type SealShape = "square" | "circle" | "oval";

export type SealPosition =
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right"
  | "near-signature";

export interface TextState {
  title: string;
  body: string;
  signature: string;
  seal: string;
}

export interface LayoutState {
  canvasRatio: CanvasRatio;
  orientation: Orientation;
  margin: number; // 0..1 fraction of the shorter side
  characterSpacing: number; // 0..1
  lineSpacing: number; // 0..1
  alignment: Alignment;
  titleSize: number; // relative scale
  bodySize: number; // relative scale
  signatureSize: number; // relative scale
  titleEmphasis: number; // 0..1
  whitespaceIntensity: number; // 0..1
}

export interface BrushState {
  thickness: number; // 0..1
  pressureVariation: number; // 0..1
  inkDensity: number; // 0..1
  dryness: number; // 0..1
  flyingWhite: number; // 0..1
  edgeRoughness: number; // 0..1
  strokeTaper: number; // 0..1
  strokeSpeed: number; // 0..1
  randomness: number; // 0..1
  bleed: number; // 0..1
  cursiveLevel: number; // 0..1
  readability: number; // 0..1
  connectionStrength: number; // 0..1
}

export interface SealState {
  enabled: boolean;
  text: string;
  shape: SealShape;
  position: SealPosition;
  opacity: number; // 0..1
  roughness: number; // 0..1
  size: number; // relative scale
}

export interface PaperState {
  backgroundColor: string;
  textureEnabled: boolean;
  textureIntensity: number; // 0..1
  transparent: boolean;
  border: boolean;
}

export interface ExportState {
  scale: number; // 1 | 2 | 3 | 4
}

export interface CompositionState {
  text: TextState;
  mode: CompositionMode;
  style: StyleKey;
  layout: LayoutState;
  brush: BrushState;
  seal: SealState;
  paper: PaperState;
  export: ExportState;
  seed: number;
}

export const CANVAS_RATIOS: Record<CanvasRatio, { w: number; h: number; label: string }> = {
  "1:1": { w: 1080, h: 1080, label: "1:1" },
  "4:5": { w: 1080, h: 1350, label: "4:5" },
  "3:4": { w: 1080, h: 1440, label: "3:4" },
  "9:16": { w: 1080, h: 1920, label: "9:16" },
  "16:9": { w: 1920, h: 1080, label: "16:9" },
  "a4-portrait": { w: 1240, h: 1754, label: "A4 直" },
  "a4-landscape": { w: 1754, h: 1240, label: "A4 橫" },
};
