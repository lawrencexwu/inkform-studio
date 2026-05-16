import type {
  CompositionState,
  TextState,
  LayoutState,
  BrushState,
  SealState,
  PaperState,
} from "@/lib/compositionTypes";

// Shared prop shape passed to every control panel. Each patch* helper does an
// immutable shallow merge into its section so panels stay declarative.
export interface EditorProps {
  state: CompositionState;
  patchText: (p: Partial<TextState>) => void;
  patchLayout: (p: Partial<LayoutState>) => void;
  patchBrush: (p: Partial<BrushState>) => void;
  patchSeal: (p: Partial<SealState>) => void;
  patchPaper: (p: Partial<PaperState>) => void;
}
