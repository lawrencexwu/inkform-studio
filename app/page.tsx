"use client";

import { useCallback, useRef, useState } from "react";
import TopBar from "@/components/TopBar";
import SidebarLeft from "@/components/SidebarLeft";
import SidebarRight from "@/components/SidebarRight";
import ArtworkPreview from "@/components/ArtworkPreview";
import {
  DEFAULT_COMPOSITION,
  applyStyle,
} from "@/lib/presets";
import { randomizeVariation } from "@/lib/randomUtils";
import { exportPng, exportPdf, exportSvg } from "@/lib/exportUtils";
import { CANVAS_RATIOS, type CompositionState, type CompositionMode, type StyleKey } from "@/lib/compositionTypes";
import type {
  TextState,
  LayoutState,
  BrushState,
  SealState,
  PaperState,
} from "@/lib/compositionTypes";

// Mode mainly reshapes the *layout intent*; style controls brush aesthetics.
function applyMode(
  state: CompositionState,
  mode: CompositionMode
): CompositionState {
  const base = { ...state, mode };
  const L = base.layout;
  switch (mode) {
    case "poster":
      return {
        ...base,
        layout: {
          ...L,
          orientation: "vertical-rtl",
          titleEmphasis: 0.85,
          whitespaceIntensity: 0.68,
          bodySize: Math.min(L.bodySize, 0.42),
        },
      };
    case "scroll":
      return {
        ...base,
        layout: {
          ...L,
          orientation: "vertical-rtl",
          titleEmphasis: 0.55,
          whitespaceIntensity: 0.46,
          bodySize: 0.6,
        },
      };
    case "editorial":
      return {
        ...base,
        layout: {
          ...L,
          orientation: "horizontal-ltr",
          alignment: "start",
          titleEmphasis: 0.5,
          whitespaceIntensity: 0.4,
          bodySize: 0.5,
        },
      };
    case "brand":
      return {
        ...base,
        layout: {
          ...L,
          orientation: "horizontal-center",
          titleEmphasis: 1,
          whitespaceIntensity: 0.7,
          titleSize: Math.max(L.titleSize, 1.1),
        },
      };
  }
}

export default function Page() {
  const [state, setState] = useState<CompositionState>(DEFAULT_COMPOSITION);
  const [scale, setScale] = useState(DEFAULT_COMPOSITION.export.scale);
  const [busy, setBusy] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const patch = useCallback(
    <K extends keyof CompositionState>(
      key: K,
      partial: Partial<CompositionState[K]>
    ) =>
      setState((s) => ({
        ...s,
        [key]: { ...(s[key] as object), ...partial },
      })),
    []
  );

  const patchText = useCallback(
    (p: Partial<TextState>) =>
      setState((s) => ({
        ...s,
        text: { ...s.text, ...p },
        // Keep the seal's rendered text in sync with the text.seal field.
        seal:
          p.seal !== undefined ? { ...s.seal, text: p.seal } : s.seal,
      })),
    []
  );
  const patchLayout = useCallback(
    (p: Partial<LayoutState>) => patch("layout", p),
    [patch]
  );
  const patchBrush = useCallback(
    (p: Partial<BrushState>) => patch("brush", p),
    [patch]
  );
  const patchSeal = useCallback(
    (p: Partial<SealState>) => patch("seal", p),
    [patch]
  );
  const patchPaper = useCallback(
    (p: Partial<PaperState>) => patch("paper", p),
    [patch]
  );

  const setMode = (m: CompositionMode) =>
    setState((s) => applyMode(s, m));
  const setStyle = (st: StyleKey) => setState((s) => applyStyle(s, st));
  const onRandomize = () => setState((s) => randomizeVariation(s));
  const onReset = () => {
    setState(DEFAULT_COMPOSITION);
    setScale(DEFAULT_COMPOSITION.export.scale);
  };
  const applyPreset = (s: CompositionState) => {
    setState(s);
    setScale(s.export.scale);
  };

  const dims = CANVAS_RATIOS[state.layout.canvasRatio];

  const run = async (kind: string, fn: () => Promise<void> | void) => {
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      alert("匯出失敗 Export failed — 請重試。");
    } finally {
      setBusy(null);
    }
  };

  const onPng = () =>
    run("png", () =>
      exportPng(
        wrapRef.current!,
        dims.w,
        dims.h,
        scale,
        state.paper.transparent ? undefined : state.paper.backgroundColor
      )
    );
  const onSvg = () => run("svg", () => exportSvg(svgRef.current!));
  const onPdf = () =>
    run("pdf", () =>
      exportPdf(
        wrapRef.current!,
        dims.w,
        dims.h,
        state.paper.transparent ? "#ffffff" : state.paper.backgroundColor
      )
    );

  const editor = {
    state,
    patchText,
    patchLayout,
    patchBrush,
    patchSeal,
    patchPaper,
  };

  return (
    <div className="h-screen flex flex-col">
      <TopBar
        state={state}
        setMode={setMode}
        setStyle={setStyle}
        onRandomize={onRandomize}
        onReset={onReset}
      />
      <div className="flex-1 min-h-0 flex">
        <SidebarLeft {...editor} />
        <ArtworkPreview ref={wrapRef} svgRef={svgRef} state={state} />
        <SidebarRight
          {...editor}
          scale={scale}
          setScale={setScale}
          onPng={onPng}
          onSvg={onSvg}
          onPdf={onPdf}
          busy={busy}
          applyPreset={applyPreset}
        />
      </div>
    </div>
  );
}
