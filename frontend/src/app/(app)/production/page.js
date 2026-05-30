"use client";

import React, { useEffect, useState } from "react";
import { Gem, Boxes, Fish, PieChart } from "lucide-react";
import AreaLineChart from "../../../components/AreaLineChart.jsx";
import { KpiSparkCard } from "../../../components/Kpi.jsx";
import { useTheme } from "../../../components/ThemeProvider.jsx";

const C_PROD = "#D4A843";
const C_VENTES = "#5B8DEF";
const C_EXPORT = "#45B7AA";
const C_INDUS = "#5B8DEF";
const C_ARTIS = "#45B7AA";

const sortedKeys = (m) => Object.keys(m || {}).sort();
const avg = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);

export default function ProductionPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [ciment, setCiment] = useState([]);
  const [peche, setPeche] = useState([]);
  const [or, setOr] = useState([]);
  const [kpi, setKpi] = useState({
    orVal: 0, orMM: 0, orCV: 0, orSpark: [],
    cProd: 0, cProdMM: 0, cOrient: 0, cProdSpark: [],
    pTotal: 0, pTotalMM: 0, pTotalSpark: [],
    artPart: 0, artPartDelta: 0, artSpark: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [orRaw, ciRaw, peRaw] = await Promise.all([
          fetch("/data/or.json").then((r) => r.json()),
          fetch("/data/ciment.json").then((r) => r.json()),
          fetch("/data/peche.json").then((r) => r.json()),
        ]);

        // --- OR ---
        const od = sortedKeys(orRaw);
        const orRows = od.slice(-48).map((d) => ({ date: d, or: orRaw[d]?.value ?? 0 }));
        setOr(orRows);
        const orVal = orRaw[od[od.length - 1]]?.value ?? 0;
        const orPrev = orRaw[od[od.length - 2]]?.value ?? orVal;
        const last12 = od.slice(-12).map((d) => orRaw[d]?.value ?? 0);
        const m = avg(last12);
        const cv = m ? (Math.sqrt(avg(last12.map((v) => (v - m) ** 2))) / m) * 100 : 0;

        // --- CIMENT ---
        const cd = sortedKeys(ciRaw.production).slice(-36);
        const cimentRows = cd.map((d) => ({
          date: d,
          production: ciRaw.production[d]?.value ?? 0,
          ventes_locales: ciRaw.ventes_locales[d]?.value ?? 0,
          exportations: ciRaw.exportations[d]?.value ?? 0,
        }));
        setCiment(cimentRows);
        const lc = cd[cd.length - 1];
        const cProd = ciRaw.production[lc]?.value ?? 0;
        const cProdPrev = ciRaw.production[cd[cd.length - 2]]?.value ?? cProd;
        const cOrient = cProd ? ((ciRaw.exportations[lc]?.value ?? 0) / cProd) * 100 : 0;

        // --- PÊCHE ---
        const pd = sortedKeys(peRaw.debarquements_industrielle).slice(-36);
        const pecheRows = pd.map((d) => ({
          date: d,
          industrielle: peRaw.debarquements_industrielle[d]?.value ?? 0,
          artisanale: peRaw.debarquements_artisanale[d]?.value ?? 0,
        }));
        setPeche(pecheRows);
        const lp = pecheRows[pecheRows.length - 1];
        const lpPrev = pecheRows[pecheRows.length - 2] || lp;
        const pTotal = lp.industrielle + lp.artisanale;
        const pTotalPrev = lpPrev.industrielle + lpPrev.artisanale;
        const artPart = pTotal ? (lp.artisanale / pTotal) * 100 : 0;
        const artPartPrev = pTotalPrev ? (lpPrev.artisanale / pTotalPrev) * 100 : artPart;

        setKpi({
          orVal, orMM: orPrev ? ((orVal - orPrev) / orPrev) * 100 : 0, orCV: cv,
          orSpark: orRows.slice(-13).map((r) => ({ date: r.date, value: r.or })),
          cProd, cProdMM: cProdPrev ? ((cProd - cProdPrev) / cProdPrev) * 100 : 0, cOrient,
          cProdSpark: cimentRows.slice(-13).map((r) => ({ date: r.date, value: r.production })),
          pTotal, pTotalMM: pTotalPrev ? ((pTotal - pTotalPrev) / pTotalPrev) * 100 : 0,
          pTotalSpark: pecheRows.slice(-13).map((r) => ({ date: r.date, value: r.industrielle + r.artisanale })),
          artPart, artPartDelta: artPart - artPartPrev,
          artSpark: pecheRows.slice(-13).map((r) => ({ date: r.date, value: (r.industrielle + r.artisanale) ? (r.artisanale / (r.industrielle + r.artisanale)) * 100 : 0 })),
        });
      } catch (e) {
        console.error("Production data error", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const gold = "var(--accent-gold)";
  const skeleton = <div className="h-[300px] rounded animate-pulse" style={{ background: "var(--border)" }} />;

  return (
    <div className="w-full">
      <div className="seo-dash-banner">
        <div>
          <span className="seo-kicker">Secteur réel · Janvier 2026</span>
          <h1 className="seo-dash-title">Production</h1>
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>Source · DPEE, TBO Janv. 2026</span>
      </div>

      <div className="flex flex-col gap-5">
        {/* SMALL MULTIPLES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiSparkCard icon={<Gem className="w-3 h-3" style={{ color: gold }} />} label="Or industriel" value={kpi.orVal} unit="kg" variation={kpi.orMM} series={kpi.orSpark} theme={theme} periodLabel="JANV. 25 → 26" />
          <KpiSparkCard icon={<Boxes className="w-3 h-3" style={{ color: gold }} />} label="Ciment · production" value={kpi.cProd} decimals={1} unit="kt" variation={kpi.cProdMM} series={kpi.cProdSpark} theme={theme} periodLabel="JANV. 25 → 26" />
          <KpiSparkCard icon={<Fish className="w-3 h-3" style={{ color: gold }} />} label="Pêche · débarquements" value={kpi.pTotal} unit="t" variation={kpi.pTotalMM} series={kpi.pTotalSpark} theme={theme} periodLabel="JANV. 25 → 26" />
          <KpiSparkCard icon={<PieChart className="w-3 h-3" style={{ color: gold }} />} label="Part de l'artisanal" value={kpi.artPart} decimals={1} unit="%" variation={kpi.artPartDelta} variationLabel="pts vs déc." series={kpi.artSpark} theme={theme} periodLabel="PART DÉBARQUEMENTS" />
        </div>

        {/* CIMENT — multi-line (non additif) */}
        <div className="seo-card flex flex-col">
          <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
                Le ciment produit part de plus en plus à l&apos;export
              </h3>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Production · ventes locales · exportations — kt, 36 mois</span>
            </div>
            <span className="seo-stat-pill">Orientation export · {kpi.cOrient.toFixed(0)}%</span>
          </div>
          {loading ? skeleton : (
            <AreaLineChart
              data={ciment}
              keys={[
                { key: "production", label: "Production", color: C_PROD },
                { key: "ventes_locales", label: "Ventes loc.", color: C_VENTES },
                { key: "exportations", label: "Export", color: C_EXPORT },
              ]}
              mode="line"
              theme={theme}
              height={320}
              unit="kt"
            />
          )}
          <div className="mt-auto pt-3 text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Source · DPEE, TBO Janv. 2026 — Secteur Secondaire
          </div>
        </div>

        {/* PÊCHE (stack) + OR (line) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="seo-card flex flex-col">
            <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
                  La pêche artisanale porte l&apos;essentiel des débarquements
                </h3>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Débarquements par type — tonnes, 36 mois</span>
              </div>
              <span className="seo-stat-pill">Artisanal · {kpi.artPart.toFixed(0)}%</span>
            </div>
            {loading ? skeleton : (
              <AreaLineChart
                data={peche}
                keys={[
                  { key: "artisanale", label: "Artisanale", color: C_ARTIS },
                  { key: "industrielle", label: "Industrielle", color: C_INDUS },
                ]}
                mode="stack"
                theme={theme}
                height={300}
                unit="t"
              />
            )}
            <div className="mt-auto pt-3 text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>Source · DPEE, TBO Janv. 2026 — Primaire</div>
          </div>

          <div className="seo-card flex flex-col">
            <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
                  L&apos;or, le poste le plus volatil de la production
                </h3>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Production aurifère — kg, 48 mois</span>
              </div>
              <span className="seo-stat-pill">Volatilité · {kpi.orCV.toFixed(0)}%</span>
            </div>
            {loading ? skeleton : (
              <AreaLineChart
                data={or}
                keys={[{ key: "or", label: "Or", color: C_PROD }]}
                mode="line"
                theme={theme}
                height={300}
                unit="kg"
              />
            )}
            <div className="mt-auto pt-3 text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>Source · DPEE, TBO Janv. 2026 — coeff. de variation sur 12 mois</div>
          </div>
        </div>
      </div>
    </div>
  );
}
