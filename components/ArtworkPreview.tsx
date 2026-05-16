"use client";

import { forwardRef } from "react";
import { CalligraphySvg } from "@/lib/renderCalligraphy";
import type { CompositionState } from "@/lib/compositionTypes";

interface Props {
  state: CompositionState;
  svgRef: React.Ref<SVGSVGElement>;
  maskRef: React.Ref<HTMLDivElement>;
  aiResult: string | null;
  showAi: boolean;
}

// The wrapper (not the raw SVG) is what html-to-image rasterises, so it carries
// the checkerboard-free transparent handling and centering.
const ArtworkPreview = forwardRef<HTMLDivElement, Props>(
  function ArtworkPreview({ state, svgRef, maskRef, aiResult, showAi }, ref) {
    const aiVisible = showAi && !!aiResult;
    // Glyph-only, transparent, no seal — rasterised as the AI silhouette mask.
    const maskState: CompositionState = {
      ...state,
      paper: { ...state.paper, transparent: true, textureEnabled: false },
      seal: { ...state.seal, enabled: false },
    };
    return (
      <div className="flex-1 min-w-0 flex items-center justify-center bg-ink-950 p-8 overflow-auto">
        <div
          className="relative shadow-2xl shadow-black/60 max-h-full max-w-full"
          style={{ width: "min(72vh, 100%)" }}
        >
          {/* Vector render — always mounted so SVG/PNG/PDF export keeps
              working even while the AI image is shown. */}
          <div
            ref={ref}
            className={`w-full ${
              aiVisible ? "invisible absolute inset-0" : ""
            }`}
          >
            <CalligraphySvg ref={svgRef} state={state} />
          </div>

          {/* AI result overlay (visible only when toggled on). */}
          {aiVisible && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={aiResult!}
              alt="AI calligraphy render"
              className="block w-full"
            />
          )}

          {/* Hidden glyph-only plate for AI masking (off-screen, not exported). */}
          <div
            ref={maskRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 w-full opacity-0"
            style={{ zIndex: -1 }}
          >
            <CalligraphySvg state={maskState} />
          </div>
        </div>
      </div>
    );
  }
);

export default ArtworkPreview;
