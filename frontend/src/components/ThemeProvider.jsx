"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext({ theme: "dark", toggle: () => {}, hydrated: false });

export function useTheme() {
  return useContext(ThemeCtx);
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [hydrated, setHydrated] = useState(false);

  // The inline bootstrap in layout.js applies `.light` before paint; read it back.
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
    setHydrated(true);
  }, []);

  const toggle = () => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      if (next === "light") document.documentElement.classList.add("light");
      else document.documentElement.classList.remove("light");
      try {
        localStorage.setItem("seo-theme", next);
      } catch {}
      return next;
    });
  };

  return <ThemeCtx.Provider value={{ theme, toggle, hydrated }}>{children}</ThemeCtx.Provider>;
}
