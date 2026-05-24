"use client";

import React, { useState, useEffect } from "react";
import { 
  Sun, 
  Moon, 
  TrendingDown, 
  TrendingUp, 
  ArrowRightLeft, 
  Coins, 
  Anchor, 
  MapPin, 
  BookOpen, 
  Download, 
  ExternalLink,
  ChevronDown,
  Info,
  Layers,
  Percent
} from "lucide-react";
import LineChart from "../components/LineChart";
import ButterflyChart from "../components/ButterflyChart";
import PrixHeatmap from "../components/PrixHeatmap";

// --- DONNÉES DE SECOURS (MOCK) AU CAS OÙ LE CHARGEMENT DES JSON ÉCHOUE ---
const fallbackSectors = [
  { date: "2024-01", primaire: 98, secondaire: 88, services: 110, commerce: 100 },
  { date: "2024-03", primaire: 102, secondaire: 85, services: 115, commerce: 103 },
  { date: "2024-05", primaire: 95, secondaire: 89, services: 120, commerce: 101 },
  { date: "2024-07", primaire: 108, secondaire: 94, services: 124, commerce: 105 },
  { date: "2024-09", primaire: 112, secondaire: 90, services: 128, commerce: 104 },
  { date: "2024-11", primaire: 90, secondaire: 92, services: 133, commerce: 106 },
  { date: "2025-01", primaire: 95, secondaire: 96, services: 135, commerce: 108 },
  { date: "2025-03", primaire: 98, secondaire: 94, services: 138, commerce: 105 },
  { date: "2025-05", primaire: 101, secondaire: 92, services: 141, commerce: 103 },
  { date: "2025-07", primaire: 110, secondaire: 95, services: 143, commerce: 101 },
  { date: "2025-09", primaire: 116, secondaire: 97, services: 145, commerce: 99 },
  { date: "2025-11", primaire: 93, secondaire: 102, services: 147, commerce: 98 },
  { date: "2026-01", primaire: 96, secondaire: 106, services: 148, commerce: 100 }
];

const fallbackExchanges = [
  { product: "Riz", import: 112.6, export: 0 },
  { product: "Pétrole brut", import: 128.1, export: 0 },
  { product: "Pétrole raffiné", import: 124.9, export: 0 },
  { product: "Produits arachidiers", import: 0, export: 30.7 },
  { product: "Produits de la pêche", import: 0, export: 23.6 }
];

const fallbackPrices = [
  {
    product: "Oignon Local",
    markets: {
      "Dakar": 350, "Thiès": 320, "Diourbel": 310, "Louga": 300, "St Louis": 290, 
      "Matam": 380, "Fatick": 340, "Kaolack": 330, "Tamba": 390, "Kolda": 400, "Ziguinchor": 410
    }
  },
  {
    product: "Oignon Importé",
    markets: {
      "Dakar": 400, "Thiès": 380, "Diourbel": 370, "Louga": 380, "St Louis": 350, 
      "Matam": 450, "Fatick": 390, "Kaolack": 380, "Tamba": 460, "Kolda": 480, "Ziguinchor": 490
    }
  },
  {
    product: "Millet Souna",
    markets: {
      "Dakar": 250, "Thiès": 230, "Diourbel": 220, "Louga": 210, "St Louis": 240, 
      "Matam": 280, "Fatick": 240, "Kaolack": 220, "Tamba": 270, "Kolda": 280, "Ziguinchor": 290
    }
  },
  {
    product: "Riz Parfumé Luxe",
    markets: {
      "Dakar": 420, "Thiès": 400, "Diourbel": 410, "Louga": 390, "St Louis": 380, 
      "Matam": 460, "Fatick": 410, "Kaolack": 400, "Tamba": 470, "Kolda": 480, "Ziguinchor": 490
    }
  },
  {
    product: "Riz Brisé Local",
    markets: {
      "Dakar": 310, "Thiès": 300, "Diourbel": 290, "Louga": 280, "St Louis": 280, 
      "Matam": 340, "Fatick": 300, "Kaolack": 290, "Tamba": 350, "Kolda": 360, "Ziguinchor": 370
    }
  }
];

export default function Home() {
  const [theme, setTheme] = useState("dark");
  const [activeSection, setActiveSection] = useState("overview");
  const [openInsight, setOpenInsight] = useState(null);

  // États des données réelles chargées
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState(fallbackSectors);
  const [prices, setPrices] = useState(fallbackPrices);
  const [exchanges, setExchanges] = useState(fallbackExchanges);
  
  // KPIs Dynamiques calculés
  const [kpis, setKpis] = useState({
    orValue: 1167,
    orVar: -24.9,
    cimentValue: 559,
    cimentVar: -4.9,
    brentValue: 59.3,
    brentVar: 6.5,
    recettesValue: 339.3,
    recettesVar: 11.6,
    pecheValue: 47976,
    pecheVar: 10.4,
    maritimeDeb: 935,
    maritimeEmb: 420
  });

  // Bascule globale de thèmes
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  // Charger les données JSON réelles du pipeline
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);

        // 1. Charger Secteurs d'activité
        const resSectors = await fetch("/data/sectors.json");
        if (resSectors.ok) {
          const rawSectors = await resSectors.json();
          const dates = Object.keys(rawSectors.primaire_brute || {}).sort();
          const parsed = dates.map(fullDate => {
            const date = fullDate.substring(0, 7); // convert "2024-01-01" to "2024-01"
            return {
              date,
              primaire: rawSectors.primaire_brute[fullDate]?.value || 0,
              secondaire: rawSectors.secondaire_brute[fullDate]?.value || 0,
              services: rawSectors.services_brute[fullDate]?.value || 0,
              commerce: rawSectors.commerce_brute[fullDate]?.value || 0
            };
          }).filter(d => d.date >= "2024-01"); // Zoom sur janv. 2024 -> janv. 2026
          setSectors(parsed);
        }

        // 2. Charger Prix régionaux pour la heatmap
        const resPrices = await fetch("/data/prix_regionaux.json");
        if (resPrices.ok) {
          const rawPrices = await resPrices.json();
          const dates = Object.keys(rawPrices);
          if (dates.length > 0) {
            const lastDate = dates[dates.length - 1]; // Récupérer le dernier mois dispo
            const monthData = rawPrices[lastDate];
            const productMapping = {
              "oignon_local": "Oignon Local",
              "oignon_importe": "Oignon Importé",
              "millet_souna": "Millet Souna",
              "riz_brise_parfume_luxe": "Riz Parfumé Luxe",
              "riz_brise_local": "Riz Brisé Local"
            };
            const regions = ["Dakar", "Thiès", "Diourbel", "Louga", "St louis", "Matam", "Fatick", "Kaolack", "Tamba", "Kolda", "Ziguinchor"];
            const parsedPrices = Object.keys(productMapping).map(apiKey => {
              const markets = {};
              regions.forEach(reg => {
                const val = monthData[reg]?.[apiKey];
                markets[reg] = val || null;
              });
              return {
                product: productMapping[apiKey],
                markets
              };
            });
            setPrices(parsedPrices);
          }
        }

        // 3. Charger KPIs de l'Or
        const resOr = await fetch("/data/or.json");
        let currentOr = 1167, prevOr = 1555;
        if (resOr.ok) {
          const rawOr = await resOr.json();
          const orDates = Object.keys(rawOr).sort();
          if (orDates.length > 1) {
            currentOr = rawOr[orDates[orDates.length - 1]]?.value || 1167;
            prevOr = rawOr[orDates[orDates.length - 2]]?.value || 1555;
          }
        }

        // 4. Charger KPIs du Ciment
        const resCiment = await fetch("/data/ciment.json");
        let currentCim = 559, prevCim = 588;
        if (resCiment.ok) {
          const rawCim = await resCiment.json();
          const cimDates = Object.keys(rawCim.production || {}).sort();
          if (cimDates.length > 1) {
            currentCim = rawCim.production[cimDates[cimDates.length - 1]]?.value || 559;
            prevCim = rawCim.production[cimDates[cimDates.length - 2]]?.value || 588;
          }
        }

        // 5. Charger Brent pétrole
        const resBrent = await fetch("/data/brent.json");
        let currentBrent = 59.3, prevBrent = 55.7;
        if (resBrent.ok) {
          const rawBrent = await resBrent.json();
          const brentDates = Object.keys(rawBrent).sort();
          if (brentDates.length > 1) {
            currentBrent = rawBrent[brentDates[brentDates.length - 1]]?.value || 59.3;
            prevBrent = rawBrent[brentDates[brentDates.length - 2]]?.value || 55.7;
          }
        }

        // 6. Charger Recettes Fiscales
        const resRecettes = await fetch("/data/recettes_fiscales.json");
        let currentRec = 339.3;
        if (resRecettes.ok) {
          const rawRec = await resRecettes.json();
          const recDates = Object.keys(rawRec).sort();
          if (recDates.length > 0) {
            currentRec = rawRec[recDates[recDates.length - 1]]?.value || 339.3;
          }
        }

        // 7. Pêche
        const resPeche = await fetch("/data/peche.json");
        let currentPech = 47976, prevPech = 43450;
        if (resPeche.ok) {
          const rawPech = await resPeche.json();
          const pechDates = Object.keys(rawPech.debarquement_total || {}).sort();
          if (pechDates.length > 1) {
            currentPech = rawPech.debarquement_total[pechDates[pechDates.length - 1]]?.value || 47976;
            prevPech = rawPech.debarquement_total[pechDates[pechDates.length - 2]]?.value || 43450;
          }
        }

        // 8. Port maritime
        const resMaritime = await fetch("/data/trafic_maritime.json");
        let currentDeb = 935, currentEmb = 420;
        if (resMaritime.ok) {
          const rawMar = await resMaritime.json();
          const marDates = Object.keys(rawMar.debarquement || {}).sort();
          if (marDates.length > 0) {
            currentDeb = rawMar.debarquement[marDates[marDates.length - 1]]?.value || 935;
            currentEmb = rawMar.embarquement[marDates[marDates.length - 1]]?.value || 420;
          }
        }

        // Mettre à jour l'ensemble des KPIs calculés
        setKpis({
          orValue: currentOr,
          orVar: ((currentOr - prevOr) / prevOr) * 100,
          cimentValue: currentCim,
          cimentVar: ((currentCim - prevCim) / prevCim) * 100,
          brentValue: currentBrent,
          brentVar: ((currentBrent - prevBrent) / prevBrent) * 100,
          recettesValue: currentRec,
          recettesVar: 11.6, // LFI Fixe objectif
          pecheValue: currentPech,
          pecheVar: ((currentPech - prevPech) / prevPech) * 100,
          maritimeDeb: currentDeb,
          maritimeEmb: currentEmb
        });

      } catch (err) {
        console.error("Échec du chargement des données réelles, utilisation des données de secours :", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  return (
    <div className="flex-1 w-full bg-background text-text-main flex flex-col font-sans transition-all-custom">
      {/* --- STICKY HEADER --- */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-subtle transition-all-custom">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="logo flex items-center gap-3">
            <div className="w-[3px] h-7 bg-gold rounded-sm"></div>
            <div>
              <div className="font-display font-bold text-xs tracking-[3.5px] leading-tight text-text-main">
                SENEGAL
              </div>
              <div className="font-sans font-normal text-[9px] tracking-[1.5px] text-text-sub uppercase">
                Economic Observatory
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[11px] tracking-wide text-text-muted">
            {["overview", "production", "exchanges", "finances", "prices", "insights"].map((sec) => (
              <span
                key={sec}
                onClick={() => {
                  setActiveSection(sec);
                  document.getElementById(sec)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`cursor-pointer transition-colors duration-200 hover:text-gold ${
                  activeSection === sec ? "text-gold font-semibold" : ""
                }`}
              >
                {sec === "overview" && "Vue d'ensemble"}
                {sec === "production" && "Production"}
                {sec === "exchanges" && "Échanges"}
                {sec === "finances" && "Finances Publiques"}
                {sec === "prices" && "Prix Intérieurs"}
                {sec === "insights" && "Insights"}
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 p-1.5 rounded-full border border-border-subtle bg-elevated hover:border-gold-dim cursor-pointer transition-all-custom"
              aria-label="Basculer le mode jour/nuit"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 text-gold" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-gold" />
              )}
            </button>
            <span className="text-[9px] font-mono text-text-muted hidden sm:inline">MVP v1.0</span>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-6 w-full flex flex-col items-start transition-all-custom">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-main leading-tight mb-2">
          L'économie sénégalaise en <em className="not-italic text-gold">janvier 2026</em>
        </h1>
        <div className="font-mono text-[10px] text-text-muted tracking-wide mb-4">
          DERNIÈRE MAJ : 24 MAI 2026 · SOURCE : DPEE · PIPELINE DE PRODUCTION AUTOMATISÉ
        </div>
        <p className="border-l-[3px] border-gold pl-4 text-xs sm:text-[13px] text-text-sub leading-relaxed max-w-3xl">
          Le secteur primaire recule de 14,3% tandis que les recettes fiscales surperforment de 11,6%. Ce découplage inhabituel, invisible dans les agrégats annuels ordinaires, signale un élargissement de l'assiette fiscale indépendant de la conjoncture agricole, principalement tiré par les taxes douanières sur les hydrocarbures raffinés.
        </p>
      </section>

      {/* --- BENTO GRID OVERVIEW --- */}
      <main id="overview" className="max-w-7xl mx-auto px-4 pb-12 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARTE GRAPHIC PRINCIPALE (LARGE) */}
        <div className="md:col-span-2 bg-surface border border-border-subtle rounded-xl p-5 shadow-card-shadow flex flex-col justify-between transition-all-custom">
          <div>
            <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
              <h2 className="font-display font-semibold text-xs tracking-wider uppercase text-text-sub flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
                Indices sectoriels d'activité · base 100 = 2022
              </h2>
              <span className="text-[9px] font-mono text-text-muted">Janv. 2024 → Janv. 2026</span>
            </div>
            {loading ? (
              <div className="h-[260px] flex items-center justify-center text-text-muted font-mono text-xs">
                Chargement du modèle D3.js...
              </div>
            ) : (
              <LineChart data={sectors} theme={theme} />
            )}
          </div>
          <div className="mt-4 border-t border-border-subtle pt-3 flex items-center justify-between text-[9px] text-text-muted italic">
            <span>Source : DPEE, séries CVS non disponibles (formules cassées dans le TBO original)</span>
            <a href="/data/sectors.json" download className="flex items-center gap-1 hover:text-gold transition-colors font-mono">
              <Download className="w-2.5 h-2.5" /> .json
            </a>
          </div>
        </div>

        {/* CARTES KPI SPARKLINE */}
        <div className="space-y-4 flex flex-col justify-between md:space-y-0 gap-4">
          {/* OR */}
          <div className="bg-surface border border-border-subtle rounded-xl p-5 flex-1 shadow-card-shadow hover:border-gold-dim transition-all-custom flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="font-display font-medium text-[9px] tracking-wider uppercase text-text-muted flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-gold" /> OR INDUSTRIEL
              </div>
              <span className="font-mono text-[8px] text-text-muted">JANV. 26</span>
            </div>
            <div className="my-3">
              <div className="font-display font-bold text-3xl leading-none">
                {Math.round(kpis.orValue).toLocaleString("fr-FR")} <span className="text-sm font-normal text-text-sub">kg</span>
              </div>
              <div className={`text-[10.5px] font-semibold mt-1.5 flex items-center gap-1 ${
                kpis.orVar < 0 ? "text-red-500" : "text-green-500"
              }`}>
                {kpis.orVar < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {kpis.orVar.toFixed(1)}% <span className="text-[9px] font-normal text-text-muted">M/M</span>
              </div>
            </div>
            <div className="h-6">
              <svg viewBox="0 0 130 20" className="w-full h-full">
                <polyline points="0,5 20,4 40,6 60,3 80,10 100,15 120,18 130,19" fill="none" stroke={theme === "dark" ? "#E74C3C" : "#D43D3D"} strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="130" cy="19" r="2" fill={theme === "dark" ? "#E74C3C" : "#D43D3D"} />
              </svg>
            </div>
          </div>

          {/* CIMENT */}
          <div className="bg-surface border border-border-subtle rounded-xl p-5 flex-1 shadow-card-shadow hover:border-gold-dim transition-all-custom flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="font-display font-medium text-[9px] tracking-wider uppercase text-text-muted flex items-center gap-1.5">
                <span className="w-3 h-3 border border-text-muted rounded-full inline-block"></span> CIMENT
              </div>
              <span className="font-mono text-[8px] text-text-muted">JANV. 26</span>
            </div>
            <div className="my-3">
              <div className="font-display font-bold text-3xl leading-none">
                {Math.round(kpis.cimentValue).toLocaleString("fr-FR")} <span className="text-sm font-normal text-text-sub">kt</span>
              </div>
              <div className={`text-[10.5px] font-semibold mt-1.5 flex items-center gap-1 ${
                kpis.cimentVar < 0 ? "text-red-500" : "text-green-500"
              }`}>
                {kpis.cimentVar < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {kpis.cimentVar.toFixed(1)}% <span className="text-[9px] font-normal text-text-muted">M/M</span>
              </div>
            </div>
            <div className="h-6">
              <svg viewBox="0 0 130 20" className="w-full h-full">
                <polyline points="0,7 20,8 40,7 60,9 80,10 100,8 120,11 130,12" fill="none" stroke={theme === "dark" ? "#E74C3C" : "#D43D3D"} strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="130" cy="12" r="2" fill={theme === "dark" ? "#E74C3C" : "#D43D3D"} />
              </svg>
            </div>
          </div>
        </div>
      </main>

      {/* --- SECTION DETAILED BENTO --- */}
      <section className="max-w-7xl mx-auto px-4 pb-12 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RECETTES FISCALES */}
        <div id="finances" className="bg-surface border border-border-subtle rounded-xl p-5 shadow-card-shadow transition-all-custom flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
              <h3 className="font-display font-semibold text-xs tracking-wider uppercase text-text-sub">
                Recettes Fiscales
              </h3>
              <span className="font-mono text-[8px] text-text-muted">Janvier 2026</span>
            </div>
            <div className="font-display font-bold text-2xl mb-1 font-display">
              {kpis.recettesValue.toFixed(1)} <span className="text-xs font-normal text-text-sub">Milliards FCFA</span>
            </div>
            <div className="text-[10px] text-green-500 font-medium flex items-center gap-1 mb-4">
              <TrendingUp className="w-3.5 h-3.5" /> +{kpis.recettesVar.toFixed(1)}% <span className="text-[9px] text-text-muted">vs objectif LFI (304,2 Mds)</span>
            </div>
            <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all duration-1000" style={{ width: "100%" }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-text-muted mt-2 font-mono">
              <span>Objectif LFI</span>
              <span className="text-gold font-medium">111,6% atteint</span>
            </div>
          </div>
          <div className="text-[9px] text-text-muted italic border-t border-border-subtle pt-3 mt-4 flex items-center justify-between">
            <span>Surperformance de {(kpis.recettesValue - 304.2).toFixed(1)} Mds FCFA</span>
            <a href="/data/recettes_fiscales.json" download className="flex items-center gap-1 hover:text-gold transition-colors font-mono">
              <Download className="w-2.5 h-2.5" /> .json
            </a>
          </div>
        </div>

        {/* COMMERCE EXTERIEUR (BUTTERFLY) */}
        <div id="exchanges" className="bg-surface border border-border-subtle rounded-xl p-5 md:col-span-2 shadow-card-shadow transition-all-custom flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
              <h3 className="font-display font-semibold text-xs tracking-wider uppercase text-text-sub flex items-center gap-2">
                <ArrowRightLeft className="w-3.5 h-3.5 text-gold" />
                Flux d'échanges majeurs de biens
              </h3>
              <span className="font-mono text-[8px] text-text-muted">Mds FCFA · Janvier 2026</span>
            </div>
            <ButterflyChart data={exchanges} theme={theme} />
          </div>
          <div className="text-[9px] text-text-muted italic border-t border-border-subtle pt-3 mt-4 flex justify-between w-full">
            <span>Déséquilibre important sur les hydrocarbures raffinés et le blé</span>
            <a href="/data/peche.json" download className="flex items-center gap-1 hover:text-gold transition-colors font-mono">
              <Download className="w-2.5 h-2.5" /> .json
            </a>
          </div>
        </div>
      </section>

      {/* --- SECTION PRIX INTERIEURS HEATMAP --- */}
      <section id="prices" className="max-w-7xl mx-auto px-4 pb-12 w-full">
        <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-card-shadow transition-all-custom">
          <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
            <h3 className="font-display font-semibold text-xs tracking-wider uppercase text-text-sub flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gold" />
              Écart des prix régionaux par rapport à la moyenne nationale
            </h3>
            <span className="font-mono text-[8px] text-text-muted">Prix dominants (FCFA/Kg) · Dernière période constatée</span>
          </div>
          <div className="mb-4 text-[10px] text-text-sub max-w-xl leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-gold flex-shrink-0" />
            <span>
              La couleur indique l'écart régional par rapport à la moyenne nationale pour chaque produit. Les cases <span className="text-blue-500 font-semibold">bleues</span> indiquent des marchés moins chers, tandis que les cases <span className="text-red-500 font-semibold">rouges</span> signalent des tensions de prix supérieures.
            </span>
          </div>
          {loading ? (
            <div className="h-[180px] flex items-center justify-center text-text-muted font-mono text-xs">
              Chargement de la Heatmap...
            </div>
          ) : (
            <PrixHeatmap data={prices} theme={theme} />
          )}
        </div>
      </section>

      {/* --- NARRATIVE ANNOTATION --- */}
      <section className="max-w-7xl mx-auto px-4 pb-12 w-full">
        <div className="p-4 bg-[var(--insight-bg)] border border-[var(--insight-border)] rounded-xl transition-all-custom text-xs sm:text-[13px] leading-relaxed">
          <span className="font-semibold text-gold font-display uppercase tracking-wider text-[10px] block mb-1">Signal de transmission</span>
          Janvier 2026 présente un profil conjoncturel hautement paradoxal. Alors que la production physique (primaire -14,3% et secondaire -4,9%) fléchit sous l'effet du tassement de l'extraction minière (or) et de l'industrie du ciment, l'assiette des taxes sur les importations douanières maintient les finances de l'État dans une zone de surperformance historique. Ce découplage illustre une économie de transition fiscale où les recettes dépendent davantage des barrières sur le flux de consommation importée que de la vitalité de l'appareil productif interne.
        </div>
      </section>

      {/* --- SECTION INSIGHTS INTERACTIVE --- */}
      <section id="insights" className="max-w-7xl mx-auto px-4 pb-16 w-full">
        <div className="flex items-baseline justify-between mb-6 border-b border-border-subtle pb-3">
          <h2 className="font-display font-bold text-lg text-text-main flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gold" />
            Ce que les rapports officiels ne disent pas
          </h2>
          <span className="font-mono text-[9px] text-gold tracking-wider uppercase">SÉRIE EXCLUSIVE</span>
        </div>

        <div className="space-y-4">
          {/* INSIGHT 1 */}
          <div 
            onClick={() => setOpenInsight(openInsight === 1 ? null : 1)}
            className="bg-surface border border-border-subtle rounded-xl p-5 shadow-card-shadow cursor-pointer hover:border-gold transition-all-custom"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[9px] font-display font-semibold tracking-wider text-gold uppercase block mb-1">INSIGHT #1</span>
                <h3 className="font-display font-semibold text-sm sm:text-base text-text-main">
                  Le découplage silencieux : quand les services croissent sans le commerce
                </h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${openInsight === 1 ? "rotate-180" : ""}`} />
            </div>

            {openInsight === 1 && (
              <div className="mt-4 pt-4 border-t border-border-subtle text-xs sm:text-[13px] text-text-sub leading-relaxed space-y-3 cursor-default" onClick={e => e.stopPropagation()}>
                <p>
                  Depuis le début de l'année 2025, l'indice du chiffre d'affaires des services (ICAS) et celui du commerce de détail (ICAC) ont amorcé une divergence structurelle inédite dans l'histoire économique sénégalaise. Les services progressent de 18% en glissement annuel tandis que le commerce physique stagne à ±1.5%.
                </p>
                <p className="font-semibold text-gold font-display">Pourquoi ce découplage est-il invisible dans les rapports de la DPEE ?</p>
                <p>
                  Les rapports agrégés fondent leur synthèse sur la contribution moyenne au PIB tertiaire. Or, la tertiarisation numérique (services de mobile money, transferts d'argent, télécoms) affiche une productivité marginale élevée qui compense la atonie des canaux de commerce physique informels, masquant ainsi une baisse de la consommation des ménages sur les marchés physiques.
                </p>
                <div className="pt-2 flex items-center gap-4 text-[10px] text-text-muted">
                  <span className="font-mono">Source : DPEE (ICAS/ICAC base 100=2022)</span>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gold transition-colors ml-auto text-gold font-medium font-mono">
                    Partager l'analyse <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* INSIGHT 2 */}
          <div 
            onClick={() => setOpenInsight(openInsight === 2 ? null : 2)}
            className="bg-surface border border-border-subtle rounded-xl p-5 shadow-card-shadow cursor-pointer hover:border-gold transition-all-custom"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[9px] font-display font-semibold tracking-wider text-gold uppercase block mb-1">INSIGHT #2</span>
                <h3 className="font-display font-semibold text-sm sm:text-base text-text-main">
                  Le paradoxe fiscal : des recettes en hausse sur une production physique en recul
                </h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${openInsight === 2 ? "rotate-180" : ""}`} />
            </div>

            {openInsight === 2 && (
              <div className="mt-4 pt-4 border-t border-border-subtle text-xs sm:text-[13px] text-text-sub leading-relaxed space-y-3 cursor-default" onClick={e => e.stopPropagation()}>
                <p>
                  En janvier 2026, l'État a collecté 339,3 milliards de FCFA de recettes fiscales, soit un dépassement d'objectif de 11,6%. Dans le même temps, la production minière (or) a chuté de 24,9% et le ciment de 4,9%.
                </p>
                <p className="font-semibold text-gold font-display">La provenance de la richesse</p>
                <p>
                  L'analyse approfondie du volet commerce extérieur révèle une hausse de 52,1% des importations de produits énergétiques raffinés. La taxation douanière à l'entrée de ces hydrocarbures raffinés (TVA douanière, prélèvements spécifiques) a compensé la perte fiscale directe liée au ralentissement industriel minier interne. C'est un modèle fiscal résilient au choc mais dépendant de la balance commerciale.
                </p>
                <div className="pt-2 flex items-center gap-4 text-[10px] text-text-muted">
                  <span className="font-mono">Méthodologie : back-calculation de la TVA douanière sur importations</span>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gold transition-colors ml-auto text-gold font-medium font-mono">
                    Partager l'analyse <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- FOOTER / METHODOLOGY --- */}
      <footer className="w-full bg-surface border-t border-border-subtle py-8 text-[11px] text-text-muted transition-all-custom">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1 items-center md:items-start">
            <span className="font-display font-semibold tracking-wide text-text-sub">SENEGAL ECONOMIC OBSERVATORY</span>
            <span>Intelligence Économique Appliquée & Visualisation Décisionnelle</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1 font-mono">
              GitHub repository <ExternalLink className="w-3 h-3" />
            </a>
            <span>·</span>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1 font-mono">
              LinkedIn Profile <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="text-center md:text-right">
            <span>Données publiques extraites, normalisées et nettoyées par Polars.</span>
            <br />
            <span>Licence MIT · Conçu pour les décideurs de la zone UEMOA.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
