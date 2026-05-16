"use client";

import { Panel, Select, Toggle } from "./ui";
import ControlSlider from "./ControlSlider";
import type { AiMode } from "@/lib/aiRender";

interface Props {
  busy: string | null;
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

export default function AiRenderControls({
  busy,
  aiMode,
  setAiMode,
  aiIntensity,
  setAiIntensity,
  aiResult,
  showAi,
  setShowAi,
  onAiRender,
  onExportAiPng,
}: Props) {
  const btn =
    "flex-1 rounded-md py-2 text-[13px] font-medium transition disabled:opacity-40";
  return (
    <Panel title="AI 潤色" sub="AI Render" defaultOpen={false}>
      <Select
        label="模式"
        sub="Mode"
        value={aiMode}
        options={[
          { value: "texture", label: "紋理 (安全)" },
          { value: "reshape", label: "重塑 (實驗)" },
        ]}
        onChange={(v) => setAiMode(v as AiMode)}
      />
      {aiMode === "reshape" && (
        <p className="text-[11px] text-accent-soft">
          可能改變字形 / may distort character shapes
        </p>
      )}
      <ControlSlider
        label="強度"
        sub="Intensity"
        value={aiIntensity}
        onChange={setAiIntensity}
      />
      <button
        disabled={!!busy}
        onClick={onAiRender}
        className={`${btn} w-full bg-accent text-rice hover:bg-accent/90`}
      >
        {busy === "ai" ? "生成中…" : "AI 潤色 Render"}
      </button>
      <Toggle
        label="顯示 AI"
        sub="Show AI"
        checked={showAi && !!aiResult}
        onChange={(v) => aiResult && setShowAi(v)}
      />
      <button
        disabled={!!busy || !aiResult}
        onClick={onExportAiPng}
        className={`${btn} w-full bg-ink-700 text-ink-200 hover:bg-ink-600`}
      >
        {busy === "aipng" ? "…" : "匯出 AI PNG"}
      </button>
      <p className="text-[11px] text-ink-500 leading-relaxed">
        使用免費的 Pollinations.ai（無需金鑰）。生成較慢且為盡力而為；
        「紋理」模式以正確字形遮罩，確保文字不變形。離線或失敗時自動回退向量繪製。
      </p>
    </Panel>
  );
}
