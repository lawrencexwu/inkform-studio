"use client";

import { useState, type ReactNode } from "react";

export function Panel({
  title,
  sub,
  children,
  defaultOpen = true,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-ink-800 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ink-850/60 transition"
      >
        <span className="text-[13px] font-medium tracking-wide text-ink-300">
          {title}
          {sub && <span className="ml-2 text-[11px] text-ink-500">{sub}</span>}
        </span>
        <span
          className={`text-ink-500 text-xs transition-transform ${
            open ? "rotate-90" : ""
          }`}
        >
          ▸
        </span>
      </button>
      {open && <div className="px-4 pb-5 pt-1 space-y-4">{children}</div>}
    </section>
  );
}

export function Select<T extends string>({
  label,
  sub,
  value,
  options,
  onChange,
}: {
  label: string;
  sub?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] text-ink-300 mb-1.5">
        {label}
        {sub && <span className="ml-1.5 text-[11px] text-ink-500">{sub}</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full bg-ink-800 border border-ink-700 rounded-md px-2.5 py-2 text-[13px] text-ink-200 focus:outline-none focus:border-ink-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextField({
  label,
  sub,
  value,
  onChange,
  multiline,
  rows = 4,
  placeholder,
}: {
  label: string;
  sub?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const cls =
    "w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-[14px] text-ink-100 font-cjk leading-relaxed focus:outline-none focus:border-ink-500 placeholder:text-ink-600";
  return (
    <label className="block">
      <span className="block text-[13px] text-ink-300 mb-1.5">
        {label}
        {sub && <span className="ml-1.5 text-[11px] text-ink-500">{sub}</span>}
      </span>
      {multiline ? (
        <textarea
          className={cls + " resize-y"}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={cls}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function Toggle({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between py-1.5"
    >
      <span className="text-[13px] text-ink-300">
        {label}
        {sub && <span className="ml-1.5 text-[11px] text-ink-500">{sub}</span>}
      </span>
      <span
        className={`w-9 h-5 rounded-full p-0.5 transition ${
          checked ? "bg-accent" : "bg-ink-700"
        }`}
      >
        <span
          className={`block w-4 h-4 rounded-full bg-rice transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
    </button>
  );
}
