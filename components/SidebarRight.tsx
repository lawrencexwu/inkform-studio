"use client";

import BrushControls from "./BrushControls";
import SealControls from "./SealControls";
import ExportControls from "./ExportControls";
import type { EditorProps } from "./editorProps";
import type { CompositionState } from "@/lib/compositionTypes";

interface Props extends EditorProps {
  scale: number;
  setScale: (n: number) => void;
  onPng: () => void;
  onSvg: () => void;
  onPdf: () => void;
  busy: string | null;
  applyPreset: (s: CompositionState) => void;
}

export default function SidebarRight(props: Props) {
  return (
    <aside className="w-[300px] shrink-0 border-l border-ink-800 bg-ink-900 overflow-y-auto scroll-thin">
      <BrushControls {...props} />
      <SealControls {...props} />
      <ExportControls {...props} />
    </aside>
  );
}
