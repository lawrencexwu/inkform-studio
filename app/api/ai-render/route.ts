// Server-side proxy for the free, keyless Pollinations.ai image API.
//
// Why a server route: calling Pollinations from the browser would taint the
// canvas (cross-origin) so we couldn't composite/mask the result. Proxying
// here returns a same-origin base64 data URL the client can safely read.
//
// No API key, no env var — Pollinations is keyless. Best-effort: keyless
// generation is slow and occasionally unavailable; failures return a clean
// JSON error and the client falls back to the vector renderer.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiMode = "texture" | "reshape";

interface AiRenderRequest {
  mode: AiMode;
  intensity: number;
  width: number;
  height: number;
  seed: number;
  styleHint?: string;
}

const MAX_SIDE = 1280;
const TIMEOUT_MS = 45_000;

function clampDims(w: number, h: number): { w: number; h: number } {
  const longest = Math.max(w, h);
  const k = longest > MAX_SIDE ? MAX_SIDE / longest : 1;
  return {
    w: Math.max(64, Math.round(w * k)),
    h: Math.max(64, Math.round(h * k)),
  };
}

function buildPrompt(
  mode: AiMode,
  intensity: number,
  styleHint?: string
): string {
  const energy =
    intensity > 0.66
      ? "wild expressive splashed-ink 潑墨, dramatic dry-brush sweeps, strong flying-white 飛白"
      : intensity > 0.33
      ? "expressive running-cursive 行草 brushwork, visible flying-white 飛白, ink bleed"
      : "calm refined ink wash, soft brush texture, gentle bleed";
  const shape =
    mode === "reshape"
      ? "bold gestural Chinese 行草 calligraphy character forms, single artwork"
      : "abstract Chinese ink-calligraphy brush texture and background, no specific characters";
  // Pollinations has no negative-prompt param, so constraints are phrased
  // positively/inline.
  return [
    "traditional Chinese ink calligraphy artwork",
    shape,
    energy,
    "deep pure black sumi ink on aged off-white xuan rice paper",
    "high contrast, monochrome black ink only, painterly, masterful brush",
    styleHint ? `mood: ${styleHint.replace(/_/g, " ")}` : "",
    "no latin letters, no watermark, no signature stamp, no border frame, no color",
  ]
    .filter(Boolean)
    .join(", ");
}

export async function POST(req: Request): Promise<Response> {
  let body: AiRenderRequest;
  try {
    body = (await req.json()) as AiRenderRequest;
  } catch {
    return Response.json(
      { ok: false, error: "無效的請求 Invalid request" },
      { status: 400 }
    );
  }

  if (
    (body.mode !== "texture" && body.mode !== "reshape") ||
    !Number.isFinite(body.width) ||
    !Number.isFinite(body.height)
  ) {
    return Response.json(
      { ok: false, error: "無效的參數 Invalid parameters" },
      { status: 400 }
    );
  }

  const { w, h } = clampDims(body.width, body.height);
  const intensity = Math.min(1, Math.max(0, body.intensity ?? 0.7));
  const seed = Math.abs(Math.floor(body.seed || 0)) % 1_000_000_000;
  const prompt = buildPrompt(body.mode, intensity, body.styleHint);

  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "image/jpeg,image/png,image/*" },
    });
    if (!res.ok) {
      return Response.json(
        { ok: false, error: "AI 服務回應錯誤 AI service error" },
        { status: 502 }
      );
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${type};base64,${buf.toString("base64")}`;
    return Response.json(
      { ok: true, dataUrl },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json(
      { ok: false, error: "AI 服務逾時或無法連線 AI timeout / unreachable" },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
