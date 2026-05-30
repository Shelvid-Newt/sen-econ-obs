"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Animated numeric counter that starts when scrolled into view and re-animates
 * whenever `value` changes (e.g. after async data loads from 0 → real value).
 * Props:
 *   - value: number — target value
 *   - decimals: number of decimal places (default 0)
 *   - duration: ms (default 1100)
 *   - className: passthrough
 *   - format: optional custom formatter (number) => string
 */
export default function CountUp({ value, decimals = 0, duration = 1100, className = "", format }) {
  const [display, setDisplay] = useState(0);
  const elRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef(0);
  const fromRef = useRef(0);

  // Become "visible" once scrolled into view (cards near the top fire immediately).
  useEffect(() => {
    if (!elRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.3 }
    );
    io.observe(elRef.current);
    return () => io.disconnect();
  }, []);

  // Animate from the previous value to the new value whenever value/visibility change.
  useEffect(() => {
    const to = +value || 0;
    if (!visible) return;
    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, visible, duration]);

  const formatter =
    format ||
    ((v) =>
      decimals > 0
        ? v.toFixed(decimals).replace(".", ",")
        : Math.round(v).toLocaleString("fr-FR"));

  return (
    <span ref={elRef} className={className}>
      {formatter(display)}
    </span>
  );
}
