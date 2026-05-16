// SVG calligraphy renderer.
//
// Stroke-level engine: each character is drawn from the dataset's REAL
// regular-script (楷書) stroke outlines (correctly-shaped paths), then given
// a calligraphic feel with per-character variation, ink-weight dilation and
// SVG texture filters (turbulence / displacement / bleed) plus a flying-white
// mask. The character shapes themselves stay correct and legible.
//
// Characters with no stroke data (rare forms / punctuation) fall back to a
// clean serif glyph so text is never corrupted.

import { forwardRef, useEffect, useMemo, useState } from "react";
import type { CompositionState } from "./compositionTypes";
import { layoutComposition, type PlacedGlyph } from "./layoutEngine";
import { jitter } from "./randomUtils";
import {
  loadStrokes,
  getCachedStrokes,
  GRID,
  GRID_CENTER,
  type CharStrokes,
} from "./strokeData";

// Async-loads stroke data for every unique character on screen and re-renders
// as it arrives. Until a glyph's data is ready it falls back to the font.
function useStrokeMap(chars: string[]) {
  const key = chars.join("");
  const [, bump] = useState(0);
  useEffect(() => {
    let alive = true;
    Promise.all(chars.map((ch) => loadStrokes(ch))).then(() => {
      if (alive) bump((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, [key]);
  // Read-through the module cache (populated by loadStrokes).
  const map = new Map<string, CharStrokes | null>();
  for (const ch of chars) map.set(ch, getCachedStrokes(ch) ?? null);
  return map;
}

// Clean Traditional-coverage serif — used only for the rare fallback glyph.
const FALLBACK_FONT =
  '"Noto Serif TC","Songti TC","Source Han Serif TC","PMingLiU",serif';
const SEAL_FONT = FALLBACK_FONT;

function sealColor(roughness: number) {
  return roughness > 0.6 ? "#a83227" : "#c0392b";
}

interface Props {
  state: CompositionState;
}

export const CalligraphySvg = forwardRef<SVGSVGElement, Props>(
  function CalligraphySvg({ state }, ref) {
    const layout = layoutComposition(state);
    const { width, height } = layout;
    const b = state.brush;
    const p = state.paper;
    const seed = state.seed;

    const uniqueChars = useMemo(
      () => Array.from(new Set(layout.glyphs.map((g) => g.char))),
      [layout.glyphs]
    );
    const strokeMap = useStrokeMap(uniqueChars);

    // --- Filter parameters derived from brush sliders ---
    // Kept gentle: the outlines are correct shapes, so texture should
    // weather the edges, not destroy them.
    const distortFreq = (0.01 + b.edgeRoughness * 0.03).toFixed(4);
    const distortScale = (b.edgeRoughness * 4 + b.randomness * 2).toFixed(2);
    const bleedBlur = (b.bleed * 1.1 + b.dryness * 0.25).toFixed(2);
    // Ink weight: dilation thickens the real strokes into brush mass.
    const dilate = (0.4 + b.thickness * 3.2 + b.inkDensity * 1.0).toFixed(2);

    // Flying white: streaky alpha knockout, capped so text stays readable.
    const fwAmount = b.flyingWhite * (0.85 - b.readability * 0.35);
    const fwSlope = (3 + b.dryness * 4).toFixed(2);
    const fwIntercept = (-(1 - fwAmount) * 0.9).toFixed(3);

    const inkAlpha = 0.7 + b.inkDensity * 0.3 - b.dryness * 0.15;

    const skew = b.cursiveLevel * 9 * (1 - b.readability * 0.4);
    const jitterAmt = b.randomness * (1 - b.readability * 0.45);

    const renderGlyph = (g: PlacedGlyph, layer: "main" | "echo") => {
      const rot =
        jitter(seed, g.index, 1) *
        (g.role === "title" ? 3.2 : 5.5) *
        jitterAmt;
      // Gentle per-character size variation (the hand never repeats exactly).
      // Driven by pressure variation, tamed by readability so it stays clean.
      const drama = b.pressureVariation * (1 - b.readability * 0.55);
      const scaleVar =
        1 +
        jitter(seed, g.index, 7) *
          (g.role === "title" ? 0.16 : 0.09) *
          drama;
      const sx =
        (1 + jitter(seed, g.index, 2) * 0.03 * jitterAmt) * scaleVar;
      const sy =
        (1 + jitter(seed, g.index, 3) * 0.04 * jitterAmt) * scaleVar;
      const dx = jitter(seed, g.index, 4) * g.size * 0.03 * jitterAmt;
      const dy = jitter(seed, g.index, 5) * g.size * 0.03 * jitterAmt;
      const op = 0.9 + Math.abs(jitter(seed, g.index, 6)) * 0.1;
      const sk = g.role === "signature" ? skew * 0.5 : skew;

      // Per-glyph placement transform (glyph centred at its layout point).
      const place =
        `translate(${(g.x + dx).toFixed(2)},${(g.y + dy).toFixed(2)}) ` +
        `rotate(${rot.toFixed(2)}) skewX(${(-sk).toFixed(2)}) ` +
        `scale(${sx.toFixed(3)},${sy.toFixed(3)})`;

      const data = strokeMap.get(g.char);

      // --- Real regular-script stroke outlines ---
      if (data && data.strokes.length) {
        // Outlines are already solid shapes; the echo pass is font-only.
        if (layer === "echo") return null;
        const k = g.size / GRID;
        // Map the raw 1024 design grid → a cell centred on the origin:
        // (x,y) → (k·(x-512), k·(512-y)).
        const fit =
          `translate(${(-GRID_CENTER * k).toFixed(3)},${(
            GRID_CENTER * k
          ).toFixed(3)}) scale(${k.toFixed(5)},${(-k).toFixed(5)})`;
        return (
          <path
            key={`s-${g.index}`}
            d={data.strokes.join(" ")}
            fill="#0b0807"
            fillRule="nonzero"
            opacity={op}
            transform={`${place} ${fit}`}
          />
        );
      }

      // --- Fallback: clean serif glyph (keeps rare characters correct) ---
      if (layer === "echo") return null;
      return (
        <text
          key={`f-${g.index}`}
          x={0}
          y={0}
          fontSize={g.size}
          fontFamily={FALLBACK_FONT}
          fontWeight={g.role === "title" ? 700 : 500}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0b0807"
          opacity={op}
          transform={place}
        >
          {g.char}
        </text>
      );
    };

    const aspect = `${width} / ${height}`;

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ aspectRatio: aspect, display: "block" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Paper grain */}
          <filter id="paperTex" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves={2}
              seed={seed % 100}
              result="n"
            />
            <feColorMatrix in="n" type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA
                type="linear"
                slope={(p.textureIntensity * 0.16).toFixed(3)}
              />
            </feComponentTransfer>
          </filter>

          {/* Brush distortion + paper bleed */}
          <filter
            id="brush"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={distortFreq}
              numOctaves={2}
              seed={seed % 97}
              result="warp"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="warp"
              scale={distortScale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="disp"
            />
            <feMorphology
              in="disp"
              operator="dilate"
              radius={dilate}
              result="thick"
            />
            <feGaussianBlur in="thick" stdDeviation={bleedBlur} />
          </filter>

          {/* Flying-white streak mask */}
          <filter id="fwTex">
            <feTurbulence
              type="turbulence"
              baseFrequency={`0.008 ${(0.22 + b.dryness * 0.3).toFixed(3)}`}
              numOctaves={2}
              seed={(seed % 53) + 11}
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope={fwSlope} intercept={fwIntercept} />
              <feFuncG type="linear" slope={fwSlope} intercept={fwIntercept} />
              <feFuncB type="linear" slope={fwSlope} intercept={fwIntercept} />
              <feFuncA type="linear" slope="0" intercept="1" />
            </feComponentTransfer>
          </filter>
          <mask id="flyingWhite">
            <rect width={width} height={height} fill="#fff" />
            {fwAmount > 0.02 && (
              <rect width={width} height={height} filter="url(#fwTex)" />
            )}
          </mask>

          {/* Seal stamp roughness */}
          <filter id="sealRough" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence
              type="turbulence"
              baseFrequency={(0.04 + state.seal.roughness * 0.08).toFixed(4)}
              numOctaves={2}
              seed={(seed % 31) + 3}
              result="sn"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="sn"
              scale={state.seal.roughness * 7}
            />
          </filter>
        </defs>

        {/* Background */}
        {!p.transparent && (
          <rect
            width={width}
            height={height}
            fill={p.backgroundColor}
          />
        )}
        {!p.transparent && p.textureEnabled && (
          <rect
            width={width}
            height={height}
            fill="#000"
            filter="url(#paperTex)"
          />
        )}

        {/* Optional border */}
        {p.border && (
          <rect
            x={width * 0.035}
            y={height * 0.035}
            width={width * 0.93}
            height={height * 0.93}
            fill="none"
            stroke="#1c1a17"
            strokeWidth={Math.max(width, height) * 0.0035}
            opacity={0.6}
          />
        )}

        {/* Ink */}
        <g
          filter="url(#brush)"
          mask="url(#flyingWhite)"
          opacity={inkAlpha}
          style={{ paintOrder: "stroke fill" }}
        >
          {layout.glyphs.map((g) => renderGlyph(g, "main"))}
        </g>

        {/* Seal */}
        {state.seal.enabled && (
          <Seal state={state} layout={layout} />
        )}
      </svg>
    );
  }
);

function Seal({
  state,
  layout,
}: {
  state: CompositionState;
  layout: ReturnType<typeof layoutComposition>;
}) {
  const s = state.seal;
  const { width, height } = layout;
  const unit = Math.min(width, height);
  const size = unit * 0.11 * s.size;
  const pad = unit * 0.06;

  let cx: number;
  let cy: number;
  if (s.position === "near-signature" && layout.signatureAnchor) {
    cx = layout.signatureAnchor.x;
    cy = layout.signatureAnchor.y + size * 0.75;
  } else {
    const top = s.position.startsWith("top");
    const left = s.position.endsWith("left");
    cx = left ? pad + size / 2 : width - pad - size / 2;
    cy = top ? pad + size / 2 : height - pad - size / 2;
  }
  cx = Math.min(width - size / 2, Math.max(size / 2, cx));
  cy = Math.min(height - size / 2, Math.max(size / 2, cy));

  const color = sealColor(s.roughness);
  const chars = Array.from(s.text || "").slice(0, 4);
  const grid = chars.length > 1 ? 2 : 1;
  const cell = size / grid;

  return (
    <g
      opacity={s.opacity}
      filter="url(#sealRough)"
      transform={`translate(${cx - size / 2},${cy - size / 2})`}
    >
      {s.shape === "circle" && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          fill={color}
        />
      )}
      {s.shape === "oval" && (
        <ellipse
          cx={size / 2}
          cy={size / 2}
          rx={size / 2}
          ry={size * 0.62}
          fill={color}
        />
      )}
      {s.shape === "square" && (
        <rect width={size} height={size} rx={size * 0.06} fill={color} />
      )}
      {chars.map((ch, i) => {
        const col = grid === 1 ? 0 : 1 - Math.floor(i / grid); // top-right first
        const row = grid === 1 ? 0 : i % grid;
        return (
          <text
            key={i}
            x={col * cell + cell / 2}
            y={row * cell + cell / 2}
            fontSize={cell * 0.72}
            fontFamily={SEAL_FONT}
            fontWeight={700}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fdf6ec"
          >
            {ch}
          </text>
        );
      })}
    </g>
  );
}
