"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Percent, Flame } from "lucide-react";
import Sankey from "../../../components/Sankey.jsx";
import AreaLineChart from "../../../components/AreaLineChart.jsx";
import CountUp from "../../../components/CountUp.jsx";
import { useTheme } from "../../../components/ThemeProvider.jsx";

const IMP = [
  { key: "hydrocarbures_raffines", label: "Hydrocarbures raffinés", color: "#E67E73" },
  { key: "petrole_brut", label: "Pétrole brut", color: "#D4A843" },
  { key: "ble", label: "Blé", color: "#45B7AA" },
  { key: "riz", label: "Riz", color: "#5B8DEF" },
];
const EXP = [
  { key: "peche", label: "Pêche", color: "#45B7AA" },
  { key: "arachide", label: "Arachide", color: "#D4A843" },
];

const cell = (c) => (c ? (c.raw_value ?? c.value ?? 0) : 0);
const sum12 = (m) => {
  const ks = Object.keys(m || {}).sort();
  return ks.slice(-12).reduce((s, d) => s + cell(m[d]), 0);
};

export default function EchangesPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/data/echanges.json").then((r) => r.json()).then(setData).catch((e) => console.error(e)).finally(() => setLoading(false));
  }, []);

  const model = useMemo(() => {
    if (!data) return null;
    const imp = IMP.map((p) => ({ ...p, value: sum12(data.imports[p.key]) }));
    const exp = EXP.map((p) => ({ ...p, value: sum12(data.exports[p.key]) }));
    const impTotal = imp.reduce((s, d) => s + d.value, 0);
    const expTotal = exp.reduce((s, d) => s + d.value, 0);
    const dominant = [...imp].sort((a, b) => b.value - a.value)[0];

    const dates = Object.keys(data.imports.riz || {}).sort().slice(-36);
    const impTrend = dates.map((d) => ({
      date: d,
      hydrocarbures_raffines: data.imports.hydrocarbures_raffines[d]?.value ?? 0,
      petrole_brut: data.imports.petrole_brut[d]?.value ?? 0,
      ble: data.imports.ble[d]?.value ?? 0,
      riz: data.imports.riz[d]?.value ?? 0,
    }));
    const expTrend = dates.map((d) => ({
      date: d,
      peche: data.exports.peche[d]?.value ?? 0,
      arachide: data.exports.arachide[d]?.value ?? 0,
    }));

    return {
      imp, exp, impTotal, expTotal,
      couverture: impTotal ? (expTotal / impTotal) * 100 : 0,
      dominant, dominantShare: impTotal ? (dominant.value / impTotal) * 100 : 0,
      impTrend, expTrend,
    };
  }, [data]);

  const gold = "var(--accent-gold)";
  const skel = (h) => <div className="rounded animate-pulse" style={{ background: "var(--border)", height: h }} />;

  return (
    <div className="w-full">
      <div className="seo-dash-banner">
        <div>
          <span className="seo-kicker">Commerce extérieur · cumul 12 mois</span>
          <h1 className="seo-dash-title">Échanges extérieurs</h1>
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>Volumes · 1000 tonnes</span>
      </div>

      <div className="flex flex-col gap-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={<ArrowDownToLine className="w-3 h-3" style={{ color: "var(--data-negative)" }} />} label="Importations · 12 mois" value={model?.impTotal || 0} unit="kt" />
          <Stat icon={<ArrowUpFromLine className="w-3 h-3" style={{ color: "var(--data-positive)" }} />} label="Exportations · 12 mois" value={model?.expTotal || 0} unit="kt" />
          <Stat icon={<Percent className="w-3 h-3" style={{ color: gold }} />} label="Taux de couverture" value={model?.couverture || 0} decimals={1} unit="%" sub="exports ÷ imports (volume)" highlight />
          <Stat icon={<Flame className="w-3 h-3" style={{ color: gold }} />} label="Import dominant" value={model?.dominantShare || 0} decimals={0} unit="%" sub={model?.dominant?.label || "—"} />
        </div>

        {/* SANKEY */}
        <div className="seo-card flex flex-col">
          <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
                Importer l&apos;énergie, exporter la mer
              </h3>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Flux de marchandises · cumul 12 mois · 1000 tonnes</span>
            </div>
            <span className="seo-stat-pill">Couverture · {(model?.couverture || 0).toFixed(0)}%</span>
          </div>
          {loading || !model ? skel(360) : (
            <Sankey imports={model.imp} exports={model.exp} hubLabel="Sénégal" theme={theme} height={380} unit="kt" />
          )}
          <div className="mt-auto pt-3 text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Source · DPEE, TBO Janv. 2026 — Commerce Extérieur (volumes). Épaisseur ∝ tonnage.
          </div>
        </div>

        {/* TRENDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="seo-card flex flex-col">
            <div className="pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>Les hydrocarbures raffinés dominent les importations</h3>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Importations par produit — kt, 36 mois</span>
            </div>
            {loading || !model ? skel(300) : (
              <AreaLineChart data={model.impTrend} keys={IMP} mode="stack" theme={theme} height={300} unit="kt" />
            )}
            <div className="mt-auto pt-3 text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>Source · DPEE, TBO Janv. 2026</div>
          </div>

          <div className="seo-card flex flex-col">
            <div className="pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>Des exportations rares et saisonnières</h3>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Exportations par produit — kt, 36 mois</span>
            </div>
            {loading || !model ? skel(300) : (
              <AreaLineChart data={model.expTrend} keys={EXP} mode="line" theme={theme} height={300} unit="kt" />
            )}
            <div className="mt-auto pt-3 text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>Source · DPEE, TBO Janv. 2026 — arachide nulle hors campagne</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, unit, decimals = 0, sub, highlight }) {
  return (
    <div className="seo-card" style={highlight ? { borderColor: "var(--accent-gold-dim)" } : undefined}>
      <div className="font-display font-medium text-[9px] tracking-wider uppercase flex items-center gap-1.5 mb-3" style={{ color: "var(--text-muted)" }}>
        {icon} {label}
      </div>
      <div className="font-display font-bold text-2xl sm:text-3xl leading-none break-words">
        <CountUp value={value} decimals={decimals} /> <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>{unit}</span>
      </div>
      {sub && <div className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}
