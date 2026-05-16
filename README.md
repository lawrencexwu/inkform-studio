# 墨象 Inkform Studio

A web-based **Traditional Chinese calligraphy composition tool**. Enter
Traditional Chinese text, pick an artistic style, tune brush / ink / layout /
seal / paper, and export the result as **PNG, SVG or PDF** — entirely in the
browser. No backend, no login, no database.

> This is an artistic *visualizer*, not a historical calligraphy simulator.
> Style presets are **inspired by** broad aesthetic directions (modern
> expressive, classical readable cursive, hybrid poster) — not imitations of
> any living artist or historical master.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Production build: `npm run build && npm start`.

## Layout

- **Top bar** — app name, composition mode, style, randomize, reset, seed.
- **Left sidebar** — text input (title / body / signature / seal) and章法 layout controls.
- **Center** — live SVG artwork preview.
- **Right sidebar** — 筆觸 brush, 墨色 ink, 行草 cursive, 印章 seal, 紙張 paper, 匯出 export, presets.

## Where to change things

| Want to… | Edit |
| --- | --- |
| Add/tune a **style preset** | `lib/presets.ts` → `STYLE_PRESETS` (and `StyleKey` in `lib/compositionTypes.ts` for a brand-new style) |
| Change the **default sample composition** | `lib/presets.ts` → `DEFAULT_COMPOSITION` |
| Adjust **composition modes** (poster/scroll/editorial/brand) | `app/page.tsx` → `applyMode` |
| Change **glyph placement / column flow** | `lib/layoutEngine.ts` |
| Tune **brush / ink filter behaviour** | `lib/renderCalligraphy.tsx` |
| Change **export behaviour** | `lib/exportUtils.ts` |
| Add **canvas ratios** | `lib/compositionTypes.ts` → `CANVAS_RATIOS` |

## Architecture

```
app/            Next.js App Router shell + page (state owner)
components/      UI control panels (pure, declarative)
lib/
  compositionTypes.ts   Single source-of-truth state model
  presets.ts            Default composition + style presets
  layoutEngine.ts       State → absolute glyph positions
  renderCalligraphy.tsx State + layout → SVG (filters/masks)
  exportUtils.ts        PNG / SVG / PDF
  randomUtils.ts        Seeded jitter + randomize
  storage.ts            localStorage presets
```

Rendering logic (`layoutEngine`, `renderCalligraphy`) is deliberately kept
separate from UI controls. The layout engine emits absolute positions, sizes
and roles for every glyph; the renderer turns those into filtered SVG text.

## Stroke-level rendering

Characters are rendered from **real regular-script (楷書) stroke outlines**,
not a font:

1. `lib/strokeData.ts` loads each character's **real regular-script (楷書)
   stroke outlines** (the `strokes` field) from `hanzi-writer-data` (Make Me
   a Hanzi), served same-origin from `public/hanzi`
   (`scripts/copy-hanzi.mjs`, run automatically before `dev`/`build`;
   gitignored, regenerated from the npm dependency — works offline, no
   external network).
2. `lib/renderCalligraphy.tsx` places those correct stroke shapes using the
   layout engine's positions, applies gentle per-character variation, then
   gives them a calligraphic feel with ink-weight dilation and SVG texture
   filters (turbulence / displacement / bleed) plus a flying-white mask. The
   character shapes themselves stay accurate and legible.

Any character without stroke data (rare forms, punctuation) falls back to a
clean serif glyph, so **text is never corrupted**.

### Tuning / extending

- Texture & ink weight: the filter params at the top of the component in
  `lib/renderCalligraphy.tsx`.
- Add an AI-assisted or alternative engine: branch in `renderGlyph`
  (`lib/renderCalligraphy.tsx`) — it already receives each glyph's position,
  size, role and resolved stroke outlines.

## AI 潤色 / AI Render (experimental)

The right sidebar has an **AI 潤色 Render** panel that gives the artwork an
expressive 行草 brush-ink finish using the **free, keyless
[Pollinations.ai](https://pollinations.ai) image API** (model `flux`).
**No API key, no env var, no account.**

How it stays correct: Pollinations is essentially text-to-image and generic
models garble Chinese, so we never let it draw the characters. The pipeline
(`lib/aiRender.ts` + `app/api/ai-render/route.ts`):

1. Rasterises a hidden, transparent, glyph-only render (the exact correct
   strokes) as a silhouette.
2. Asks the server route (a proxy, to avoid canvas-tainting CORS) for an
   AI ink + rice-paper image.
3. Composites on a canvas so AI ink fills **only** the correct glyph shapes,
   over the AI paper.

Modes:

- **紋理 texture** (default, safe) — AI supplies ink/paper texture only;
  characters are masked to the correct shapes → **text is guaranteed
  correct**, just rendered in real AI ink with bleed/flying-white.
- **重塑 reshape** (experimental) — stronger 行草 prompt; still mask-
  constrained. Note: v1 is **not** true image-to-image glyph restructuring
  (keyless Pollinations can't accept our render without public hosting), so
  it's stronger ink expression within correct silhouettes, not new letterforms.

Honest limits: keyless generation is best-effort and slow (up to ~45s) and
occasionally unavailable; the AI result is **not** saved in presets or the
exported composition JSON; offline or on any failure the app cleanly falls
back to the vector renderer with no data loss. Export the AI image via the
panel's **匯出 AI PNG** button.
