// Layout engine: turns the composition state into absolute glyph positions.
// Rendering (renderCalligraphy.tsx) is intentionally kept separate so the
// placement logic can be unit-tested or swapped for a stroke-level engine
// later without touching SVG/filter code.

import {
  CANVAS_RATIOS,
  type CompositionState,
} from "./compositionTypes";

export type GlyphRole = "title" | "body" | "signature";

export interface PlacedGlyph {
  char: string;
  x: number; // glyph center x
  y: number; // glyph center y
  size: number; // font size in px
  role: GlyphRole;
  index: number; // stable global index, used for deterministic jitter
}

export interface LayoutResult {
  width: number;
  height: number;
  glyphs: PlacedGlyph[];
  // Anchor point used by the seal when position === "near-signature".
  signatureAnchor: { x: number; y: number } | null;
}

const isVertical = (o: string) => o.startsWith("vertical");

// Split a section into runs separated by explicit newlines. Whitespace inside
// a run is dropped (CJK calligraphy has no spaces); newlines force a break.
function toRuns(raw: string): string[][] {
  return raw
    .split(/\r?\n/)
    .map((line) =>
      Array.from(line).filter((c) => c.trim().length > 0 || c === "　")
    )
    .filter((r) => r.length > 0);
}

export function layoutComposition(state: CompositionState): LayoutResult {
  const { w, h } = CANVAS_RATIOS[state.layout.canvasRatio];
  const L = state.layout;
  const shorter = Math.min(w, h);
  const margin = L.margin * shorter;
  const usableW = w - margin * 2;
  const usableH = h - margin * 2;

  // Whitespace intensity globally shrinks the live text area.
  const breath = 1 - L.whitespaceIntensity * 0.28;

  const titleRuns = toRuns(state.text.title);
  const bodyRuns = toRuns(state.text.body);
  const signRuns = toRuns(state.text.signature);

  // Base unit derives from the canvas so output scales with ratio.
  const base = shorter / 12;
  const titleEmphasis = 0.75 + L.titleEmphasis * 1.1;
  let titleSize = base * 1.5 * L.titleSize * titleEmphasis;
  const bodySize = base * 1.35 * L.bodySize;
  const signSize = base * 1.3 * L.signatureSize;

  const glyphs: PlacedGlyph[] = [];
  let signatureAnchor: { x: number; y: number } | null = null;
  let gi = 0;

  if (isVertical(L.orientation)) {
    const rtl = L.orientation === "vertical-rtl";
    // Column advance = glyph box + line spacing.
    const colGap = (s: number) => s * (1 + L.lineSpacing * 1.4);
    const stepY = (s: number) => s * (1 + L.characterSpacing);

    // Fit the title into a single column height-wise if needed.
    const maxTitleChars = Math.max(...titleRuns.map((r) => r.length), 1);
    const titleColCap = usableH * breath;
    if (maxTitleChars * stepY(titleSize) > titleColCap) {
      titleSize = titleColCap / (maxTitleChars * (1 + L.characterSpacing));
    }

    // Build the ordered list of columns (memory order, left list = first read).
    interface Col {
      width: number;
      glyphs: { char: string; size: number; yStart: number; gap: number }[];
    }
    const cols: Col[] = [];

    const flowSection = (
      runs: string[][],
      size: number,
      role: GlyphRole,
      yTopFactor = 0
    ) => {
      const cap = Math.max(
        1,
        Math.floor((usableH * breath) / stepY(size))
      );
      for (const run of runs) {
        for (let i = 0; i < run.length; i += cap) {
          const slice = run.slice(i, i + cap);
          cols.push({
            width: colGap(size),
            glyphs: slice.map((char, k) => ({
              char,
              size,
              yStart:
                margin +
                usableH * yTopFactor +
                size * 0.5 +
                k * stepY(size),
              gap: 0,
            })),
          });
        }
      }
    };

    flowSection(titleRuns, titleSize, "title");
    if (bodyRuns.length) cols.push({ width: colGap(bodySize) * 0.4, glyphs: [] });
    flowSection(bodyRuns, bodySize, "body");
    if (signRuns.length) {
      cols.push({ width: colGap(signSize) * 0.5, glyphs: [] });
      // Signature sits in the lower portion of its column (落款 feel).
      flowSection(signRuns, signSize, "signature", 0.42);
    }

    const totalW = cols.reduce((a, c) => a + c.width, 0);
    // Center the whole block within the usable width.
    let cursor = margin + Math.max(0, (usableW - totalW) / 2);

    for (const col of cols) {
      const cx = col.width / 2;
      const xLeft = cursor + cx;
      const x = rtl ? w - xLeft : xLeft;
      for (const g of col.glyphs) {
        glyphs.push({
          char: g.char,
          x,
          y: g.yStart,
          size: g.size,
          role:
            g.size === titleSize
              ? "title"
              : g.size === signSize
              ? "signature"
              : "body",
          index: gi++,
        });
      }
      cursor += col.width;
    }

    const sg = glyphs.filter((g) => g.role === "signature");
    if (sg.length) {
      signatureAnchor = {
        x: sg[0].x,
        y: sg[sg.length - 1].y + signSize,
      };
    }
  } else {
    // Horizontal flow: lines stack top → bottom.
    const center = L.orientation === "horizontal-center";
    const stepX = (s: number) => s * (1 + L.characterSpacing);
    const lineGap = (s: number) => s * (1 + L.lineSpacing * 1.5);

    let y = margin + titleSize * 0.6;

    const flowSection = (
      runs: string[][],
      size: number,
      role: GlyphRole
    ) => {
      const cap = Math.max(1, Math.floor(usableW / stepX(size)));
      for (const run of runs) {
        for (let i = 0; i < run.length; i += cap) {
          const slice = run.slice(i, i + cap);
          const lineW = slice.length * stepX(size);
          let startX: number;
          if (center || L.alignment === "center") {
            startX = margin + (usableW - lineW) / 2 + stepX(size) / 2;
          } else if (L.alignment === "end") {
            startX = margin + usableW - lineW + stepX(size) / 2;
          } else {
            startX = margin + stepX(size) / 2;
          }
          y += size * 0.5;
          slice.forEach((char, k) => {
            glyphs.push({
              char,
              x: startX + k * stepX(size),
              y,
              size,
              role,
              index: gi++,
            });
          });
          y += lineGap(size) - size * 0.5;
        }
      }
    };

    flowSection(titleRuns, titleSize, "title");
    if (bodyRuns.length) y += bodySize * 0.6;
    flowSection(bodyRuns, bodySize, "body");
    if (signRuns.length) {
      y += signSize * 0.8;
      flowSection(signRuns, signSize, "signature");
    }

    const sg = glyphs.filter((g) => g.role === "signature");
    if (sg.length) {
      const last = sg[sg.length - 1];
      signatureAnchor = { x: last.x, y: last.y + signSize };
    }
  }

  return { width: w, height: h, glyphs, signatureAnchor };
}
