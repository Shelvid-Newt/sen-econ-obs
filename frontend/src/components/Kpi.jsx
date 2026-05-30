"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import Sparkline from "./Sparkline.jsx";
import CountUp from "./CountUp.jsx";

export function KpiSparkCard({
  icon,
  label,
  value,
  unit,
  variation,
  series,
  theme,
  decimals = 0,
  periodLabel,
  fallbackNote,
  variationLabel = "M/M",
}) {
  const isDown = variation < 0;
  return (
    <div className="seo-kpi-card flex-1">
      <div className="flex justify-between items-start">
        <div className="font-display font-medium text-[9px] tracking-wider uppercase flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
          {icon} {label}
        </div>
        <span className="kpi-period">{periodLabel || "JANV. 26"}</span>
      </div>
      <div className="my-3">
        <div className="font-display font-bold text-2xl sm:text-3xl leading-none break-words">
          <CountUp value={value} decimals={decimals} />{" "}
          <span className="text-xs sm:text-sm font-normal" style={{ color: "var(--text-secondary)" }}>{unit}</span>
        </div>
        {variation !== undefined && (
          <div className="text-[10.5px] font-semibold mt-1.5 flex items-center gap-1" style={{ color: isDown ? "var(--data-negative)" : "var(--data-positive)" }}>
            {isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
            {variation > 0 ? "+" : ""}{variation.toFixed(1)}%{" "}
            <span className="text-[9px] font-normal" style={{ color: "var(--text-muted)" }}>{variationLabel}</span>
          </div>
        )}
      </div>
      <div className="min-h-[44px]">
        {series && series.length > 1 ? (
          <Sparkline data={series} theme={theme} animate height={44} />
        ) : (
          <div className="text-[9px] font-mono italic" style={{ color: "var(--text-muted)" }}>{fallbackNote || ""}</div>
        )}
      </div>
    </div>
  );
}

export function MicroKpi({ icon, label, value, unit, footnote }) {
  return (
    <div className="seo-card">
      <div className="flex items-center justify-between pb-2 mb-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="font-display font-medium text-[9px] tracking-wider uppercase flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
          {icon} {label}
        </div>
        <span className="font-mono text-[8px]" style={{ color: "var(--text-muted)" }}>JANV. 26</span>
      </div>
      <div className="font-display font-bold text-2xl leading-none">
        <CountUp value={value} /> <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>{unit}</span>
      </div>
      {footnote && <div className="text-[10px] mt-2 font-mono" style={{ color: "var(--text-muted)" }}>{footnote}</div>}
    </div>
  );
}
