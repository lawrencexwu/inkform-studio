"use client";

import { useEffect, useState } from "react";
import { Panel, Select, Toggle } from "./ui";
import ControlSlider from "./ControlSlider";
import type { EditorProps } from "./editorProps";
import {
  loadPresets,
  savePreset,
  deletePreset,
  type SavedPreset,
} from "@/lib/storage";
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

export default function ExportControls({
  state,
  patchPaper,
  scale,
  setScale,
  onPng,
  onSvg,
  onPdf,
  busy,
  applyPreset,
}: Props) {
  const p = state.paper;
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const btn =
    "flex-1 rounded-md py-2 text-[13px] font-medium transition disabled:opacity-40";

  return (
    <>
      <Panel title="紙張" sub="Paper">
        <label className="flex items-center justify-between">
          <span className="text-[13px] text-ink-300">
            背景色 <span className="text-[11px] text-ink-500">Background</span>
          </span>
          <input
            type="color"
            value={p.backgroundColor}
            onChange={(e) => patchPaper({ backgroundColor: e.target.value })}
            className="w-9 h-8 bg-transparent cursor-pointer rounded"
          />
        </label>
        <Toggle
          label="紙質紋理"
          sub="Texture"
          checked={p.textureEnabled}
          onChange={(v) => patchPaper({ textureEnabled: v })}
        />
        <ControlSlider
          label="紋理強度"
          sub="Intensity"
          value={p.textureIntensity}
          onChange={(v) => patchPaper({ textureIntensity: v })}
        />
        <Toggle
          label="透明背景"
          sub="Transparent"
          checked={p.transparent}
          onChange={(v) => patchPaper({ transparent: v })}
        />
        <Toggle
          label="外框"
          sub="Border"
          checked={p.border}
          onChange={(v) => patchPaper({ border: v })}
        />
      </Panel>

      <Panel title="匯出" sub="Export">
        <Select
          label="PNG 解析度"
          sub="Scale"
          value={String(scale)}
          options={[1, 2, 3, 4].map((n) => ({
            value: String(n),
            label: `${n}x`,
          }))}
          onChange={(v) => setScale(Number(v))}
        />
        <div className="flex gap-2 pt-1">
          <button
            disabled={!!busy}
            onClick={onPng}
            className={`${btn} bg-accent text-rice hover:bg-accent/90`}
          >
            {busy === "png" ? "…" : "PNG"}
          </button>
          <button
            disabled={!!busy}
            onClick={onSvg}
            className={`${btn} bg-ink-700 text-ink-200 hover:bg-ink-600`}
          >
            SVG
          </button>
          <button
            disabled={!!busy}
            onClick={onPdf}
            className={`${btn} bg-ink-700 text-ink-200 hover:bg-ink-600`}
          >
            {busy === "pdf" ? "…" : "PDF"}
          </button>
        </div>
      </Panel>

      <Panel title="預設組" sub="Presets" defaultOpen={false}>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="預設名稱"
            className="flex-1 bg-ink-800 border border-ink-700 rounded-md px-2.5 py-2 text-[13px] text-ink-100 focus:outline-none focus:border-ink-500"
          />
          <button
            disabled={!name.trim()}
            onClick={() => {
              setPresets(savePreset(name.trim(), state));
              setName("");
            }}
            className="rounded-md px-3 bg-ink-700 text-ink-200 text-[13px] hover:bg-ink-600 disabled:opacity-40"
          >
            儲存
          </button>
        </div>
        <div className="space-y-1.5">
          {presets.length === 0 && (
            <p className="text-[12px] text-ink-500">尚無已儲存的預設組。</p>
          )}
          {presets.map((pr) => (
            <div
              key={pr.name}
              className="flex items-center justify-between bg-ink-850 rounded-md px-3 py-2"
            >
              <button
                onClick={() => applyPreset(pr.state)}
                className="text-[13px] text-ink-200 hover:text-rice truncate"
              >
                {pr.name}
              </button>
              <button
                onClick={() => setPresets(deletePreset(pr.name))}
                className="text-[12px] text-ink-500 hover:text-accent ml-2"
              >
                刪除
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
