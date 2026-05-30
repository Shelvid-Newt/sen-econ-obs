"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";

/**
 * Trade-flow Sankey: imports → hub → exports.
 * props:
 *   imports: [{ label, value }]  (left)
 *   exports: [{ label, value }]  (right)
 *   hubLabel: center node name
 *   unit: value suffix
 */
export default function Sankey({ imports = [], exports = [], hubLabel = "Sénégal", theme = "dark", height = 360, unit = "kt" }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((e) => { for (const en of e) setWidth(en.contentRect.width); });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || width < 60) return;
    d3.select(svgRef.current).selectAll("*").remove();

    const imp = imports.filter((d) => d.value > 0);
    const exp = exports.filter((d) => d.value > 0);
    if (!imp.length && !exp.length) return;

    const isNarrow = width < 560;
    const m = { top: 14, right: isNarrow ? 90 : 130, bottom: 14, left: isNarrow ? 96 : 140 };

    const names = [...imp.map((d) => d.label), hubLabel, ...exp.map((d) => d.label)];
    const idx = Object.fromEntries(names.map((n, i) => [n, i]));
    const nodes = names.map((name) => ({ name }));
    const links = [
      ...imp.map((d) => ({ source: idx[d.label], target: idx[hubLabel], value: d.value, kind: "import" })),
      ...exp.map((d) => ({ source: idx[hubLabel], target: idx[d.label], value: d.value, kind: "export" })),
    ];

    const impColor = theme === "dark" ? "#E67E73" : "#CC5A4E";
    const expColor = theme === "dark" ? "#45B7AA" : "#2A9E8F";
    const hubColor = "#D4A843";
    const txt = theme === "dark" ? "#E8E8ED" : "#1A1A1F";
    const muted = theme === "dark" ? "#8B8B9E" : "#6B6B7B";

    const sankeyGen = d3Sankey()
      .nodeWidth(13)
      .nodePadding(16)
      .extent([[m.left, m.top], [width - m.right, height - m.bottom]]);

    let graph;
    try {
      graph = sankeyGen({ nodes: nodes.map((d) => ({ ...d })), links: links.map((d) => ({ ...d })) });
    } catch {
      return;
    }

    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);
    const nodeColor = (n) => (n.name === hubLabel ? hubColor : n.x0 < width / 2 ? impColor : expColor);

    const tip = d3.select(containerRef.current).append("div")
      .attr("class", "absolute pointer-events-none p-2.5 rounded-lg border text-[11px] shadow-md transition-opacity duration-150 opacity-0 z-50")
      .style("background", theme === "dark" ? "#12121A" : "#FFFFFF")
      .style("border-color", theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)")
      .style("color", txt);

    // links
    svg.append("g").attr("fill", "none")
      .selectAll("path").data(graph.links).enter().append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (d) => (d.kind === "import" ? impColor : expColor))
      .attr("stroke-opacity", 0.32)
      .attr("stroke-width", (d) => Math.max(1, d.width))
      .style("transition", "stroke-opacity 0.2s")
      .on("mouseover", function (e, d) {
        d3.select(this).attr("stroke-opacity", 0.6);
        tip.style("opacity", 1).html(`<span class="font-mono">${d.source.name} → ${d.target.name}</span><br/><span style="color:${d.kind === "import" ? impColor : expColor};font-weight:600">${Math.round(d.value).toLocaleString("fr-FR")} ${unit}</span>`);
      })
      .on("mousemove", function (e) {
        const xPos = e.offsetX > width - 160 ? e.offsetX - 150 : e.offsetX + 12;
        tip.style("left", `${xPos}px`).style("top", `${Math.min(e.offsetY + 10, height - 50)}px`);
      })
      .on("mouseout", function () { d3.select(this).attr("stroke-opacity", 0.32); tip.style("opacity", 0); });

    // nodes
    svg.append("g").selectAll("rect").data(graph.nodes).enter().append("rect")
      .attr("x", (d) => d.x0).attr("y", (d) => d.y0)
      .attr("height", (d) => Math.max(1, d.y1 - d.y0)).attr("width", (d) => d.x1 - d.x0)
      .attr("fill", nodeColor).attr("rx", 2);

    // labels
    svg.append("g").selectAll("text").data(graph.nodes).enter().append("text")
      .attr("x", (d) => (d.name === hubLabel ? (d.x0 + d.x1) / 2 : d.x0 < width / 2 ? d.x0 - 8 : d.x1 + 8))
      .attr("y", (d) => (d.name === hubLabel ? d.y0 - 8 : (d.y0 + d.y1) / 2))
      .attr("text-anchor", (d) => (d.name === hubLabel ? "middle" : d.x0 < width / 2 ? "end" : "start"))
      .attr("dominant-baseline", "middle")
      .each(function (d) {
        const sel = d3.select(this);
        const isHub = d.name === hubLabel;
        sel.append("tspan").attr("fill", isHub ? hubColor : txt).attr("font-size", isHub ? "12px" : isNarrow ? "9.5px" : "11px").attr("font-weight", isHub ? "700" : "500").attr("font-family", "Inter, sans-serif").text(d.name);
        if (!isHub) {
          sel.append("tspan").attr("x", d.x0 < width / 2 ? d.x0 - 8 : d.x1 + 8).attr("dy", "1.2em").attr("fill", muted).attr("font-size", isNarrow ? "8.5px" : "9.5px").attr("font-family", "JetBrains Mono, monospace").text(`${Math.round(d.value).toLocaleString("fr-FR")} ${unit}`);
        }
      });

    return () => { tip.remove(); };
  }, [imports, exports, hubLabel, width, height, theme, unit]);

  return (
    <div ref={containerRef} className="relative w-full overflow-visible">
      <svg ref={svgRef} className="overflow-visible select-none" />
    </div>
  );
}
