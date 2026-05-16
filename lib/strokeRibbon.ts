// Turns a stroke centerline (median polyline) into a filled, variable-width
// "brush ribbon" path. This is the real stroke-level renderer: width is
// modulated along each stroke (entry/exit taper, belly, pressure, organic
// wobble) the way an actual brush loads and lifts — driven by brush params.
//
// All geometry is computed in a unit [0,1] cell; the caller scales/positions
// it to the glyph's box from the layout engine.

export interface RibbonParams {
  thickness: number; // 0..1 -> base ribbon width
  taper: number; // 0..1 -> entry/exit pointedness (起筆/收筆)
  pressure: number; // 0..1 -> width modulation along the stroke
  speed: number; // 0..1 -> belly bias (fast strokes = leaner)
  randomness: number; // 0..1 -> organic wobble
  seed: number;
  strokeIndex: number;
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// 1-D smooth value noise.
function noise(seed: number, x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash(seed * 0.013 + i);
  const b = hash(seed * 0.013 + i + 1);
  return (a + (b - a) * u) * 2 - 1; // -1..1
}

// Catmull-Rom resample so few-point medians become smooth centerlines.
function resample(
  pts: [number, number][],
  samples: number
): [number, number][] {
  if (pts.length < 2) return pts;
  if (pts.length === 2) {
    const out: [number, number][] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      out.push([
        pts[0][0] + (pts[1][0] - pts[0][0]) * t,
        pts[0][1] + (pts[1][1] - pts[0][1]) * t,
      ]);
    }
    return out;
  }
  const ext = [pts[0], ...pts, pts[pts.length - 1]];
  const out: [number, number][] = [];
  const segs = pts.length - 1;
  for (let s = 0; s < segs; s++) {
    const p0 = ext[s];
    const p1 = ext[s + 1];
    const p2 = ext[s + 2];
    const p3 = ext[s + 3];
    const steps = Math.max(2, Math.round(samples / segs));
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      out.push([x, y]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function buildRibbon(
  median: [number, number][],
  p: RibbonParams
): string {
  if (median.length < 2) return "";

  const c = resample(median, 26);
  const n = c.length;
  const sd = p.seed + p.strokeIndex * 97.13;

  // Base half-width as a fraction of the em cell.
  const base = 0.026 + p.thickness * 0.072;
  // How much each end tapers to a point.
  const edge = 0.1 + p.taper * 0.42;
  const minEnd = 0.5 - p.taper * 0.46;

  const ease = (x: number) => {
    const t = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  };

  const left: [number, number][] = [];
  const right: [number, number][] = [];

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);

    // Tangent via central difference.
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const nx = -ty;
    const ny = tx;

    // Width profile: end taper * belly * pressure * organic wobble.
    const taperShape =
      minEnd + (1 - minEnd) * ease(t / edge) * ease((1 - t) / edge);
    const belly = 1 + Math.sin(Math.PI * t) * (0.22 - p.speed * 0.16);
    const press = 1 + noise(sd, t * 3.2) * p.pressure * 0.5;
    const wob = 1 + noise(sd + 41, t * 6) * p.randomness * 0.16;
    let w = base * taperShape * belly * press * wob;
    w = Math.max(0.0015, w);

    // Subtle centerline drift for a hand-made feel.
    const drift = noise(sd + 17, t * 4) * p.randomness * base * 0.5;
    const cx = c[i][0] + nx * drift;
    const cy = c[i][1] + ny * drift;

    left.push([cx + nx * w, cy + ny * w]);
    right.push([cx - nx * w, cy - ny * w]);
  }

  const fmt = (pt: [number, number]) =>
    `${pt[0].toFixed(4)} ${pt[1].toFixed(4)}`;

  let d = `M ${fmt(left[0])}`;
  for (let i = 1; i < n; i++) d += ` L ${fmt(left[i])}`;
  for (let i = n - 1; i >= 0; i--) d += ` L ${fmt(right[i])}`;
  d += " Z";
  return d;
}
