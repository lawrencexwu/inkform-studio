// SVG calligraphy renderer.
//
// Stroke-level engine: each character's centerline (median) data is turned
// into variable-width brush ribbons (strokeRibbon.ts) — real per-stroke
// width modulation (entry/exit taper, belly, pressure, organic wobble)
// driven by the brush params, then textured with SVG filters (turbulence /
// displacement / bleed) and flying-white masking.
//
// Characters with no stroke data (rare Traditional forms / punctuation)
// gracefully fall back to a brush webfont glyph so text is never corrupted.

import { forwardRef, useEffect, useMemo, useState } from "react";
import type { CompositionState } from "./compositionTypes";
import { layoutComposition, type PlacedGlyph } from "./layoutEngine";
import { jitter } from "./randomUtils";
import {
  loadStrokes,
  getCachedStrokes,
  normalizePoint,
  type CharStrokes,
} from "./strokeData";
import { buildRibbon } from "./strokeRibbon";

// Async-loads median data for every unique character on screen and re-renders
// as it arrives. Until a glyph's data is ready it falls back to the webfont.
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

// Bold brush face first; Traditional-coverage serif as per-glyph fallback so
// the text is never corrupted. Used for the artwork glyphs.
const BRUSH_FONT =
  '"Ma Shan Zheng","Noto Serif TC","Songti TC","Source Han Serif TC","PMingLiU",serif';
// Seals stay carved-square, so they keep the serif face.
const SEAL_FONT =
  '"Noto Serif TC","Songti TC","Source Han Serif TC","PMingLiU",serif';

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
    const distortFreq = (0.012 + b.edgeRoughness * 0.05).toFixed(4);
    const distortScale = (b.edgeRoughness * 9 + b.randomness * 5).toFixed(2);
    const bleedBlur = (b.bleed * 1.6 + b.dryness * 0.3).toFixed(2);
    // Ribbons already carry brush mass, so the dilation only adds a little
    // ink spread (it also fattens any fallback-font glyphs).
    const dilate = (0.2 + b.thickness * 1.0 + b.inkDensity * 0.5).toFixed(2);

    // Flying white: streaky alpha knockout, capped so text stays readable.
    const fwAmount = b.flyingWhite * (0.85 - b.readability * 0.35);
    const fwSlope = (3 + b.dryness * 4).toFixed(2);
    const fwIntercept = (-(1 - fwAmount) * 0.9).toFixed(3);

    const inkAlpha = 0.55 + b.inkDensity * 0.45 - b.dryness * 0.18;
    const showEcho = b.edgeRoughness > 0.35 || b.inkDensity > 0.7;

    const skew = b.cursiveLevel * 9 * (1 - b.readability * 0.4);
    const jitterAmt = b.randomness * (1 - b.readability * 0.45);

    const renderGlyph = (g: PlacedGlyph, layer: "main" | "echo") => {
      const rot =
        jitter(seed, g.index, 1) *
        (g.role === "title" ? 3.2 : 5.5) *
        jitterAmt;
      // Signature trait of bold expressive calligraphy (董陽孜-inspired):
      // wild per-character scale contrast. Driven by pressure variation,
      // tamed by readability so the text stays legible.
      const drama = b.pressureVariation * (1 - b.readability * 0.45);
      const scaleVar =
        1 +
        jitter(seed, g.index, 7) *
          (g.role === "title" ? 0.52 : 0.26) *
          drama;
      const sx =
        (1 + jitter(seed, g.index, 2) * 0.06 * jitterAmt) * scaleVar;
      const sy =
        (1 + jitter(seed, g.index, 3) * 0.08 * jitterAmt) * scaleVar;
      const dx = jitter(seed, g.index, 4) * g.size * 0.05 * jitterAmt;
      const dy = jitter(seed, g.index, 5) * g.size * 0.05 * jitterAmt;
      const op =
        (0.82 + Math.abs(jitter(seed, g.index, 6)) * 0.18) *
        (layer === "echo" ? 0.38 : 1);
      const sk = g.role === "signature" ? skew * 0.5 : skew;
      const echoShift = layer === "echo" ? b.edgeRoughness * 1.6 : 0;

      // Per-glyph placement transform shared by ribbon and fallback paths.
      const place =
        `translate(${(g.x + dx + echoShift).toFixed(2)},${(
          g.y +
          dy +
          echoShift
        ).toFixed(2)}) ` +
        `rotate(${rot.toFixed(2)}) skewX(${(-sk).toFixed(2)}) ` +
        `scale(${sx.toFixed(3)},${sy.toFixed(3)})`;

      const data = strokeMap.get(g.char);

      // --- Real stroke-ribbon rendering ---
      if (data && data.medians.length) {
        // Ribbons carry their own mass; the echo pass would just double it.
        if (layer === "echo") return null;
        const cell = g.size * 1.06;
        const rndm = b.randomness * (1 - b.readability * 0.35) + 0.05;
        const d = data.medians
          .map((m, si) =>
            buildRibbon(
              m.map(([x, y]) => normalizePoint(x, y)),
              {
                thickness: b.thickness * 0.85 + b.inkDensity * 0.15,
                taper: b.strokeTaper,
                pressure: b.pressureVariation,
                speed: b.strokeSpeed,
                randomness: rndm,
                seed: seed + g.index * 31,
                strokeIndex: si,
              }
            )
          )
          .filter(Boolean)
          .join(" ");
        return (
          <path
            key={`r-${g.index}`}
            d={d}
            fill="#080605"
            fillRule="nonzero"
            opacity={op}
            transform={`${place} translate(${(-cell / 2).toFixed(2)},${(
              -cell / 2
            ).toFixed(2)}) scale(${cell.toFixed(2)})`}
          />
        );
      }

      // --- Fallback: brush webfont glyph (keeps text correct) ---
      const strokeW =
        layer === "echo"
          ? 0
          : g.size *
            (0.02 + b.thickness * 0.11) *
            (1 - b.flyingWhite * 0.25);

      return (
        <text
          key={`${layer}-${g.index}`}
          x={0}
          y={0}
          fontSize={g.size}
          fontFamily={BRUSH_FONT}
          fontWeight={g.role === "title" ? 900 : 700}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#080605"
          stroke={strokeW > 0 ? "#080605" : undefined}
          strokeWidth={strokeW || undefined}
          strokeLinejoin="round"
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
          {showEcho &&
            layout.glyphs.map((g) => renderGlyph(g, "echo"))}
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
