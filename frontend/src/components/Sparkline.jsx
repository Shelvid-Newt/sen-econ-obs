"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * Lightweight sparkline with terminal dot + value annotation.
 * Props:
 *   - data: [{date: "YYYY-MM-01", value: number}, ...] (chronological)
 *   - theme: "dark" | "light"
 *   - height: number
 *   - colorOverride: optional hex
 *   - animate: trigger stroke-dashoffset draw-in
 *   - unit: string suffix in the terminal label (e.g. "kg", "kt")
 */
export default function Sparkline({
  data,
  theme = "dark",
  height = 44,
  colorOverride,
  animate = false,
  unit = "",
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(180);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (let e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data || data.length < 2) return;
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 4, right: 50, bottom: 14, left: 4 };
    const chartW = Math.max(20, width - margin.left - margin.right);
    const chartH = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const parsedData = data
      .map((d) => ({ date: new Date(d.date), value: +d.value }))
      .filter((d) => !isNaN(d.value) && d.value !== null);

    if (parsedData.length < 2) return;

    const x = d3.scaleTime().domain(d3.extent(parsedData, (d) => d.date)).range([0, chartW]);
    const yMin = d3.min(parsedData, (d) => d.value);
    const yMax = d3.max(parsedData, (d) => d.value);
    const pad = (yMax - yMin) * 0.1 || 1;
    const y = d3.scaleLinear().domain([yMin - pad, yMax + pad]).range([chartH, 0]);

    const first = parsedData[0];
    const last = parsedData[parsedData.length - 1];
    const isUp = last.value >= first.value;
    const color =
      colorOverride ||
      (isUp
        ? theme === "dark"
          ? "#2ECC71"
          : "#1B9E55"
        : theme === "dark"
        ? "#E74C3C"
        : "#D43D3D");

    const lineGen = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const path = svg
      .append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("stroke-linecap", "round")
      .attr("d", lineGen);

    if (animate) {
      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);
    }

    svg
      .append("circle")
      .attr("cx", x(last.date))
      .attr("cy", y(last.value))
      .attr("r", 2.5)
      .attr("fill", color);

    svg
      .append("text")
      .attr("x", x(last.date) + 6)
      .attr("y", y(last.value) + 3)
      .attr("fill", color)
      .attr("font-size", "9px")
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("font-weight", "600")
      .text(`${Math.round(last.value).toLocaleString("fr-FR")}${unit ? " " + unit : ""}`);

    const axisColor = theme === "dark" ? "#55556A" : "#9B9BA8";
    svg
      .append("text")
      .attr("x", 0)
      .attr("y", chartH + 11)
      .attr("fill", axisColor)
      .attr("font-size", "8px")
      .attr("font-family", "JetBrains Mono, monospace")
      .text(d3.timeFormat("%b %y")(first.date).toLowerCase());

    svg
      .append("text")
      .attr("x", chartW)
      .attr("y", chartH + 11)
      .attr("text-anchor", "end")
      .attr("fill", axisColor)
      .attr("font-size", "8px")
      .attr("font-family", "JetBrains Mono, monospace")
      .text(d3.timeFormat("%b %y")(last.date).toLowerCase());
  }, [data, width, height, theme, colorOverride, animate, unit]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="overflow-visible select-none"></svg>
    </div>
  );
}
