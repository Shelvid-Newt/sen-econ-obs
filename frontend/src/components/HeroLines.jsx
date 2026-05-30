"use client";

import { useEffect, useRef } from "react";

/**
 * Generative art background — flowing lines that evoke economic time-series
 * without showing any data. Pure aesthetic, permanently animated.
 *
 * Each "strand" is a smooth bezier ribbon that drifts across the viewport,
 * oscillating vertically with layered sine waves. The palette uses the
 * observatory gold + muted accent tones at very low opacity to stay behind
 * hero text without competing.
 */

const STRAND_COUNT = 7;
const BASE_SPEED = 0.0003; // radians per frame — slow, contemplative

// Each strand gets unique parameters generated once on mount
function createStrand(i, total, h) {
  const t = i / total;
  return {
    // vertical center as fraction of canvas height
    yCenter: 0.18 + t * 0.64,
    // amplitude of primary wave (px)
    amp1: 28 + Math.random() * 50,
    // amplitude of secondary modulation
    amp2: 10 + Math.random() * 25,
    // frequency multipliers
    freq1: 1.2 + Math.random() * 0.8,
    freq2: 2.4 + Math.random() * 1.6,
    // phase offsets so strands don't sync
    phase1: Math.random() * Math.PI * 2,
    phase2: Math.random() * Math.PI * 2,
    // speed variation (some strands drift faster)
    speed: BASE_SPEED * (0.7 + Math.random() * 0.6),
    // visual
    opacity: 0.07 + Math.random() * 0.10,
    width: 1 + Math.random() * 1.5,
    // hue shift: gold core (42°) ± subtle variation
    hue: 42 + (Math.random() - 0.5) * 16,
    sat: 55 + Math.random() * 30,
    light: 55 + Math.random() * 15,
  };
}

export default function HeroLines() {
  const canvasRef = useRef(null);
  const strandsRef = useRef(null);
  const frameRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w, h, dpr;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.parentElement.clientWidth;
      h = canvas.parentElement.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // (re)create strands on resize so amplitudes scale
      strandsRef.current = Array.from({ length: STRAND_COUNT }, (_, i) =>
        createStrand(i, STRAND_COUNT, h)
      );
    };

    resize();
    window.addEventListener("resize", resize);

    // ── render loop ──
    const SEGMENTS = 120; // bezier resolution

    const draw = () => {
      frameRef.current++;
      const t = frameRef.current;

      ctx.clearRect(0, 0, w, h);

      const isLight = document.documentElement.classList.contains("light");

      for (const s of strandsRef.current) {
        const phase = t * s.speed;
        ctx.beginPath();

        for (let i = 0; i <= SEGMENTS; i++) {
          const frac = i / SEGMENTS;
          const x = frac * w;

          // layered sine oscillation
          const y1 = Math.sin(frac * Math.PI * s.freq1 * 2 + s.phase1 + phase) * s.amp1;
          const y2 = Math.sin(frac * Math.PI * s.freq2 * 2 + s.phase2 + phase * 1.7) * s.amp2;
          // slow vertical drift
          const drift = Math.sin(phase * 0.4 + s.phase1) * 18;
          const y = s.yCenter * h + y1 + y2 + drift;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // fade line at the edges (horizontal gradient stroke)
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        const baseColor = isLight
          ? `hsla(${s.hue}, ${s.sat * 0.7}%, ${s.light * 0.6}%, `
          : `hsla(${s.hue}, ${s.sat}%, ${s.light}%, `;
        grad.addColorStop(0, baseColor + "0)");
        grad.addColorStop(0.12, baseColor + s.opacity + ")");
        grad.addColorStop(0.5, baseColor + s.opacity * 1.3 + ")");
        grad.addColorStop(0.88, baseColor + s.opacity + ")");
        grad.addColorStop(1, baseColor + "0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="seo-hero-lines"
    />
  );
}
