"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

export default function PrixHeatmap({ data, theme = "dark", height = 180 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);

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

    const margin = { top: 30, right: 20, bottom: 20, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Obtenir la liste unique des régions (colonnes) et produits (lignes)
    const products = Array.from(new Set(data.map(d => d.product)));
    const regions = Array.from(new Set(data.flatMap(d => Object.keys(d.markets || {}))));

    if (products.length === 0 || regions.length === 0) return;

    // Echelles
    const xScale = d3.scaleBand()
      .domain(regions)
      .range([0, chartWidth])
      .padding(0.06);

    const yScale = d3.scaleBand()
      .domain(products)
      .range([0, chartHeight])
      .padding(0.08);

    // Calculer les divergences de prix pour la coloration
    // Pour chaque produit, calculer son prix moyen
    const productStats = {};
    products.forEach(p => {
      const pData = data.find(d => d.product === p);
      if (!pData || !pData.markets) return;
      const prices = Object.values(pData.markets).filter(v => v !== null && v > 0);
      productStats[p] = {
        mean: d3.mean(prices) || 1,
        min: d3.min(prices) || 0,
        max: d3.max(prices) || 1
      };
    });

    // Echelle divergente de couleurs (Bleu pour moins cher, Rouge pour plus cher)
    // Divergence de -30% à +30%
    const colorScale = d3.scaleDiverging()
      .domain([-25, 0, 25])
      .interpolator(d3.interpolateRdBu); // Rouge = chaud (plus cher), Bleu = froid (moins cher)
      // Note : RdBu met rouge à gauche (valeurs négatives) et bleu à droite (valeurs positives) par défaut.
      // Nous voulons l'inverse (Bleu pour négatif = moins cher, Rouge pour positif = plus cher).
      // Donc nous inversons l'échelle en ajustant notre fonction d'évaluation :

    const getCellColor = (val, mean) => {
      if (val === null || val === undefined || val === 0) {
        return theme === "dark" ? "#1A1A25" : "#E0DFD9"; // Grid vide
      }
      const divergencePercent = ((val - mean) / mean) * 100;
      
      // Inverser RdBu : divergence négative -> bleu, divergence positive -> rouge
      // RdBu(0) = rouge, RdBu(0.5) = blanc, RdBu(1) = bleu
      // Donc nous voulons : -25% -> 1 (bleu), 0% -> 0.5 (blanc), +25% -> 0 (rouge)
      let t = 0.5 - (divergencePercent / 50); // Mappe [-25, 25] vers [1, 0]
      t = Math.max(0, Math.min(1, t)); // Borner
      return d3.interpolateRdBu(t);
    };

    // Tooltip flottant
    const tooltipDiv = d3.select(containerRef.current)
      .append("div")
      .attr("class", "absolute pointer-events-none p-3 rounded-lg border text-[11px] font-sans shadow-md transition-opacity duration-200 opacity-0 z-50")
      .style("background", theme === "dark" ? "#12121A" : "#FFFFFF")
      .style("border-color", theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)")
      .style("color", theme === "dark" ? "#E8E8ED" : "#1A1A1F");

    // Tracer les cases de la heatmap
    const cells = [];
    products.forEach(p => {
      const pData = data.find(d => d.product === p);
      if (!pData || !pData.markets) return;
      regions.forEach(r => {
        cells.push({
          product: p,
          region: r,
          val: pData.markets[r]
        });
      });
    });

    svg.selectAll(".cell")
      .data(cells)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", d => xScale(d.region))
      .attr("y", d => yScale(d.product))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => {
        const stats = productStats[d.product];
        return getCellColor(d.val, stats ? stats.mean : 1);
      })
      .attr("rx", 2)
      .attr("stroke", theme === "dark" ? "#12121A" : "#FFFFFF")
      .attr("stroke-width", 0.5)
      .on("mouseover", function() {
        d3.select(this)
          .attr("stroke", theme === "dark" ? "#D4A843" : "#B8942E")
          .attr("stroke-width", 1.5);
        tooltipDiv.style("opacity", 1);
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke", theme === "dark" ? "#12121A" : "#FFFFFF")
          .attr("stroke-width", 0.5);
        tooltipDiv.style("opacity", 0);
      })
      .on("mousemove", function(event, d) {
        const stats = productStats[d.product];
        if (!stats || d.val === null || d.val === undefined || d.val === 0) {
          tooltipDiv.html(`
            <div class="font-semibold text-gold mb-1">${d.region}</div>
            <div class="text-[10px]" style="color: ${theme === "dark" ? "#8B8B9E" : "#6B6B7B"}">
              ${d.product} : <span class="font-mono text-text-muted">Non disponible</span>
            </div>
          `);
        } else {
          const divergence = ((d.val - stats.mean) / stats.mean) * 100;
          const sign = divergence > 0 ? "+" : "";
          const colorClass = divergence > 0 ? "text-negative" : "text-positive";
          tooltipDiv.html(`
            <div class="font-semibold text-gold mb-1 font-display">${d.region}</div>
            <div class="text-[10px] space-y-0.5">
              <div style="color: ${theme === "dark" ? "#8B8B9E" : "#6B6B7B"}">Produit : <span class="font-semibold" style="color: ${theme === "dark" ? "#E8E8ED" : "#1A1A1F"}">${d.product}</span></div>
              <div>Prix constaté : <span class="font-mono font-semibold">${Math.round(d.val)} FCFA / kg</span></div>
              <div>Moyenne nationale : <span class="font-mono text-text-muted">${Math.round(stats.mean)} FCFA</span></div>
              <div class="font-semibold mt-1">Écart : <span class="font-mono ${divergence > 0 ? "text-red-500" : "text-green-500"}">${sign}${divergence.toFixed(1)}%</span></div>
            </div>
          `);
        }

        const xPos = event.offsetX > width - 180 ? event.offsetX - 170 : event.offsetX + 15;
        const yPos = event.offsetY > height - 120 ? event.offsetY - 110 : event.offsetY + 15;

        tooltipDiv
          .style("left", `${xPos}px`)
          .style("top", `${yPos}px`);
      });

    // En-têtes de colonnes (Régions)
    svg.append("g")
      .attr("transform", "translate(0, -8)")
      .selectAll(".col-label")
      .data(regions)
      .enter()
      .append("text")
      .attr("class", "col-label")
      .attr("x", d => xScale(d) + xScale.bandwidth() / 2)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("fill", theme === "dark" ? "#8B8B9E" : "#6B6B7B")
      .attr("font-size", "7.5px")
      .attr("font-family", "Space Grotesk, sans-serif")
      .attr("font-weight", "500")
      .text(d => d.substring(0, 3).toUpperCase());

    // En-têtes de lignes (Produits)
    svg.append("g")
      .selectAll(".row-label")
      .data(products)
      .enter()
      .append("text")
      .attr("class", "row-label")
      .attr("x", -10)
      .attr("y", d => yScale(d) + yScale.bandwidth() / 2 + 3.5)
      .attr("text-anchor", "end")
      .attr("fill", theme === "dark" ? "#E8E8ED" : "#1A1A1F")
      .attr("font-size", "9.5px")
      .attr("font-family", "Inter, sans-serif")
      .attr("font-weight", "500")
      .text(d => d);

    return () => {
      tooltipDiv.remove();
    };

  }, [data, width, height, theme]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <svg ref={svgRef} className="overflow-visible select-none"></svg>
    </div>
  );
}
