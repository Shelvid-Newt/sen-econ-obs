"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Banknote, TrendingUp, Users, Ship } from "lucide-react";
import AreaLineChart from "../../../components/AreaLineChart.jsx";
import StatCard from "../../../components/StatCard.jsx";
import { useTheme } from "../../../components/ThemeProvider.jsx";

const DECOMP = [
  { key: "tva", label: "TVA", color: "#5B8DEF" },
  { key: "autres", label: "Autres impôts", color: "#D4A843" },
  { key: "douanes", label: "Douanes", color: "#E67E73" },
  { key: "non_fiscales", label: "Non fiscales", color: "#45B7AA" },
];

export default function FinancesPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [rec, setRec] = useState(null);
  const [fin, setFin] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/recettes_fiscales.json").then((r) => r.json()),
      fetch("/data/finances.json").then((r) => r.json()),
    ]).then(([r, f]) => { setRec(r); setFin(f); }).catch((e) => console.error(e)).finally(() => setLoading(false));
  }, []);

  const model = useMemo(() => {
    if (!rec || !fin) return null;
    const ks = Object.keys(rec).sort();
    const last = ks[ks.length - 1], prev = ks[ks.length - 2], ya = ks[ks.length - 13];
    const cur = rec[last]?.value ?? 0;
    const recPrev = rec[prev]?.value ?? cur;
    const recYa = rec[ya]?.value ?? cur;
    const masse = fin.masse_salariale[last]?.value ?? 0;
    const massePrev = fin.masse_salariale[prev]?.value ?? masse;
    const douanes = fin.douanes[last]?.value ?? 0;
    const eff = fin.effectifs[last]?.value ?? 0;
    const monthLabel = (() => { const dt = new Date(last); return isNaN(dt) ? last : dt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }); })();

    const win = ks.slice(-36);
    const decomp = win.map((d) => {
      const rf = rec[d]?.value ?? 0;
      const tva = fin.tva[d]?.value ?? 0;
      const dou = fin.douanes[d]?.value ?? 0;
      return { date: d, tva, douanes: dou, autres: Math.max(0, rf - tva - dou), non_fiscales: fin.recettes_non_fiscales[d]?.value ?? 0 };
    });
    const recTrend = ks.slice(-60).map((d) => ({ date: d, p: rec[d]?.value ?? 0 }));
    const masseTrend = ks.slice(-60).map((d) => ({ date: d, p: fin.masse_salariale[d]?.value ?? 0 }));

    return {
      cur, mm: recPrev ? ((cur - recPrev) / recPrev) * 100 : 0, yoy: recYa ? ((cur - recYa) / recYa) * 100 : 0,
      masse, masseMM: massePrev ? ((masse - massePrev) / massePrev) * 100 : 0,
      partDouanes: cur ? (douanes / cur) * 100 : 0, masseRatio: cur ? (masse / cur) * 100 : 0,
      eff, monthLabel, decomp, recTrend, masseTrend,
    };
  }, [rec, fin]);

  const gold = "var(--accent-gold)";
  const skel = (h) => <div className="rounded animate-pulse" style={{ background: "var(--border)", height: h }} />;

  return (
    <div className="w-full">
      <div className="seo-dash-banner">
        <div>
          <span className="seo-kicker">Finances publiques · {model?.monthLabel || ""}</span>
          <h1 className="seo-dash-title">Finances</h1>
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>Mds FCFA</span>
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Banknote className="w-3 h-3" style={{ color: gold }} />} label="Recettes du mois" value={model?.cur || 0} decimals={1} unit="Mds" variation={model?.mm} />
          <StatCard icon={<TrendingUp className="w-3 h-3" style={{ color: "var(--data-positive)" }} />} label="Glissement annuel" value={model?.yoy || 0} decimals={1} unit="%" signed sub="vs même mois 2025" highlight />
          <StatCard icon={<Users className="w-3 h-3" style={{ color: gold }} />} label="Masse salariale" value={model?.masse || 0} decimals={1} unit="Mds" variation={model?.masseMM} />
          <StatCard icon={<Ship className="w-3 h-3" style={{ color: gold }} />} label="Part des douanes" value={model?.partDouanes || 0} decimals={1} unit="%" sub="des recettes fiscales" />
        </div>

        {/* COMPOSITION (decomposition / waterfall over time) */}
        <div className="seo-card flex flex-col">
          <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>La TVA porte les recettes, les douanes restent secondaires</h3>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Composition des recettes — Mds FCFA, 36 mois</span>
            </div>
            <span className="seo-stat-pill">Douanes · {(model?.partDouanes || 0).toFixed(0)}%</span>
          </div>
          {loading || !model ? skel(320) : (
            <AreaLineChart data={model.decomp} keys={DECOMP} mode="stack" theme={theme} height={320} unit="Mds" />
          )}
          <div className="mt-auto pt-3 text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Source · DPEE, TBO Janv. 2026 — Finances Publiques. Le TBO ne publie ni dépenses totales ni dette.
          </div>
        </div>

        {/* RECETTES + MASSE SALARIALE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="seo-card flex flex-col">
            <div className="pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>Recettes fiscales mensuelles</h3>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Mds FCFA, 60 mois</span>
            </div>
            {loading || !model ? skel(280) : (
              <AreaLineChart data={model.recTrend} keys={[{ key: "p", label: "Recettes", color: "#D4A843" }]} mode="line" theme={theme} height={280} unit="Mds" />
            )}
          </div>
          <div className="seo-card flex flex-col">
            <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>Masse salariale publique</h3>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Mds FCFA, 60 mois · {(model?.eff || 0).toLocaleString("fr-FR")} agents</span>
              </div>
              <span className="seo-stat-pill">{(model?.masseRatio || 0).toFixed(0)}% des recettes</span>
            </div>
            {loading || !model ? skel(280) : (
              <AreaLineChart data={model.masseTrend} keys={[{ key: "p", label: "Masse salariale", color: "#45B7AA" }]} mode="line" theme={theme} height={280} unit="Mds" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
