// Loads per-character median (centerline) data, served same-origin from
// /public/hanzi (see scripts/copy-hanzi.mjs). Source: hanzi-writer-data /
// Make Me a Hanzi. Characters without data fall back to font rendering, so
// the text is always shown correctly.

export interface CharStrokes {
  // One polyline of [x, y] points per stroke, in the raw 1024 grid.
  medians: [number, number][][];
}

const GRID = 1024;

const cache = new Map<string, CharStrokes | null>();
const inflight = new Map<string, Promise<CharStrokes | null>>();

export function getCachedStrokes(ch: string): CharStrokes | null | undefined {
  return cache.get(ch);
}

async function fetchChar(ch: string): Promise<CharStrokes | null> {
  try {
    const res = await fetch(`/hanzi/${encodeURIComponent(ch)}.json`);
    if (!res.ok) return null;
    const data = (await res.json()) as { medians?: [number, number][][] };
    if (!data.medians || !data.medians.length) return null;
    return { medians: data.medians };
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

// Map a raw grid point into a unit cell, flipping the Y axis (data origin is
// bottom-left, screen is top-left).
export function normalizePoint(
  x: number,
  y: number
): [number, number] {
  return [x / GRID, (GRID - y) / GRID];
}
