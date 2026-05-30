"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

/**
 * Donut chart for additive compositions.
 * props: data [{ label, value, color }], centerLabel, unit
 */
export default function Donut({ data, theme = "dark", height = 280, centerLabel = "Total", unit = "" }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => { for (const en of e) setWidth(en.contentRect.width); });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!ref.current || !data?.length) return;
    d3.select(ref.current).selectAll("*").remove();

    const total = d3.sum(data, (d) => d.value);
    const r = Math.min(width, height) / 2;
    const inner = r * 0.62;
    const txt = theme === "dark" ? "#E8E8ED" : "#1A1A1F";
    const muted = theme === "dark" ? "#8B8B9E" : "#6B6B7B";

    const svg = d3.select(ref.current).attr("width", width).attr("height", height)
      .append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value((d) => d.value).sort(null).padAngle(0.012);
    const arc = d3.arc().innerRadius(inner).outerRadius(r - 2).cornerRadius(2);
    const arcs = pie(data);

    svg.selectAll("path").data(arcs).enter().append("path")
      .attr("d", arc).attr("fill", (d) => d.data.color).attr("fill-opacity", 0.9)
      .append("title").text((d) => `${d.data.label} : ${Math.round(d.data.value).toLocaleString("fr-FR")} ${unit} (${((d.data.value / total) * 100).toFixed(1)}%)`);

    // % labels for slices ≥ 6%
    svg.selectAll("text.pct").data(arcs).enter().append("text").attr("class", "pct")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle").attr("dy", "0.35em")
      .attr("font-size", "10px").attr("font-family", "JetBrains Mono, monospace").attr("font-weight", "700")
      .attr("fill", theme === "dark" ? "#0A0A0F" : "#FFFFFF")
      .text((d) => (d.data.value / total >= 0.06 ? `${Math.round((d.data.value / total) * 100)}%` : ""));

    // center
    svg.append("text").attr("text-anchor", "middle").attr("dy", "-0.2em").attr("fill", txt)
      .attr("font-size", "22px").attr("font-family", "Space Grotesk, sans-serif").attr("font-weight", "700")
      .text(Math.round(total).toLocaleString("fr-FR"));
    svg.append("text").attr("text-anchor", "middle").attr("dy", "1.3em").attr("fill", muted)
      .attr("font-size", "9px").attr("font-family", "JetBrains Mono, monospace").attr("letter-spacing", "1px")
      .text(`${centerLabel}${unit ? " · " + unit : ""}`);
  }, [data, width, height, theme, centerLabel, unit]);

  return (
    <div ref={wrapRef} className="w-full flex flex-col items-center">
      <svg ref={ref} className="select-none" />
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
        {data?.map((d) => (
          <span key={d.label} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} /> {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
