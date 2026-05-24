"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

export default function ButterflyChart({ data, theme = "dark", height = 220 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(500);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const importColor = theme === "dark" ? "#E67E73" : "#CC5A4E"; // Rouge-Corail
    const exportColor = theme === "dark" ? "#5B8DEF" : "#3A6FD8"; // Bleu

    // Trouver le max pour l'échelle
    const maxVal = d3.max(data, d => Math.max(d.import || 0, d.export || 0));

    // Echelles
    const yScale = d3.scaleBand()
      .domain(data.map(d => d.product))
      .range([0, chartHeight])
      .padding(0.3);

    // Echelle X pour la gauche (Imports, de max à 0) et la droite (Exports, de 0 à max)
    const midPoint = chartWidth / 2;

    const xScaleLeft = d3.scaleLinear()
      .domain([0, maxVal])
      .range([midPoint - 10, 0]); // un petit espace au centre

    const xScaleRight = d3.scaleLinear()
      .domain([0, maxVal])
      .range([midPoint + 10, chartWidth]);

    // Ligne centrale d'origine
    svg.append("line")
      .attr("x1", midPoint)
      .attr("y1", -5)
      .attr("x2", midPoint)
      .attr("y2", chartHeight + 5)
      .attr("stroke", theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "2,2");

    // Labels du centre (titres d'import/export)
    svg.append("text")
      .attr("x", midPoint - 15)
      .attr("y", -5)
      .attr("text-anchor", "end")
      .attr("fill", importColor)
      .attr("font-size", "8.5px")
      .attr("font-family", "Space Grotesk, sans-serif")
      .attr("letter-spacing", "1px")
      .attr("font-weight", "600")
      .text("← IMPORTATIONS");

    svg.append("text")
      .attr("x", midPoint + 15)
      .attr("y", -5)
      .attr("text-anchor", "start")
      .attr("fill", exportColor)
      .attr("font-size", "8.5px")
      .attr("font-family", "Space Grotesk, sans-serif")
      .attr("letter-spacing", "1px")
      .attr("font-weight", "600")
      .text("EXPORTATIONS →");

    // Dessiner les barres d'importations (Gauche)
    svg.selectAll(".bar-import")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar-import")
      .attr("x", d => xScaleLeft(d.import || 0))
      .attr("y", d => yScale(d.product))
      .attr("width", d => midPoint - 10 - xScaleLeft(d.import || 0))
      .attr("height", yScale.bandwidth())
      .attr("fill", importColor)
      .attr("rx", 3)
      .attr("opacity", 0.85)
      .on("mouseover", function() { d3.select(this).attr("opacity", 1); })
      .on("mouseout", function() { d3.select(this).attr("opacity", 0.85); });

    // Dessiner les barres d'exportations (Droite)
    svg.selectAll(".bar-export")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar-export")
      .attr("x", midPoint + 10)
      .attr("y", d => yScale(d.product))
      .attr("width", d => xScaleRight(d.export || 0) - (midPoint + 10))
      .attr("height", yScale.bandwidth())
      .attr("fill", exportColor)
      .attr("rx", 3)
      .attr("opacity", 0.85)
      .on("mouseover", function() { d3.select(this).attr("opacity", 1); })
      .on("mouseout", function() { d3.select(this).attr("opacity", 0.85); });

    // Valeurs numériques d'importation (placées à gauche du début de la barre)
    svg.selectAll(".text-val-import")
      .data(data.filter(d => d.import > 0))
      .enter()
      .append("text")
      .attr("x", d => xScaleLeft(d.import) - 6)
      .attr("y", d => yScale(d.product) + yScale.bandwidth() / 2 + 3.5)
      .attr("text-anchor", "end")
      .attr("fill", theme === "dark" ? "#8B8B9E" : "#6B6B7B")
      .attr("font-size", "9px")
      .attr("font-family", "JetBrains Mono, monospace")
      .text(d => d.import.toFixed(1));

    // Valeurs numériques d'exportation (placées à droite de la fin de la barre)
    svg.selectAll(".text-val-export")
      .data(data.filter(d => d.export > 0))
      .enter()
      .append("text")
      .attr("x", d => xScaleRight(d.export) + 6)
      .attr("y", d => yScale(d.product) + yScale.bandwidth() / 2 + 3.5)
      .attr("text-anchor", "start")
      .attr("fill", theme === "dark" ? "#8B8B9E" : "#6B6B7B")
      .attr("font-size", "9px")
      .attr("font-family", "JetBrains Mono, monospace")
      .text(d => d.export.toFixed(1));

    // Noms des produits (Axe Y à gauche, aligné à droite)
    svg.selectAll(".label-product")
      .data(data)
      .enter()
      .append("text")
      .attr("x", -12)
      .attr("y", d => yScale(d.product) + yScale.bandwidth() / 2 + 4)
      .attr("text-anchor", "end")
      .attr("fill", theme === "dark" ? "#E8E8ED" : "#1A1A1F")
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("font-weight", "500")
      .text(d => d.product);

  }, [data, width, height, theme]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <svg ref={svgRef} className="overflow-visible select-none"></svg>
    </div>
  );
}
