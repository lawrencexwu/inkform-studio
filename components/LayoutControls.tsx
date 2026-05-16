"use client";

import { Panel, Select } from "./ui";
import ControlSlider from "./ControlSlider";
import type { EditorProps } from "./editorProps";
import type {
  CanvasRatio,
  Orientation,
  Alignment,
} from "@/lib/compositionTypes";

const RATIOS: { value: CanvasRatio; label: string }[] = [
  { value: "1:1", label: "1:1 方形" },
  { value: "4:5", label: "4:5 直幅" },
  { value: "3:4", label: "3:4 直幅" },
  { value: "9:16", label: "9:16 直幅" },
  { value: "16:9", label: "16:9 橫幅" },
  { value: "a4-portrait", label: "A4 直" },
  { value: "a4-landscape", label: "A4 橫" },
];

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: "vertical-rtl", label: "直書・由右至左" },
  { value: "vertical-ltr", label: "直書・由左至右" },
  { value: "horizontal-ltr", label: "橫書・由左至右" },
  { value: "horizontal-center", label: "橫書・置中" },
];

const ALIGN: { value: Alignment; label: string }[] = [
  { value: "start", label: "起始" },
  { value: "center", label: "置中" },
  { value: "end", label: "末端" },
];

export default function LayoutControls({ state, patchLayout }: EditorProps) {
  const L = state.layout;
  return (
    <Panel title="章法" sub="Layout">
      <Select
        label="畫布比例"
        sub="Canvas"
        value={L.canvasRatio}
        options={RATIOS}
        onChange={(v) => patchLayout({ canvasRatio: v })}
      />
      <Select
        label="行文方向"
        sub="Orientation"
        value={L.orientation}
        options={ORIENTATIONS}
        onChange={(v) => patchLayout({ orientation: v })}
      />
      <Select
        label="對齊"
        sub="Align"
        value={L.alignment}
        options={ALIGN}
        onChange={(v) => patchLayout({ alignment: v })}
      />
      <ControlSlider
        label="邊距"
        sub="Margin"
        value={L.margin}
        min={0.02}
        max={0.28}
        onChange={(v) => patchLayout({ margin: v })}
      />
      <ControlSlider
        label="字距"
        sub="Char spacing"
        value={L.characterSpacing}
        min={0}
        max={0.7}
        onChange={(v) => patchLayout({ characterSpacing: v })}
      />
      <ControlSlider
        label="行距"
        sub="Line spacing"
        value={L.lineSpacing}
        min={0}
        max={0.9}
        onChange={(v) => patchLayout({ lineSpacing: v })}
      />
      <ControlSlider
        label="標題大小"
        sub="Title size"
        value={L.titleSize}
        min={0.4}
        max={1.8}
        format={(v) => v.toFixed(2)}
        onChange={(v) => patchLayout({ titleSize: v })}
      />
      <ControlSlider
        label="正文大小"
        sub="Body size"
        value={L.bodySize}
        min={0.2}
        max={1}
        format={(v) => v.toFixed(2)}
        onChange={(v) => patchLayout({ bodySize: v })}
      />
      <ControlSlider
        label="落款大小"
        sub="Signature size"
        value={L.signatureSize}
        min={0.15}
        max={0.8}
        format={(v) => v.toFixed(2)}
        onChange={(v) => patchLayout({ signatureSize: v })}
      />
      <ControlSlider
        label="標題強調"
        sub="Title emphasis"
        value={L.titleEmphasis}
        onChange={(v) => patchLayout({ titleEmphasis: v })}
      />
      <ControlSlider
        label="留白強度"
        sub="Whitespace"
        value={L.whitespaceIntensity}
        onChange={(v) => patchLayout({ whitespaceIntensity: v })}
      />
    </Panel>
  );
}
