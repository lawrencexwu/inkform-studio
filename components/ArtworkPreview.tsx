"use client";

import { forwardRef } from "react";
import { CalligraphySvg } from "@/lib/renderCalligraphy";
import type { CompositionState } from "@/lib/compositionTypes";

interface Props {
  state: CompositionState;
  svgRef: React.Ref<SVGSVGElement>;
}

// The wrapper (not the raw SVG) is what html-to-image rasterises, so it carries
// the checkerboard-free transparent handling and centering.
const ArtworkPreview = forwardRef<HTMLDivElement, Props>(
  function ArtworkPreview({ state, svgRef }, ref) {
    return (
      <div className="flex-1 min-w-0 flex items-center justify-center bg-ink-950 p-8 overflow-auto">
        <div
          className="relative shadow-2xl shadow-black/60 max-h-full max-w-full"
          style={{
            width: "min(72vh, 100%)",
          }}
        >
          <div ref={ref} className="w-full">
            <CalligraphySvg ref={svgRef} state={state} />
          </div>
        </div>
      </div>
    );
  }
);

export default ArtworkPreview;
