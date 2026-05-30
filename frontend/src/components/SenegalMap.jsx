"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const REGION_ALIAS = {
  "St louis": "Saint-Louis",
  "St Louis": "Saint-Louis",
  "Saint Louis": "Saint-Louis",
  "Tamba": "Tambacounda",
  "Thies": "Thiès",
};

const normalize = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export default function SenegalMap({ regionalValues, nationalMean, theme = "dark", height = 320 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) setWidth(entry.contentRect.width);
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let aborted = false;
    fetch("/data/senegal_regions.geojson")
      .then((r) => r.json())
      .then((g) => {
        if (!aborted) setGeoData(g);
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !geoData || !regionalValues) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);

    const projection = d3.geoMercator().fitSize([width, height], geoData);
    const path = d3.geoPath().projection(projection);

    const valuesIndex = {};
    Object.entries(regionalValues).forEach(([k, v]) => {
      const canonical = REGION_ALIAS[k] || k;
      valuesIndex[normalize(canonical)] = v;
    });

    const tooltipDiv = d3
      .select(containerRef.current)
      .append("div")
      .attr(
        "class",
        "absolute pointer-events-none p-3 rounded-lg border text-[11px] font-sans shadow-md transition-opacity duration-200 opacity-0 z-50"
      )
      .style("background", theme === "dark" ? "#12121A" : "#FFFFFF")
      .style("border-color", theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)")
      .style("color", theme === "dark" ? "#E8E8ED" : "#1A1A1F");

    const getDivergence = (val) => {
      if (val === null || val === undefined || !nationalMean) return null;
      return ((val - nationalMean) / nationalMean) * 100;
    };

    const cellColor = (val) => {
      if (val === null || val === undefined) return theme === "dark" ? "#1A1A25" : "#E8E7E1";
      const div = getDivergence(val);
      if (div === null) return theme === "dark" ? "#1A1A25" : "#E8E7E1";
      let t = 0.5 - div / 50;
      t = Math.max(0, Math.min(1, t));
      return d3.interpolateRdBu(t);
    };

    svg
      .append("g")
      .selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d) => {
        const name = normalize(d.properties.NAME_1);
        return cellColor(valuesIndex[name]);
      })
      .attr("stroke", theme === "dark" ? "#0A0A0F" : "#FFFFFF")
      .attr("stroke-width", 0.8)
      .style("cursor", "pointer")
      .on("mouseover", function () {
        d3.select(this).attr("stroke", theme === "dark" ? "#D4A843" : "#B8942E").attr("stroke-width", 1.5);
        tooltipDiv.style("opacity", 1);
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", theme === "dark" ? "#0A0A0F" : "#FFFFFF").attr("stroke-width", 0.8);
        tooltipDiv.style("opacity", 0);
      })
      .on("mousemove", function (event, d) {
        const name = d.properties.NAME_1;
        const val = valuesIndex[normalize(name)];
        const div = getDivergence(val);
        const dataAvailable = val !== null && val !== undefined;
        const sign = div !== null && div > 0 ? "+" : "";

        tooltipDiv.html(`
          <div class="font-semibold mb-1 font-display" style="color: ${theme === "dark" ? "#D4A843" : "#B8942E"}">${name}</div>
          <div class="text-[10px] space-y-0.5">
            ${
              dataAvailable
                ? `
                  <div>Prix constaté&nbsp;: <span class="font-mono font-semibold">${Math.round(val)} FCFA/kg</span></div>
                  <div>Moyenne nationale&nbsp;: <span class="font-mono">${Math.round(nationalMean)} FCFA</span></div>
                  <div class="font-semibold mt-1">Écart&nbsp;: <span class="font-mono" style="color: ${
                    div > 0 ? "#E74C3C" : "#2ECC71"
                  }">${sign}${div.toFixed(1)}%</span></div>
                `
                : `<div style="color: ${theme === "dark" ? "#8B8B9E" : "#6B6B7B"}">Données régionales non disponibles</div>`
            }
          </div>
        `);

        const xPos = event.offsetX > width - 200 ? event.offsetX - 190 : event.offsetX + 15;
        const yPos = event.offsetY > height - 110 ? event.offsetY - 100 : event.offsetY + 15;
        tooltipDiv.style("left", `${xPos}px`).style("top", `${yPos}px`);
      });

    svg
      .append("g")
      .selectAll("text")
      .data(geoData.features)
      .enter()
      .append("text")
      .attr("x", (d) => path.centroid(d)[0])
      .attr("y", (d) => path.centroid(d)[1])
      .attr("text-anchor", "middle")
      .attr("font-size", "8.5px")
      .attr("font-family", "Space Grotesk, sans-serif")
      .attr("font-weight", "600")
      .attr("fill", theme === "dark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)")
      .attr("pointer-events", "none")
      .text((d) => d.properties.NAME_1);

    return () => {
      tooltipDiv.remove();
    };
  }, [geoData, regionalValues, nationalMean, width, height, theme]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <svg ref={svgRef} className="overflow-visible select-none"></svg>
    </div>
  );
}
