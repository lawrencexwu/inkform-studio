"use client";

import BrushControls from "./BrushControls";
import SealControls from "./SealControls";
import ExportControls from "./ExportControls";
import AiRenderControls from "./AiRenderControls";
import type { EditorProps } from "./editorProps";
import type { CompositionState } from "@/lib/compositionTypes";
import type { AiMode } from "@/lib/aiRender";

interface Props extends EditorProps {
  scale: number;
  setScale: (n: number) => void;
  onPng: () => void;
  onSvg: () => void;
  onPdf: () => void;
  busy: string | null;
  applyPreset: (s: CompositionState) => void;
  aiMode: AiMode;
  setAiMode: (m: AiMode) => void;
  aiIntensity: number;
  setAiIntensity: (n: number) => void;
  aiResult: string | null;
  showAi: boolean;
  setShowAi: (v: boolean) => void;
  onAiRender: () => void;
  onExportAiPng: () => void;
}

export default function SidebarRight(props: Props) {
  return (
    <aside className="w-[300px] shrink-0 border-l border-ink-800 bg-ink-900 overflow-y-auto scroll-thin">
      <BrushControls {...props} />
      <SealControls {...props} />
      <ExportControls {...props} />
      <AiRenderControls {...props} />
    </aside>
  );
}
