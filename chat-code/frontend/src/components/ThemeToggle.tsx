"use client";

import { THEME_PRESETS, useTheme } from "@/context/ThemeContext";
import { Palette } from "lucide-react";
import { useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-5 top-5 z-50 flex max-w-[22rem] flex-col items-end gap-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="theme-card inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition hover:scale-[1.02]"
        aria-label="Toggle theme picker"
      >
        <Palette className="h-4 w-4" />
        Themes
      </button>

      {open && (
        <div className="theme-panel-strong w-full rounded-3xl p-3">
          <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.24em] theme-muted">
            Presets
          </div>
          <div className="grid gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTheme(preset.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  theme === preset.id
                    ? "border-[var(--brand)] bg-[var(--surface-muted)]"
                    : ""
                }`}
                style={{
                  borderColor:
                    theme === preset.id ? "var(--brand)" : "var(--border)",
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="h-10 flex-1 rounded-xl"
                    style={{ background: preset.preview.background }}
                  >
                    <div className="flex h-full items-center gap-2 px-3">
                      <div
                        className="h-5 w-5 rounded-full"
                        style={{ background: preset.preview.accent }}
                      />
                      <div
                        className="h-5 flex-1 rounded-lg"
                        style={{ background: preset.preview.panel }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{preset.name}</div>
                    <div className="mt-1 text-xs theme-muted">
                      {preset.description}
                    </div>
                  </div>
                  {theme === preset.id && (
                    <span className="theme-brand rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                      Live
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
