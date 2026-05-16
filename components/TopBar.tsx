"use client";

import type { CompositionState, CompositionMode, StyleKey } from "@/lib/compositionTypes";
import { STYLE_PRESETS } from "@/lib/presets";

const MODES: { value: CompositionMode; label: string; sub: string }[] = [
  { value: "poster", label: "海報", sub: "Poster" },
  { value: "scroll", label: "卷軸", sub: "Scroll" },
  { value: "editorial", label: "篇章", sub: "Editorial" },
  { value: "brand", label: "標誌", sub: "Brand" },
];

interface Props {
  state: CompositionState;
  setMode: (m: CompositionMode) => void;
  setStyle: (s: StyleKey) => void;
  onRandomize: () => void;
  onReset: () => void;
}

export default function TopBar({
  state,
  setMode,
  setStyle,
  onRandomize,
  onReset,
}: Props) {
  return (
    <header className="h-14 shrink-0 flex items-center gap-6 px-5 border-b border-ink-800 bg-ink-900">
      <div className="flex items-baseline gap-2 select-none">
        <span className="font-cjk text-xl text-rice tracking-widest">墨象</span>
        <span className="text-[12px] text-ink-500 tracking-wide">
          Inkform Studio
        </span>
      </div>

      <div className="flex items-center gap-1 bg-ink-850 rounded-lg p-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`px-3 py-1.5 rounded-md text-[12px] transition ${
              state.mode === m.value
                ? "bg-ink-700 text-rice"
                : "text-ink-400 hover:text-ink-200"
            }`}
            title={m.sub}
          >
            {m.label}
          </button>
        ))}
      </div>

      <select
        value={state.style}
        onChange={(e) => setStyle(e.target.value as StyleKey)}
        className="bg-ink-850 border border-ink-700 rounded-lg px-3 py-1.5 text-[12px] text-ink-200 focus:outline-none focus:border-ink-500"
      >
        {(Object.keys(STYLE_PRESETS) as StyleKey[]).map((k) => (
          <option key={k} value={k}>
            {STYLE_PRESETS[k].label} · {STYLE_PRESETS[k].sub}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-[11px] text-ink-600 tabular-nums">
          seed {state.seed}
        </span>
        <button
          onClick={onRandomize}
          className="px-3 py-1.5 rounded-md text-[12px] bg-ink-700 text-ink-200 hover:bg-ink-600 transition"
        >
          隨機變化 Randomize
        </button>
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-md text-[12px] text-ink-400 hover:text-ink-200 transition"
        >
          重設 Reset
        </button>
      </div>
    </header>
  );
}
