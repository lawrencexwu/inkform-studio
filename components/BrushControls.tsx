"use client";

import { Panel } from "./ui";
import ControlSlider from "./ControlSlider";
import type { EditorProps } from "./editorProps";

export default function BrushControls({ state, patchBrush }: EditorProps) {
  const b = state.brush;
  const slider = (
    label: string,
    sub: string,
    key: keyof typeof b
  ) => (
    <ControlSlider
      label={label}
      sub={sub}
      value={b[key]}
      onChange={(v) => patchBrush({ [key]: v } as never)}
    />
  );

  return (
    <>
      <Panel title="筆觸" sub="Brush">
        {slider("筆畫粗細", "Thickness", "thickness")}
        {slider("壓力變化", "Pressure", "pressureVariation")}
        {slider("運筆速度", "Stroke speed", "strokeSpeed")}
        {slider("收筆", "Taper", "strokeTaper")}
        {slider("隨機性", "Randomness", "randomness")}
        {slider("邊緣粗糙", "Edge roughness", "edgeRoughness")}
      </Panel>
      <Panel title="墨色" sub="Ink">
        {slider("墨濃", "Ink density", "inkDensity")}
        {slider("枯筆", "Dryness", "dryness")}
        {slider("飛白", "Flying white", "flyingWhite")}
        {slider("暈染", "Bleed", "bleed")}
      </Panel>
      <Panel title="行草" sub="Cursive" defaultOpen={false}>
        {slider("草書程度", "Cursive level", "cursiveLevel")}
        {slider("可讀性", "Readability", "readability")}
        {slider("連筆強度", "Connection", "connectionStrength")}
      </Panel>
    </>
  );
}
