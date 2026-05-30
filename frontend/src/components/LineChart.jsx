"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

export default function LineChart({ data, theme = "dark", height = 260 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);

  // Resize handler
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

    // Nettoyer le SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const isNarrow = width < 480;
    const margin = { top: 30, right: isNarrow ? 64 : 90, bottom: 30, left: isNarrow ? 22 : 30 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parser les dates et trier
    const parseTime = d3.timeParse("%Y-%m");
    const formattedData = data.map(d => ({
      ...d,
      parsedDate: parseTime(d.date)
    })).sort((a, b) => a.parsedDate - b.parsedDate);

    // Définir les séries à tracer
    const seriesNames = ["primaire", "secondaire", "tertiaire", "commerce"];
    const colors = theme === "dark" 
      ? ["#5B8DEF", "#E67E73", "#D4A843", "#45B7AA"] // Sombre
      : ["#3A6FD8", "#CC5A4E", "#B8942E", "#2A9E8F"]; // Clair

    // Echelles
    const xScale = d3.scaleTime()
      .domain(d3.extent(formattedData, d => d.parsedDate))
      .range([0, chartWidth]);

    // Trouver le min et max sur toutes les séries
    const allValues = formattedData.flatMap(d => seriesNames.map(name => d[name]));
    const yScale = d3.scaleLinear()
      .domain([d3.min(allValues) * 0.95, d3.max(allValues) * 1.05])
      .range([chartHeight, 0]);

    // Axes & Grille Style FT (Uniquement grille horizontale, pas de ligne d'axe vertical)
    const yGridTicks = 4;
    
    // Grille horizontale
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .ticks(yGridTicks)
        .tickSize(-chartWidth)
        .tickFormat("")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke", theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)")
        .attr("stroke-width", 0.5)
      );

    // Label Axe Y (placé en haut à gauche, aligné à gauche)
    svg.append("g")
      .call(d3.axisLeft(yScale).ticks(yGridTicks).tickFormat(d => d))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").remove())
      .call(g => g.selectAll(".tick text")
        .attr("fill", theme === "dark" ? "#8B8B9E" : "#6B6B7B")
        .attr("font-size", "10px")
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("x", -5)
      );

    // Axe X
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.max(3, Math.floor(chartWidth / 80)))
      .tickFormat(d3.timeFormat(chartWidth < 400 ? "%y" : "%b %y"));

    svg.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(xAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").remove())
      .call(g => g.selectAll(".tick text")
        .attr("fill", theme === "dark" ? "#8B8B9E" : "#6B6B7B")
        .attr("font-size", "9.5px")
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("dy", 12)
      );

    // Tracer les courbes
    const endLabels = [];

    seriesNames.forEach((name, idx) => {
      const lineData = formattedData.map(d => ({
        parsedDate: d.parsedDate,
        value: d[name]
      }));

      const pathGenerator = d3.line()
        .x(d => xScale(d.parsedDate))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

      // Courbe — animation stroke-dashoffset déclenchée à l'apparition
      const pathSel = svg.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", colors[idx])
        .attr("stroke-width", 2)
        .attr("d", pathGenerator);

      const totalLength = pathSel.node().getTotalLength();
      pathSel
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1100)
        .delay(idx * 120)
        .ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);

      // Point Final Distinctif
      const lastPoint = lineData[lineData.length - 1];
      svg.append("circle")
        .attr("cx", xScale(lastPoint.parsedDate))
        .attr("cy", yScale(lastPoint.value))
        .attr("r", 3)
        .attr("fill", colors[idx]);

      // Étiquette de fin collectée pour un placement anti-chevauchement après la boucle
      endLabels.push({
        label: `${name.charAt(0).toUpperCase() + name.slice(1)} ${Math.round(lastPoint.value)}`,
        color: colors[idx],
        x: xScale(lastPoint.parsedDate),
        y: yScale(lastPoint.value),
      });
    });

    // DIRECT LABELING (style FT) — décalage vertical pour éviter le chevauchement
    endLabels.sort((a, b) => a.y - b.y);
    const minGap = 13;
    for (let i = 1; i < endLabels.length; i++) {
      if (endLabels[i].y - endLabels[i - 1].y < minGap) {
        endLabels[i].y = endLabels[i - 1].y + minGap;
      }
    }
    const overflow = endLabels.length ? endLabels[endLabels.length - 1].y - chartHeight : 0;
    if (overflow > 0) endLabels.forEach((l) => (l.y -= overflow));
    endLabels.forEach((l) => {
      svg.append("text")
        .attr("x", l.x + 8)
        .attr("y", l.y + 3)
        .attr("fill", l.color)
        .attr("font-size", isNarrow ? "9px" : "10px")
        .attr("font-family", "Inter, sans-serif")
        .attr("font-weight", "500")
        .text(l.label);
    });

    // --- TOOLTIP INTERACTIF STYLE FINANCIAL TIMES ---
    const bisect = d3.bisector(d => d.parsedDate).left;
    const focusLine = svg.append("line")
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .attr("stroke", theme === "dark" ? "rgba(212,168,67,0.3)" : "rgba(184,148,46,0.3)")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .style("display", "none");

    const overlay = svg.append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all");

    // Tooltip float element handler
    const tooltipDiv = d3.select(containerRef.current)
      .append("div")
      .attr("class", "absolute pointer-events-none p-3 rounded-lg border text-[11px] font-sans shadow-md transition-opacity duration-200 opacity-0 z-50")
      .style("background", theme === "dark" ? "#12121A" : "#FFFFFF")
      .style("border-color", theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)")
      .style("color", theme === "dark" ? "#E8E8ED" : "#1A1A1F");

    overlay
      .on("mouseover", () => {
        focusLine.style("display", null);
        tooltipDiv.style("opacity", 1);
      })
      .on("mouseout", () => {
        focusLine.style("display", "none");
        tooltipDiv.style("opacity", 0);
      })
      .on("mousemove", function (event) {
        const mouseX = d3.pointer(event)[0];
        const dateAtMouse = xScale.invert(mouseX);
        const i = bisect(formattedData, dateAtMouse, 1);
        const d0 = formattedData[i - 1];
        const d1 = formattedData[i];
        if (!d0 || !d1) return;
        const d = dateAtMouse - d0.parsedDate > d1.parsedDate - dateAtMouse ? d1 : d0;

        focusLine
          .attr("x1", xScale(d.parsedDate))
          .attr("x2", xScale(d.parsedDate));

        const formatTooltipDate = d3.timeFormat("%B %Y");
        
        let tooltipContent = `
          <div class="font-semibold mb-1 text-gold font-display">${formatTooltipDate(d.parsedDate)}</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px]">
        `;
        
        seriesNames.forEach((name, idx) => {
          tooltipContent += `
            <div class="flex items-center gap-1.5" style="color: ${theme === "dark" ? "#8B8B9E" : "#6B6B7B"}">
              <span class="inline-block w-2.5 h-0.5" style="background-color: ${colors[idx]}"></span>
              ${name.charAt(0).toUpperCase() + name.slice(1)}:
            </div>
            <div class="text-right font-semibold" style="color: ${colors[idx]}">${Math.round(d[name])}</div>
          `;
        });
        tooltipContent += `</div>`;

        // Positionner le tooltip
        const xPos = event.offsetX > width - 180 ? event.offsetX - 170 : event.offsetX + 15;
        const yPos = event.offsetY > height - 120 ? event.offsetY - 110 : event.offsetY + 15;

        tooltipDiv
          .html(tooltipContent)
          .style("left", `${xPos}px`)
          .style("top", `${yPos}px`);
      });

    return () => {
      tooltipDiv.remove();
    };

  }, [data, width, height, theme]);

  return (
    <div ref={containerRef} className="relative w-full overflow-visible">
      <svg ref={svgRef} className="overflow-visible select-none"></svg>
    </div>
  );
}
