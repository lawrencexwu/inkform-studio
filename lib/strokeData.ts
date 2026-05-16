// Loads per-character REAL stroke outlines, served same-origin from
// /public/hanzi (see scripts/copy-hanzi.mjs). Source: hanzi-writer-data /
// Make Me a Hanzi — these are correctly-shaped regular-script (楷書) stroke
// paths drawn by font designers, not reconstructed skeletons.
//
// Characters without data (rare forms / punctuation) fall back to a clean
// serif glyph, so the text is always shown correctly.

export interface CharStrokes {
  // One filled SVG path `d` string per stroke, in the raw 1024 design grid.
  strokes: string[];
}

// Make Me a Hanzi design grid + the canonical "render upright" transform.
// A raw point (x, y) maps to local (k·(x-512), k·(512-y)) where k = cell/1024,
// which centres the glyph box on the origin.
export const GRID = 1024;
export const GRID_CENTER = 512;

const cache = new Map<string, CharStrokes | null>();
const inflight = new Map<string, Promise<CharStrokes | null>>();

export function getCachedStrokes(ch: string): CharStrokes | null | undefined {
  return cache.get(ch);
}

async function fetchChar(ch: string): Promise<CharStrokes | null> {
  try {
    const res = await fetch(`/hanzi/${encodeURIComponent(ch)}.json`);
    if (!res.ok) return null;
    const data = (await res.json()) as { strokes?: string[] };
    if (!data.strokes || !data.strokes.length) return null;
    return { strokes: data.strokes };
  } catch {
    return null;
  }
}

export async function loadStrokes(ch: string): Promise<CharStrokes | null> {
  if (cache.has(ch)) return cache.get(ch)!;
  if (inflight.has(ch)) return inflight.get(ch)!;
  // Only CJK ideographs have stroke data; skip punctuation/latin/spaces.
  if (!/\p{Script=Han}/u.test(ch)) {
    cache.set(ch, null);
    return null;
  }
  const p = fetchChar(ch).then((r) => {
    cache.set(ch, r);
    inflight.delete(ch);
    return r;
  });
  inflight.set(ch, p);
  return p;
}
