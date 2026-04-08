"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemePreset =
  | "glass-ocean"
  | "warm-paper"
  | "midnight-neon"
  | "forest-signal"
  | "minimal-mono";

export interface ThemePresetDefinition {
  id: ThemePreset;
  name: string;
  description: string;
  mode: "light" | "dark";
  preview: {
    background: string;
    panel: string;
    accent: string;
    text: string;
  };
}

export const THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: "glass-ocean",
    name: "Glass Ocean",
    description: "Cool glassmorphism with airy blue depth.",
    mode: "dark",
    preview: {
      background: "linear-gradient(135deg, #08111f 0%, #12356b 100%)",
      panel: "rgba(15, 23, 42, 0.78)",
      accent: "#3b82f6",
      text: "#e2e8f0",
    },
  },
  {
    id: "warm-paper",
    name: "Warm Paper",
    description: "Editorial light theme with cream surfaces and soft ink.",
    mode: "light",
    preview: {
      background: "linear-gradient(135deg, #fffaf0 0%, #f6ecdb 100%)",
      panel: "rgba(255, 252, 245, 0.92)",
      accent: "#c26d2c",
      text: "#2a2118",
    },
  },
  {
    id: "midnight-neon",
    name: "Midnight Neon",
    description: "Cinematic dark UI with electric highlights.",
    mode: "dark",
    preview: {
      background: "linear-gradient(135deg, #050816 0%, #22094f 100%)",
      panel: "rgba(17, 8, 34, 0.88)",
      accent: "#22d3ee",
      text: "#f5f3ff",
    },
  },
  {
    id: "forest-signal",
    name: "Forest Signal",
    description: "Balanced green and teal tones built for long sessions.",
    mode: "dark",
    preview: {
      background: "linear-gradient(135deg, #071713 0%, #0d3b33 100%)",
      panel: "rgba(11, 28, 24, 0.86)",
      accent: "#14b8a6",
      text: "#e6fffa",
    },
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    description: "Strict black, white, and gray product-style UI.",
    mode: "light",
    preview: {
      background: "linear-gradient(135deg, #f7f7f7 0%, #dfdfdf 100%)",
      panel: "rgba(255, 255, 255, 0.92)",
      accent: "#171717",
      text: "#111111",
    },
  },
];

interface ThemeContextType {
  theme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemePreset>("glass-ocean");

  const applyTheme = (nextTheme: ThemePreset) => {
    const preset = THEME_PRESETS.find((item) => item.id === nextTheme);
    if (!preset) return;

    document.documentElement.dataset.themePreset = nextTheme;
    document.documentElement.dataset.themeMode = preset.mode;
  };

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(
      "chat-theme-preset"
    ) as ThemePreset | null;
    const nextTheme = storedTheme || "glass-ocean";

    setThemeState(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const setTheme = (nextTheme: ThemePreset) => {
    setThemeState(nextTheme);
    window.localStorage.setItem("chat-theme-preset", nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
};
