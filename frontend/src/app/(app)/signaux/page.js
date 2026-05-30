"use client";

import React from "react";
import { Lock } from "lucide-react";

const TEASERS = [
  { n: "01", title: "Le découplage silencieux : services vs commerce", desc: "ICAS et ICAC divergent depuis 2025 — la tertiarisation numérique en question." },
  { n: "02", title: "Le paradoxe fiscal : production en berne, recettes en hausse", desc: "L'État encaisse plus alors que l'appareil productif ralentit." },
  { n: "03", title: "La dépendance énergétique en un cliché", desc: "Les hydrocarbures dominent la facture d'importation." },
];

export default function SignauxPage() {
  return (
    <div className="w-full">
      <div className="seo-dash-banner">
        <div>
          <span className="seo-kicker">Série analytique</span>
          <h1 className="seo-dash-title">Signaux économiques</h1>
        </div>
        <span className="seo-badge-muted">Série en préparation</span>
      </div>

      <div className="seo-card flex flex-col items-center text-center py-10 mb-5">
        <div className="seo-explore-icon mb-4" style={{ width: 48, height: 48 }}>
          <Lock className="w-5 h-5" style={{ color: "var(--accent-gold)" }} />
        </div>
        <h2 className="font-display font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>Bientôt disponible</h2>
        <p className="text-[13px] leading-relaxed max-w-xl" style={{ color: "var(--text-secondary)" }}>
          Une série d&apos;analyses approfondies — un signal, un graphique, une lecture. La forme éditoriale est en cours de définition.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TEASERS.map((t, i) => (
          <div key={t.n} className="seo-card relative overflow-hidden" style={{ opacity: 1 - i * 0.18, borderLeft: "3px solid var(--accent-gold-dim)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-bold text-2xl" style={{ color: "var(--accent-gold)", opacity: 0.25 }}>{t.n}</span>
              <Lock className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            </div>
            <h3 className="font-display font-semibold text-sm leading-snug mb-2" style={{ color: "var(--text-primary)" }}>{t.title}</h3>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
