"use client";

import { useEffect, useState } from "react";

const fallbackSectors = [
  { date: "2024-01", primaire: 98, secondaire: 88, tertiaire: 110, commerce: 100 },
  { date: "2024-07", primaire: 108, secondaire: 94, tertiaire: 124, commerce: 105 },
  { date: "2025-01", primaire: 95, secondaire: 96, tertiaire: 135, commerce: 108 },
  { date: "2025-07", primaire: 110, secondaire: 95, tertiaire: 143, commerce: 101 },
  { date: "2026-01", primaire: 96, secondaire: 90, tertiaire: 148, commerce: 100 },
];

export const exchanges = [
  { product: "Riz", import: 112.6, export: 0 },
  { product: "Pétrole brut", import: 128.1, export: 0 },
  { product: "Pétrole raffiné", import: 124.9, export: 0 },
  { product: "Arachide", import: 0, export: 30.7 },
  { product: "Pêche", import: 0, export: 23.6 },
];

export const HEATMAP_PRODUCT_LABELS = {
  oignon_local: "Oignon Local",
  oignon_importe: "Oignon Importé",
  millet_souna: "Millet Souna",
  riz_brise_parfume_luxe: "Riz Parfumé Luxe",
  riz_brise_local: "Riz Brisé Local",
};

const tail = (obj, n = 13) => {
  const dates = Object.keys(obj || {}).sort();
  return dates.slice(-n).map((d) => ({ date: d, value: obj[d]?.value }));
};

// Single client-side data hook shared by all routes. Static JSON in /public is
// browser-cached, so calling this per page is cheap.
export default function useObservatoryData() {
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState(fallbackSectors);
  const [prices, setPrices] = useState([]);
  const [orSeries, setOrSeries] = useState([]);
  const [cimentSeries, setCimentSeries] = useState([]);
  const [brentSeries, setBrentSeries] = useState([]);
  const [recettesSeries, setRecettesSeries] = useState([]);
  const [eurUsdSeries, setEurUsdSeries] = useState([]);
  const [usdCfaSeries, setUsdCfaSeries] = useState([]);
  const [mapData, setMapData] = useState({ values: {}, mean: 0, product: "oignon_local" });
  const [kpis, setKpis] = useState({
    orValue: 925, orVar: -25,
    cimentValue: 916.7, cimentVar: -4.9,
    brentValue: 66.77, brentVar: 6.5,
    eurUsdValue: 1.1738, eurUsdVar: 0.2,
    usdCfaValue: 558.8, usdCfaVar: -0.2,
    recettesValue: 332.2, recettesVar: 11.3, recettesBase: 298.5,
    pecheValue: 47976, pecheVar: 10.4,
    maritimeDeb: 935, maritimeEmb: 420,
    transportAirMouvements: 2549, transportAirPassagers: 195624, transportFret: 3040,
  });

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const r1 = await fetch("/data/sectors.json");
        if (r1.ok) {
          const raw = await r1.json();
          const dates = Object.keys(raw.primaire_brute || {}).sort();
          const parsed = dates
            .map((fullDate) => ({
              date: fullDate.substring(0, 7),
              primaire: raw.primaire_brute?.[fullDate]?.value || 0,
              secondaire: raw.secondaire_brute?.[fullDate]?.value || 0,
              tertiaire: raw.tertiaire_brute?.[fullDate]?.value || 0,
              commerce: raw.commerce_brute?.[fullDate]?.value || 0,
            }))
            .filter((d) => d.date >= "2024-01");
          setSectors(parsed);
        }

        const r2 = await fetch("/data/prix_regionaux.json");
        if (r2.ok) {
          const raw = await r2.json();
          const dates = Object.keys(raw);
          if (dates.length > 0) {
            const last = dates[dates.length - 1];
            const monthData = raw[last];
            const regions = ["Dakar", "Thiès", "Diourbel", "Louga", "St louis", "Matam", "Fatick", "Kaolack", "Tamba", "Kolda", "Ziguinchor"];
            const parsedPrices = Object.entries(HEATMAP_PRODUCT_LABELS).map(([apiKey, label]) => {
              const markets = {};
              regions.forEach((reg) => {
                markets[reg] = monthData[reg]?.[apiKey] ?? null;
              });
              return { product: label, markets };
            });
            setPrices(parsedPrices);

            const product = "oignon_local";
            const values = {};
            const allPrices = [];
            regions.forEach((reg) => {
              const v = monthData[reg]?.[product];
              values[reg] = v ?? null;
              if (v != null) allPrices.push(v);
            });
            const mean = allPrices.length ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0;
            setMapData({ values, mean, product });
          }
        }

        // Or — variation M/M (cadran DPEE), valeur en kg
        const r3 = await fetch("/data/or.json");
        if (r3.ok) {
          const raw = await r3.json();
          setOrSeries(tail(raw, 13));
          const dates = Object.keys(raw).sort();
          const cur = raw[dates[dates.length - 1]]?.value || 925;
          const prev = raw[dates[dates.length - 2]]?.value || cur;
          setKpis((k) => ({ ...k, orValue: cur, orVar: ((cur - prev) / prev) * 100 }));
        }

        // Ciment — production en kt (le cadran DPEE suit la production). M/M.
        const r4 = await fetch("/data/ciment.json");
        if (r4.ok) {
          const raw = await r4.json();
          setCimentSeries(tail(raw.production, 13));
          const dates = Object.keys(raw.production || {}).sort();
          const cur = raw.production[dates[dates.length - 1]]?.value || 916.7;
          const prev = raw.production[dates[dates.length - 2]]?.value || cur;
          setKpis((k) => ({ ...k, cimentValue: cur, cimentVar: ((cur - prev) / prev) * 100 }));
        }

        const r5 = await fetch("/data/brent.json");
        if (r5.ok) {
          const raw = await r5.json();
          setBrentSeries(tail(raw, 13));
          const dates = Object.keys(raw).sort();
          const cur = raw[dates[dates.length - 1]]?.value || 66.77;
          const prev = raw[dates[dates.length - 2]]?.value || cur;
          setKpis((k) => ({ ...k, brentValue: cur, brentVar: ((cur - prev) / prev) * 100 }));
        }

        // Taux de change — EUR/USD et USD/CFA (M/M)
        const rc = await fetch("/data/change.json");
        if (rc.ok) {
          const raw = await rc.json();
          setEurUsdSeries(tail(raw.eur_usd, 13));
          setUsdCfaSeries(tail(raw.usd_cfa, 13));
          const ed = Object.keys(raw.eur_usd || {}).sort();
          const ec = raw.eur_usd[ed[ed.length - 1]]?.value || 1.1738;
          const ep = raw.eur_usd[ed[ed.length - 2]]?.value || ec;
          const ud = Object.keys(raw.usd_cfa || {}).sort();
          const uc = raw.usd_cfa[ud[ud.length - 1]]?.value || 558.8;
          const up = raw.usd_cfa[ud[ud.length - 2]]?.value || uc;
          setKpis((k) => ({
            ...k,
            eurUsdValue: ec, eurUsdVar: ((ec - ep) / ep) * 100,
            usdCfaValue: uc, usdCfaVar: ((uc - up) / up) * 100,
          }));
        }

        const r6 = await fetch("/data/recettes_fiscales.json");
        if (r6.ok) {
          const raw = await r6.json();
          setRecettesSeries(tail(raw, 13));
          const dates = Object.keys(raw).sort();
          const cur = raw[dates[dates.length - 1]]?.value || 332.2;
          const yearAgo = raw[dates[dates.length - 13]]?.value || cur;
          setKpis((k) => ({ ...k, recettesValue: cur, recettesVar: yearAgo ? ((cur - yearAgo) / yearAgo) * 100 : 0, recettesBase: yearAgo }));
        }

        const r7 = await fetch("/data/peche.json");
        if (r7.ok) {
          const raw = await r7.json();
          const dates = Object.keys(raw.debarquements_total || {}).sort();
          const cur = raw.debarquements_total[dates[dates.length - 1]]?.value || 47976;
          const prev = raw.debarquements_total[dates[dates.length - 2]]?.value || cur;
          setKpis((k) => ({ ...k, pecheValue: cur, pecheVar: ((cur - prev) / prev) * 100 }));
        }

        const r8 = await fetch("/data/trafic_maritime.json");
        if (r8.ok) {
          const raw = await r8.json();
          const dates = Object.keys(raw.debarquements_total || {}).sort();
          if (dates.length > 0) {
            const last = dates[dates.length - 1];
            setKpis((k) => ({
              ...k,
              maritimeDeb: raw.debarquements_total[last]?.value || 935,
              maritimeEmb: raw.embarquements_total?.[last]?.value || 420,
            }));
          }
        }
      } catch (err) {
        console.error("Data loading error, falling back to mock:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  return { loading, sectors, prices, exchanges, orSeries, cimentSeries, brentSeries, recettesSeries, eurUsdSeries, usdCfaSeries, mapData, kpis };
}
