import Link from "next/link";
import { ArrowRight, Code2, Mail } from "lucide-react";
import CursorGlow from "../components/CursorGlow.jsx";
import HeroLines from "../components/HeroLines.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function Cover() {
  return (
    <>
      <CursorGlow />
      <HeroLines />
      <ThemeToggle className="seo-cover-toggle" />
      <section className="seo-hero">
        <div className="seo-hero-logo">
          <div className="seo-hero-logo-bar" />
          <div className="text-left">
            <div className="font-display font-bold text-base tracking-[4px]" style={{ color: "var(--text-primary)" }}>SENEGAL</div>
            <div className="font-sans text-[10px] tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>Economic Observatory</div>
          </div>
        </div>

        <h1 className="seo-hero-title">
          Explorer l&apos;<em>économie sénégalaise</em>
        </h1>

        <p className="seo-hero-subtitle">
          Les données de conjoncture de la DPEE, restructurées pour le pilotage — indicateurs macro, production, échanges et prix, à jour chaque mois.
        </p>

        <Link href="/dashboard" className="seo-hero-cta">
          Ouvrir le tableau de bord
          <ArrowRight className="w-4 h-4" />
        </Link>

        <div className="seo-hero-meta">
          <span className="seo-hero-meta-dot" />
          <span>Dernière mise à jour · 24 mai 2026</span>
          <span style={{ color: "var(--border)" }}>·</span>
          <span>Source · DPEE, TBO Janvier 2026</span>
        </div>

        <div className="seo-hero-links">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <Code2 className="w-3.5 h-3.5" /> Code source
          </a>
          <span style={{ color: "var(--border)" }}>·</span>
          <a href="mailto:dngueajio@gmail.com">
            <Mail className="w-3.5 h-3.5" /> Contacter l&apos;auteur
          </a>
        </div>
      </section>
    </>
  );
}
