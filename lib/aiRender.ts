// Client-side AI render pipeline.
//
// 1. Rasterise a transparent, glyph-only render of the current composition
//    (the "glyph plate" — opaque correct strokes on a transparent ground).
// 2. Ask /api/ai-render for an expressive ink/paper image (keyless Pollinations).
// 3. Composite on a canvas so the AI ink fills ONLY the exact correct glyph
//    shapes, over the AI paper. The character shapes therefore stay correct
//    regardless of what the generic AI model produces.

import { rasterize } from "@/lib/exportUtils";
import type { CompositionState } from "@/lib/compositionTypes";

export type AiMode = "texture" | "reshape";

export interface AiRenderParams {
  maskEl: HTMLElement; // hidden transparent glyph-only render wrapper
  width: number;
  height: number;
  scale: number;
  mode: AiMode;
  intensity: number;
  state: CompositionState;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("圖片載入失敗 image load failed"));
    img.src = src;
  });
}

export async function generateAiRender(p: AiRenderParams): Promise<string> {
  const aiScale = Math.min(p.scale, 2);
  const W = Math.round(p.width * aiScale);
  const H = Math.round(p.height * aiScale);

  // Glyph plate: transparent background, opaque dark correct strokes.
  const glyphPng = await rasterize(
    p.maskEl,
    p.width,
    p.height,
    aiScale,
    undefined
  );

  const res = await fetch("/api/ai-render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: p.mode,
      intensity: p.intensity,
      width: W,
      height: H,
      seed: p.state.seed,
      styleHint: p.state.style,
    }),
  });
  const json = (await res.json()) as
    | { ok: true; dataUrl: string }
    | { ok: false; error: string };
  if (!json.ok) throw new Error(json.error);

  const [aiImg, glyphImg] = await Promise.all([
    loadImage(json.dataUrl),
    loadImage(glyphPng),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 不支援 unsupported");

  // Layer A — AI paper / ambient ink fills the whole frame.
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(aiImg, 0, 0, W, H);

  // Layer B — AI ink clipped to the exact correct glyph silhouette.
  const mask = document.createElement("canvas");
  mask.width = W;
  mask.height = H;
  const mctx = mask.getContext("2d");
  if (!mctx) throw new Error("Canvas 不支援 unsupported");
  mctx.globalCompositeOperation = "source-over";
  mctx.drawImage(aiImg, 0, 0, W, H);
  mctx.globalCompositeOperation = "destination-in";
  mctx.drawImage(glyphImg, 0, 0, W, H); // keep ink only where glyph is opaque

  // Composite B over A.
  ctx.globalCompositeOperation = "source-over";
  if (p.mode === "texture") {
    // Legibility floor: original correct strokes always present, then the
    // AI-textured ink blended on top by intensity.
    ctx.globalAlpha = 1;
    ctx.drawImage(glyphImg, 0, 0, W, H);
    ctx.globalAlpha = Math.min(1, Math.max(0, p.intensity));
    ctx.drawImage(mask, 0, 0, W, H);
  } else {
    ctx.globalAlpha = 1;
    ctx.drawImage(mask, 0, 0, W, H);
  }
  ctx.globalAlpha = 1;

  return canvas.toDataURL("image/png");
}
