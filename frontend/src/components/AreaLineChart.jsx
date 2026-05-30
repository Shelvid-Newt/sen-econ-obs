"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

/**
 * Versatile time-series chart.
 *  - mode "stack": stacked areas (use for additive components, e.g. pêche = artisanale + industrielle)
 *  - mode "line":  overlaid lines with direct end-labels (use for non-additive series, e.g. ciment prod/ventes/export)
 *
 * props:
 *  data:   [{ date: "YYYY-MM-01", [key]: number, ... }]   (chronological)
 *  keys:   [{ key, label, color }]
 *  mode:   "stack" | "line"  (default "line")
 *  unit:   string suffix for tooltip values
 */
export default function AreaLineChart({ data, keys, mode = "line", theme = "dark", height = 300, unit = "" }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data || data.length < 2 || !keys?.length) return;
    d3.select(svgRef.current).selectAll("*").remove();

    const isNarrow = width < 480;
    const margin = { top: 10, right: mode === "line" ? (isNarrow ? 64 : 96) : 16, bottom: 26, left: isNarrow ? 34 : 44 };
    const chartW = Math.max(40, width - margin.left - margin.right);
    const chartH = height - margin.top - margin.bottom;

    const rows = data
      .map((d) => ({ ...d, _date: new Date(d.date) }))
      .filter((d) => !isNaN(d._date))
      .sort((a, b) => a._date - b._date);

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime().domain(d3.extent(rows, (d) => d._date)).range([0, chartW]);

    const axisColor = theme === "dark" ? "#8B8B9E" : "#6B6B7B";
    const gridColor = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";

    let yMax, yMin, stacked;
    if (mode === "stack") {
      stacked = d3.stack().keys(keys.map((k) => k.key))(rows);
      yMin = 0;
      yMax = d3.max(stacked[stacked.length - 1], (d) => d[1]) * 1.05;
    } else {
      const all = rows.flatMap((d) => keys.map((k) => +d[k.key]).filter((v) => !isNaN(v)));
      yMin = d3.min(all) * 0.95;
      yMax = d3.max(all) * 1.05;
    }
    const y = d3.scaleLinear().domain([yMin, yMax]).range([chartH, 0]);

    // grid + y axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(4).tickSize(-chartW).tickFormat(d3.format("~s")))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", gridColor).attr("stroke-width", 0.5))
      .call((g) => g.selectAll(".tick text").attr("fill", axisColor).attr("font-size", "10px").attr("font-family", "JetBrains Mono, monospace").attr("x", -6));

    // x axis
    svg.append("g")
      .attr("transform", `translate(0,${chartH})`)
      .call(d3.axisBottom(x).ticks(Math.max(3, Math.floor(chartW / 90))).tickFormat(d3.timeFormat("%b %y")))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick text").attr("fill", axisColor).attr("font-size", "9.5px").attr("font-family", "JetBrains Mono, monospace").attr("dy", 10));

    // draw-in clip
    const clipId = `clip-${Math.random().toString(36).slice(2)}`;
    const clipRect = svg.append("clipPath").attr("id", clipId).append("rect").attr("width", 0).attr("height", chartH).attr("y", 0);
    const plot = svg.append("g").attr("clip-path", `url(#${clipId})`);
    clipRect.transition().duration(1100).ease(d3.easeCubicInOut).attr("width", chartW);

    if (mode === "stack") {
      const area = d3.area().x((d) => x(d.data._date)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(d3.curveMonotoneX);
      stacked.forEach((layer, i) => {
        plot.append("path").datum(layer).attr("fill", keys[i].color).attr("fill-opacity", 0.85).attr("d", area);
      });
    } else {
      const endLabels = [];
      keys.forEach((k) => {
        const line = d3.line().x((d) => x(d._date)).y((d) => y(+d[k.key])).curve(d3.curveMonotoneX);
        plot.append("path").datum(rows).attr("fill", "none").attr("stroke", k.color).attr("stroke-width", 2).attr("d", line);
        const last = rows[rows.length - 1];
        svg.append("circle").attr("cx", x(last._date)).attr("cy", y(+last[k.key])).attr("r", 3).attr("fill", k.color);
        endLabels.push({ label: k.label, color: k.color, x: x(last._date), y: y(+last[k.key]) });
      });
      // anti-overlap nudge
      endLabels.sort((a, b) => a.y - b.y);
      const gap = 13;
      for (let i = 1; i < endLabels.length; i++) if (endLabels[i].y - endLabels[i - 1].y < gap) endLabels[i].y = endLabels[i - 1].y + gap;
      const overflow = endLabels.length ? endLabels[endLabels.length - 1].y - chartH : 0;
      if (overflow > 0) endLabels.forEach((l) => (l.y -= overflow));
      endLabels.forEach((l) => {
        svg.append("text").attr("x", l.x + 8).attr("y", l.y + 3).attr("fill", l.color)
          .attr("font-size", isNarrow ? "9px" : "10px").attr("font-family", "Inter, sans-serif").attr("font-weight", "500").text(l.label);
      });
    }

    // tooltip + crosshair
    const bisect = d3.bisector((d) => d._date).left;
    const focus = svg.append("line").attr("y1", 0).attr("y2", chartH).attr("stroke", theme === "dark" ? "rgba(212,168,67,0.3)" : "rgba(184,148,46,0.3)").attr("stroke-width", 1).attr("stroke-dasharray", "3,3").style("display", "none");
    const tip = d3.select(containerRef.current).append("div")
      .attr("class", "absolute pointer-events-none p-2.5 rounded-lg border text-[11px] shadow-md transition-opacity duration-150 opacity-0 z-50")
      .style("background", theme === "dark" ? "#12121A" : "#FFFFFF")
      .style("border-color", theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)")
      .style("color", theme === "dark" ? "#E8E8ED" : "#1A1A1F");

    svg.append("rect").attr("width", chartW).attr("height", chartH).attr("fill", "none").attr("pointer-events", "all")
      .on("mouseover", () => { focus.style("display", null); tip.style("opacity", 1); })
      .on("mouseout", () => { focus.style("display", "none"); tip.style("opacity", 0); })
      .on("mousemove", function (event) {
        const mx = d3.pointer(event)[0];
        const dt = x.invert(mx);
        const i = bisect(rows, dt, 1);
        const d = !rows[i] || dt - rows[i - 1]._date <= rows[i]._date - dt ? rows[i - 1] : rows[i];
        if (!d) return;
        focus.attr("x1", x(d._date)).attr("x2", x(d._date));
        let html = `<div class="font-semibold mb-1 font-display" style="color:var(--accent-gold)">${d3.timeFormat("%B %Y")(d._date)}</div>`;
        keys.forEach((k) => {
          html += `<div class="flex items-center justify-between gap-3 font-mono text-[10px]"><span style="color:${axisColor}"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${k.color};margin-right:5px"></span>${k.label}</span><span style="color:${k.color};font-weight:600">${Math.round(+d[k.key]).toLocaleString("fr-FR")}${unit ? " " + unit : ""}</span></div>`;
        });
        const xPos = event.offsetX > width - 180 ? event.offsetX - 170 : event.offsetX + 14;
        const yPos = Math.min(event.offsetY + 12, height - 80);
        tip.html(html).style("left", `${xPos}px`).style("top", `${yPos}px`);
      });

    return () => { tip.remove(); };
  }, [data, keys, mode, width, height, theme, unit]);

  return (
    <div ref={containerRef} className="relative w-full overflow-visible">
      <svg ref={svgRef} className="overflow-visible select-none" />
    </div>
  );
}
