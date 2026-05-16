"use client";

import { Panel, Select, Toggle, TextField } from "./ui";
import ControlSlider from "./ControlSlider";
import type { EditorProps } from "./editorProps";
import type { SealShape, SealPosition } from "@/lib/compositionTypes";

const SHAPES: { value: SealShape; label: string }[] = [
  { value: "square", label: "方章" },
  { value: "circle", label: "圓章" },
  { value: "oval", label: "橢圓章" },
];

const POSITIONS: { value: SealPosition; label: string }[] = [
  { value: "bottom-left", label: "左下" },
  { value: "bottom-right", label: "右下" },
  { value: "top-left", label: "左上" },
  { value: "top-right", label: "右上" },
  { value: "near-signature", label: "落款旁" },
];

export default function SealControls({
  state,
  patchSeal,
  patchText,
}: EditorProps) {
  const s = state.seal;
  return (
    <Panel title="印章" sub="Seal" defaultOpen={false}>
      <Toggle
        label="啟用印章"
        sub="Enable"
        checked={s.enabled}
        onChange={(v) => patchSeal({ enabled: v })}
      />
      <TextField
        label="印文"
        sub="Seal text"
        value={state.text.seal}
        onChange={(v) => patchText({ seal: v })}
      />
      <Select
        label="形狀"
        sub="Shape"
        value={s.shape}
        options={SHAPES}
        onChange={(v) => patchSeal({ shape: v })}
      />
      <Select
        label="位置"
        sub="Position"
        value={s.position}
        options={POSITIONS}
        onChange={(v) => patchSeal({ position: v })}
      />
      <ControlSlider
        label="不透明度"
        sub="Opacity"
        value={s.opacity}
        onChange={(v) => patchSeal({ opacity: v })}
      />
      <ControlSlider
        label="斑駁"
        sub="Roughness"
        value={s.roughness}
        onChange={(v) => patchSeal({ roughness: v })}
      />
      <ControlSlider
        label="尺寸"
        sub="Size"
        value={s.size}
        min={0.5}
        max={1.8}
        format={(v) => v.toFixed(2)}
        onChange={(v) => patchSeal({ size: v })}
      />
    </Panel>
  );
}
