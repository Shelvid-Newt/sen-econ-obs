"use client";

import React from "react";
import CountUp from "./CountUp.jsx";

/** Compact KPI card (no sparkline). Optional colored variation line. */
export default function StatCard({ icon, label, value, unit, decimals = 0, sub, variation, variationLabel = "M/M", signed, highlight }) {
  const showVar = typeof variation === "number" && !Number.isNaN(variation);
  const down = variation < 0;
  return (
    <div className="seo-card" style={highlight ? { borderColor: "var(--accent-gold-dim)" } : undefined}>
      <div className="font-display font-medium text-[9px] tracking-wider uppercase flex items-center gap-1.5 mb-3" style={{ color: "var(--text-muted)" }}>
        {icon} {label}
      </div>
      <div className="font-display font-bold text-2xl sm:text-3xl leading-none break-words">
        {signed && value > 0 ? "+" : ""}
        <CountUp value={value} decimals={decimals} />{" "}
        <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>{unit}</span>
      </div>
      {showVar && (
        <div className="text-[10.5px] font-semibold mt-1.5 flex items-center gap-1" style={{ color: down ? "var(--data-negative)" : "var(--data-positive)" }}>
          {variation > 0 ? "+" : ""}{variation.toFixed(1)}% <span className="text-[9px] font-normal" style={{ color: "var(--text-muted)" }}>{variationLabel}</span>
        </div>
      )}
      {sub && <div className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}
