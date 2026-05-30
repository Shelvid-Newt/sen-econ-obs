"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapPin, TrendingUp, TrendingDown, Activity, ArrowUpDown, Info } from "lucide-react";
import AreaLineChart from "../../../components/AreaLineChart.jsx";
import SenegalMap from "../../../components/SenegalMap.jsx";
import PrixHeatmap from "../../../components/PrixHeatmap.jsx";
import CountUp from "../../../components/CountUp.jsx";
import { useTheme } from "../../../components/ThemeProvider.jsx";

const PRODUCTS = [
  { key: "oignon_local", label: "Oignon local" },
  { key: "oignon_importe", label: "Oignon importé" },
  { key: "riz_brise_local", label: "Riz brisé local" },
  { key: "riz_brise_parfume_luxe", label: "Riz parfumé luxe" },
  { key: "millet_souna", label: "Millet souna" },
  { key: "mais", label: "Maïs" },
  { key: "sorgho", label: "Sorgho" },
];

const REGION_DISPLAY = { "St louis": "Saint-Louis", "Tamba": "Tambacounda" };
const pretty = (r) => REGION_DISPLAY[r] || r;
const avg = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);

export default function PrixPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [nat, setNat] = useState({});
  const [regMonth, setRegMonth] = useState(null);
  const [regData, setRegData] = useState({});
  const [regions, setRegions] = useState([]);
  const [product, setProduct] = useState("oignon_local");

  useEffect(() => {
    Promise.all([
      fetch("/data/prix_vivriers.json").then((r) => r.json()),
      fetch("/data/prix_regionaux.json").then((r) => r.json()),
    ])
      .then(([v, reg]) => {
        setNat(v);
        const months = Object.keys(reg); // chronological insertion order — last = dernier relevé
        const last = months[months.length - 1];
        setRegMonth(last);
        setRegData(reg[last] || {});
        setRegions(Object.keys(reg[last] || {}));
      })
      .catch((e) => console.error("prix data error", e))
      .finally(() => setLoading(false));
  }, []);

  const label = PRODUCTS.find((p) => p.key === product)?.label || product;

  // National monthly series (recent)
  const natSeries = useMemo(() => {
    const m = nat[product] || {};
    return Object.keys(m).sort().map((d) => ({ date: d, value: m[d]?.value }));
  }, [nat, product]);

  const natStats = useMemo(() => {
    const s = natSeries.filter((d) => typeof d.value === "number");
    if (!s.length) return { cur: 0, mm: 0, yoy: 0, cv: 0, min12: 0, max12: 0, monthLabel: "" };
    const cur = s[s.length - 1].value;
    const prev = s[s.length - 2]?.value ?? cur;
    const yearAgo = s[s.length - 13]?.value ?? cur;
    const last12 = s.slice(-12).map((d) => d.value);
    const m = avg(last12);
    const cv = m ? (Math.sqrt(avg(last12.map((v) => (v - m) ** 2))) / m) * 100 : 0;
    const dt = new Date(s[s.length - 1].date);
    return {
      cur, mm: prev ? ((cur - prev) / prev) * 100 : 0, yoy: yearAgo ? ((cur - yearAgo) / yearAgo) * 100 : 0,
      cv, min12: Math.min(...last12), max12: Math.max(...last12),
      monthLabel: isNaN(dt) ? "" : dt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    };
  }, [natSeries]);

  // Regional snapshot (historique 2019)
  const reg = useMemo(() => {
    const values = {};
    const arr = [];
    regions.forEach((r) => {
      const v = regData[r]?.[product];
      values[r] = v ?? null;
      if (v != null) arr.push(v);
    });
    return { values, mean: arr.length ? avg(arr) : 0 };
  }, [regions, regData, product]);

  const heatmap = useMemo(
    () => PRODUCTS.map((p) => {
      const markets = {};
      regions.forEach((r) => (markets[r] = regData[r]?.[p.key] ?? null));
      return { product: p.label, markets };
    }),
    [regions, regData]
  );

  const gold = "var(--accent-gold)";
  const skel = (h) => <div className={`rounded animate-pulse`} style={{ background: "var(--border)", height: h }} />;

  return (
    <div className="w-full">
      <div className="seo-dash-banner">
        <div>
          <span className="seo-kicker">Prix au consommateur · suivi national</span>
          <h1 className="seo-dash-title">Prix intérieurs</h1>
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>FCFA / kg · {natStats.monthLabel}</span>
      </div>

      {/* PRODUCT SELECTOR */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {PRODUCTS.map((p) => (
          <button key={p.key} className={`seo-range-btn ${product === p.key ? "active" : ""}`} onClick={() => setProduct(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {/* NATIONAL KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<MapPin className="w-3 h-3" style={{ color: gold }} />} label="Prix moyen national" value={natStats.cur} unit="FCFA/kg" variation={natStats.mm} variationLabel="M/M" />
          <StatCard icon={natStats.yoy >= 0 ? <TrendingUp className="w-3 h-3" style={{ color: "var(--data-negative)" }} /> : <TrendingDown className="w-3 h-3" style={{ color: "var(--data-positive)" }} />} label="Sur un an" value={natStats.yoy} decimals={1} unit="%" sub="glissement annuel" signed />
          <StatCard icon={<Activity className="w-3 h-3" style={{ color: gold }} />} label="Volatilité" value={natStats.cv} decimals={1} unit="%" sub="coeff. variation · 12 mois" highlight />
          <StatCard icon={<ArrowUpDown className="w-3 h-3" style={{ color: gold }} />} label="Amplitude 12 mois" value={natStats.max12 - natStats.min12} unit="FCFA" sub={`${Math.round(natStats.min12)} – ${Math.round(natStats.max12)} FCFA`} />
        </div>

        {/* NATIONAL TREND — figure principale */}
        <div className="seo-card flex flex-col">
          <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
                {label} — prix moyen national
              </h3>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>FCFA/kg · 60 derniers mois</span>
            </div>
            <span className="seo-stat-pill">Volatilité · {natStats.cv.toFixed(0)}%</span>
          </div>
          {loading ? skel(320) : (
            <AreaLineChart
              data={natSeries.slice(-60).map((d) => ({ date: d.date, p: d.value }))}
              keys={[{ key: "p", label, color: C_GOLD }]}
              mode="line"
              theme={theme}
              height={320}
              unit="FCFA"
            />
          )}
          <div className="mt-auto pt-3 text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Source · DPEE, TBO Janv. 2026 — Prix Intérieurs (moyenne nationale)
          </div>
        </div>

        {/* REGIONAL — dernier relevé disponible (historique) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>Dimension régionale</h2>
            <span className="seo-badge-muted">Dernier relevé disponible · {regMonth}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="seo-card flex flex-col">
              <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="font-display font-semibold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                  {label} — écart régional au prix moyen
                </h3>
                <span className="font-mono text-[8px]" style={{ color: "var(--text-muted)" }}>moy. {Math.round(reg.mean)} FCFA</span>
              </div>
              <div className="mb-3 text-[10px] leading-relaxed flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: gold }} />
                <span><span className="font-semibold" style={{ color: "var(--data-neutral)" }}>Bleu</span> = sous la moyenne, <span className="font-semibold" style={{ color: "var(--data-negative)" }}>rouge</span> = tension. La ventilation régionale n&apos;est plus publiée depuis 2019.</span>
              </div>
              {loading ? skel(320) : <SenegalMap regionalValues={reg.values} nationalMean={reg.mean} theme={theme} height={320} />}
            </div>

            <div className="seo-card flex flex-col">
              <div className="flex justify-between items-center gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: gold }} />
                  Matrice produits × marchés
                </h3>
                <span className="font-mono text-[8px]" style={{ color: "var(--text-muted)" }}>écart à la moy. produit</span>
              </div>
              {loading ? skel(240) : <PrixHeatmap data={heatmap} theme={theme} height={240} />}
              <div className="mt-auto pt-3 text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
                Source · DPEE, TBO — relevé {regMonth}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const C_GOLD = "#D4A843";

function StatCard({ icon, label, value, unit, decimals = 0, sub, variation, variationLabel = "M/M", signed, highlight }) {
  const showVar = typeof variation === "number";
  const down = variation < 0;
  return (
    <div className="seo-card" style={highlight ? { borderColor: "var(--accent-gold-dim)" } : undefined}>
      <div className="font-display font-medium text-[9px] tracking-wider uppercase flex items-center gap-1.5 mb-3" style={{ color: "var(--text-muted)" }}>
        {icon} {label}
      </div>
      <div className="font-display font-bold text-2xl sm:text-3xl leading-none break-words">
        {signed && value > 0 ? "+" : ""}<CountUp value={value} decimals={decimals} /> <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>{unit}</span>
      </div>
      {showVar && (
        <div className="text-[10.5px] font-semibold mt-1.5 flex items-center gap-1" style={{ color: down ? "var(--data-negative)" : "var(--data-positive)" }}>
          {variation > 0 ? "+" : ""}{variation.toFixed(1)}% <span className="text-[9px] font-normal" style={{ color: "var(--text-muted)" }}>{variationLabel}</span>
        </div>
      )}
      {sub && <div className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}
