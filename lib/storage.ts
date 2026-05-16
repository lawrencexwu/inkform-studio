// localStorage-backed preset save/load. No backend, no login.

import type { CompositionState } from "./compositionTypes";

const KEY = "inkform.presets.v1";

export interface SavedPreset {
  name: string;
  state: CompositionState;
  savedAt: number;
}

export function loadPresets(): SavedPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedPreset[]) : [];
  } catch {
    return [];
  }
}

export function savePreset(name: string, state: CompositionState): SavedPreset[] {
  const presets = loadPresets().filter((p) => p.name !== name);
  presets.push({ name, state, savedAt: Date.now() });
  window.localStorage.setItem(KEY, JSON.stringify(presets));
  return presets;
}

export function deletePreset(name: string): SavedPreset[] {
  const presets = loadPresets().filter((p) => p.name !== name);
  window.localStorage.setItem(KEY, JSON.stringify(presets));
  return presets;
}
