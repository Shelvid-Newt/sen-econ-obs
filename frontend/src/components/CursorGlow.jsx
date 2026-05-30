"use client";

import { useEffect, useRef } from "react";

// Soft gold spotlight that follows the pointer (Antigravity-style).
// Purely decorative; sits behind the hero content (pointer-events: none).
export default function CursorGlow() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      el.style.setProperty("--mx", `${e.clientX}px`);
      el.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return <div ref={ref} className="seo-cursor-glow" aria-hidden="true" />;
}
