"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle, hydrated } = useTheme();
  // Avoid a hydration flash: reserve the space until the client knows the theme.
  if (!hydrated) return <span className={`seo-icon-btn ${className}`} style={{ visibility: "hidden" }} aria-hidden="true" />;
  return (
    <button
      type="button"
      onClick={toggle}
      className={`seo-icon-btn ${className}`}
      aria-label="Basculer le thème jour / nuit"
      title={theme === "dark" ? "Passer en mode clair" : "Passer en mode nuit"}
    >
      {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
}
