"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ArrowRightLeft,
  ArrowRight,
  Download,
  Banknote,
  Fuel,
  Euro,
  DollarSign,
} from "lucide-react";
import LineChart from "../../../components/LineChart.jsx";
import ButterflyChart from "../../../components/ButterflyChart.jsx";
import { KpiSparkCard } from "../../../components/Kpi.jsx";
import { useTheme } from "../../../components/ThemeProvider.jsx";
import useObservatoryData from "../../../lib/useObservatoryData.js";

export default function DashboardPage() {
  const { theme } = useTheme();
  const { loading, sectors, exchanges, brentSeries, recettesSeries, eurUsdSeries, usdCfaSeries, kpis } = useObservatoryData();
  const [range, setRange] = useState("full");

  const gold = "var(--accent-gold)";
  const chartData = range === "12m" ? sectors.slice(-13) : sectors;

  const totalImp = exchanges.reduce((s, d) => s + (d.import || 0), 0);
  const totalExp = exchanges.reduce((s, d) => s + (d.export || 0), 0);
  const solde = totalExp - totalImp;
  const importColor = theme === "dark" ? "#E67E73" : "#CC5A4E";
  const exportColor = theme === "dark" ? "#5B8DEF" : "#3A6FD8";

  return (
    <div className="w-full">
      <div className="seo-dash-banner">
        <div>
          <span className="seo-kicker">Conjoncture · Janvier 2026</span>
          <h1 className="seo-dash-title">Le tableau de bord</h1>
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>Source · DPEE, TBO Janv. 2026</span>
      </div>

      <div className="flex flex-col gap-5">
        {/* KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiSparkCard
            icon={<Banknote className="w-3 h-3" style={{ color: gold }} />}
            label="Recettes fiscales"
            value={kpis.recettesValue}
            decimals={1}
            unit="Mds"
            variation={kpis.recettesVar}
            variationLabel="vs 2025"
            series={recettesSeries}
            theme={theme}
            periodLabel="JANV. 26"
          />
          <KpiSparkCard
            icon={<Fuel className="w-3 h-3" style={{ color: gold }} />}
            label="Brent · pétrole"
            value={kpis.brentValue}
            decimals={1}
            unit="$/baril"
            variation={kpis.brentVar}
            series={brentSeries}
            theme={theme}
            periodLabel="JANV. 25 → 26"
          />
          <KpiSparkCard
            icon={<Euro className="w-3 h-3" style={{ color: gold }} />}
            label="Euro / Dollar"
            value={kpis.eurUsdValue}
            decimals={4}
            unit=""
            variation={kpis.eurUsdVar}
            series={eurUsdSeries}
            theme={theme}
            periodLabel="JANV. 25 → 26"
          />
          <KpiSparkCard
            icon={<DollarSign className="w-3 h-3" style={{ color: gold }} />}
            label="Dollar / FCFA"
            value={kpis.usdCfaValue}
            decimals={1}
            unit="FCFA"
            variation={kpis.usdCfaVar}
            series={usdCfaSeries}
            theme={theme}
            periodLabel="JANV. 25 → 26"
          />
        </div>

        {/* FOCAL CHART */}
        <div className="seo-card flex flex-col">
          <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
                Le tertiaire porte l&apos;activité, le primaire décroche
              </h3>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Indices sectoriels d&apos;activité · base 100 = 2022
              </span>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button className={`seo-range-btn ${range === "full" ? "active" : ""}`} onClick={() => setRange("full")}>Depuis 2024</button>
              <button className={`seo-range-btn ${range === "12m" ? "active" : ""}`} onClick={() => setRange("12m")}>12 mois</button>
            </div>
          </div>
          {loading ? (
            <div className="h-[380px] rounded animate-pulse" style={{ background: "var(--border)" }} />
          ) : (
            <LineChart data={chartData} theme={theme} height={380} />
          )}
          <div className="mt-auto pt-3 flex items-center justify-between text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <span>Source · DPEE, TBO Janvier 2026 — Indices sectoriels d&apos;activité</span>
            <a href="/data/sectors.json" download className="flex items-center gap-1 font-mono seo-nav-link" style={{ fontStyle: "normal" }} title="Télécharger les données">
              <Download className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* COMMERCE + BALANCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 seo-card flex flex-col">
            <div className="flex justify-between items-center gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="font-display font-semibold text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <ArrowRightLeft className="w-4 h-4 flex-shrink-0" style={{ color: gold }} />
                Le Sénégal importe son énergie, exporte ses matières premières
              </h3>
              <span className="font-mono text-[8px]" style={{ color: "var(--text-muted)" }}>Mds FCFA · Janv. 2026</span>
            </div>
            <ButterflyChart data={exchanges} theme={theme} />
            <div className="mt-auto pt-3 flex justify-between text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
              <span>Déséquilibre marqué sur les hydrocarbures raffinés et le blé</span>
              <Link href="/echanges" className="flex items-center gap-1 font-mono seo-nav-link" style={{ fontStyle: "normal" }}>
                Détail <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="seo-card flex flex-col">
            <div className="pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="font-display font-semibold text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>Balance commerciale</h3>
              <span className="font-mono text-[8px]" style={{ color: "var(--text-muted)" }}>flux majeurs · Mds FCFA</span>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-5">
              <div>
                <div className="font-display font-bold text-2xl sm:text-3xl leading-none" style={{ color: solde < 0 ? "var(--data-negative)" : "var(--data-positive)" }}>
                  {solde > 0 ? "+" : ""}{solde.toFixed(1)} <span className="text-sm font-normal" style={{ color: "var(--text-secondary)" }}>Mds</span>
                </div>
                <div className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                  {solde < 0 ? "Déficit" : "Excédent"} sur les flux majeurs présentés
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: importColor }} /> Importations
                  </span>
                  <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{totalImp.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: exportColor }} /> Exportations
                  </span>
                  <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{totalExp.toFixed(1)}</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden mt-1" style={{ backgroundColor: "var(--border)" }}>
                  <div style={{ width: `${(totalImp / (totalImp + totalExp)) * 100}%`, backgroundColor: importColor }} />
                  <div style={{ width: `${(totalExp / (totalImp + totalExp)) * 100}%`, backgroundColor: exportColor }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
