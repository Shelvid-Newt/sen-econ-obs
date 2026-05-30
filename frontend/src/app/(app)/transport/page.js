"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Anchor, Ship, Boxes, Activity, Plane, Users, Package, Gauge } from "lucide-react";
import AreaLineChart from "../../../components/AreaLineChart.jsx";
import StatCard from "../../../components/StatCard.jsx";
import { useTheme } from "../../../components/ThemeProvider.jsx";

const C_DEB = "#5B8DEF";
const C_EMB = "#45B7AA";

const mm = (m, k) => { const a = m[k[k.length - 1]]?.value ?? 0; const b = m[k[k.length - 2]]?.value ?? a; return b ? ((a - b) / b) * 100 : 0; };

export default function TransportPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [mar, setMar] = useState(null);
  const [air, setAir] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/trafic_maritime.json").then((r) => r.json()),
      fetch("/data/transport_aerien.json").then((r) => r.json()),
    ]).then(([m, a]) => { setMar(m); setAir(a); }).catch((e) => console.error(e)).finally(() => setLoading(false));
  }, []);

  const M = useMemo(() => {
    if (!mar) return null;
    const ks = Object.keys(mar.debarquements_total).sort();
    const last = ks[ks.length - 1];
    const deb = mar.debarquements_total[last]?.value ?? 0;
    const emb = mar.embarquements_total[last]?.value ?? 0;
    return {
      deb, debMM: mm(mar.debarquements_total, ks), emb, embMM: mm(mar.embarquements_total, ks),
      total: deb + emb, solde: deb - emb, ratio: emb ? deb / emb : 0,
      rows: ks.slice(-48).map((d) => ({ date: d, deb: mar.debarquements_total[d]?.value ?? 0, emb: mar.embarquements_total[d]?.value ?? 0 })),
    };
  }, [mar]);

  const A = useMemo(() => {
    if (!air) return null;
    const ks = Object.keys(air.mouvements).sort();
    const last = ks[ks.length - 1];
    const mvt = air.mouvements[last]?.value ?? 0;
    const pax = air.passagers[last]?.value ?? 0;
    const fret = air.fret[last]?.value ?? 0;
    return {
      mvt, mvtMM: mm(air.mouvements, ks), pax, paxMM: mm(air.passagers, ks), fret, fretMM: mm(air.fret, ks),
      load: mvt ? pax / mvt : 0,
      paxRows: ks.slice(-48).map((d) => ({ date: d, p: air.passagers[d]?.value ?? 0 })),
    };
  }, [air]);

  const gold = "var(--accent-gold)";
  const skel = (h) => <div className="rounded animate-pulse" style={{ background: "var(--border)", height: h }} />;
  const SubHead = ({ icon, title, note }) => (
    <div className="flex items-baseline justify-between mb-4 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
      <h2 className="font-display font-bold text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>{icon} {title}</h2>
      <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{note}</span>
    </div>
  );

  return (
    <div className="w-full">
      <div className="seo-dash-banner">
        <div>
          <span className="seo-kicker">Trafic · Janvier 2026</span>
          <h1 className="seo-dash-title">Transport</h1>
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>Aéroport AIBD · Port de Dakar</span>
      </div>

      <div className="flex flex-col gap-8">
        {/* MARITIME */}
        <section>
          <SubHead icon={<Anchor className="w-4 h-4" style={{ color: gold }} />} title="Trafic maritime" note="1000 tonnes" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard icon={<Anchor className="w-3 h-3" style={{ color: gold }} />} label="Débarquements" value={M?.deb || 0} unit="kt" variation={M?.debMM} />
            <StatCard icon={<Ship className="w-3 h-3" style={{ color: gold }} />} label="Embarquements" value={M?.emb || 0} unit="kt" variation={M?.embMM} />
            <StatCard icon={<Boxes className="w-3 h-3" style={{ color: gold }} />} label="Trafic total" value={M?.total || 0} unit="kt" />
            <StatCard icon={<Activity className="w-3 h-3" style={{ color: gold }} />} label="Solde (déb. − emb.)" value={M?.solde || 0} unit="kt" sub={`${(M?.ratio || 0).toFixed(1)}× plus débarqué`} highlight />
          </div>
          <div className="seo-card flex flex-col">
            <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>Trafic maritime : Débarquements vs Embarquements</h3>
              <span className="seo-stat-pill">Ratio · {(M?.ratio || 0).toFixed(1)}×</span>
            </div>
            {loading || !M ? skel(300) : (
              <AreaLineChart data={M.rows} keys={[{ key: "deb", label: "Débarquements", color: C_DEB }, { key: "emb", label: "Embarquements", color: C_EMB }]} mode="line" theme={theme} height={300} unit="kt" />
            )}
          </div>
        </section>

        {/* AÉRIEN */}
        <section>
          <SubHead icon={<Plane className="w-4 h-4" style={{ color: gold }} />} title="Trafic aérien" note="Aéroport Blaise-Diagne" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard icon={<Plane className="w-3 h-3" style={{ color: gold }} />} label="Mouvements d'aéronefs" value={A?.mvt || 0} unit="" variation={A?.mvtMM} />
            <StatCard icon={<Users className="w-3 h-3" style={{ color: gold }} />} label="Passagers" value={A?.pax || 0} unit="" variation={A?.paxMM} />
            <StatCard icon={<Package className="w-3 h-3" style={{ color: gold }} />} label="Fret" value={A?.fret || 0} unit="t" variation={A?.fretMM} />
            <StatCard icon={<Gauge className="w-3 h-3" style={{ color: gold }} />} label="Passagers / mouvement" value={A?.load || 0} unit="" sub="remplissage moyen (proxy)" highlight />
          </div>
          <div className="seo-card flex flex-col">
            <div className="flex justify-between items-start gap-3 flex-wrap pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="font-display font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>Fréquentation passagers de l&apos;aéroport</h3>
              <span className="seo-stat-pill">{Math.round(A?.load || 0)} pax / vol</span>
            </div>
            {loading || !A ? skel(300) : (
              <AreaLineChart data={A.paxRows} keys={[{ key: "p", label: "Passagers", color: "#D4A843" }]} mode="line" theme={theme} height={300} />
            )}
            <div className="mt-auto pt-3 text-[9px] italic" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>Source · DPEE, TBO Janv. 2026 — Transport</div>
          </div>
        </section>
      </div>
    </div>
  );
}
