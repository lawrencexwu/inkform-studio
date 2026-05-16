"use client";

interface Props {
  label: string;
  sub?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

export default function ControlSlider({
  label,
  sub,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  format,
  onChange,
}: Props) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[13px] text-ink-300">
          {label}
          {sub && (
            <span className="ml-1.5 text-[11px] text-ink-500">{sub}</span>
          )}
        </span>
        <span className="text-[11px] tabular-nums text-ink-400">
          {format ? format(value) : Math.round(value * 100)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}
