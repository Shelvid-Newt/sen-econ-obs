"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  ArrowRightLeft,
  Landmark,
  Tags,
  Plane,
  Activity,
  Menu,
  Home,
  Code2,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Vue d'ensemble", Icon: LayoutDashboard },
  { href: "/production", label: "Production", Icon: Factory },
  { href: "/echanges", label: "Échanges", Icon: ArrowRightLeft },
  { href: "/finances", label: "Finances", Icon: Landmark },
  { href: "/prix", label: "Prix", Icon: Tags },
  { href: "/transport", label: "Transport", Icon: Plane },
];

function isActive(href, pathname) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = NAV.find((n) => isActive(n.href, pathname));

  return (
    <div className="seo-shell">
      <aside className={`seo-sidebar ${open ? "is-open" : ""}`}>
        <div className="seo-sidebar-top">
          <div className="seo-sidebar-brand">
            <div className="seo-hero-logo-bar" style={{ width: 4, height: 36 }} />
            <div>
              <div className="font-display font-bold text-[11px] tracking-[3px]" style={{ color: "var(--text-primary)" }}>SENEGAL</div>
              <div className="font-sans text-[8px] tracking-[1.5px] uppercase" style={{ color: "var(--text-secondary)" }}>Economic Observatory</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href="/" className="seo-icon-btn" aria-label="Accueil" title="Accueil" onClick={() => setOpen(false)}>
              <Home className="w-[18px] h-[18px]" />
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <div className="seo-sidebar-section">Navigation</div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`seo-side-link ${isActive(n.href, pathname) ? "active" : ""}`}
            >
              <n.Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 flex justify-end">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="seo-icon-btn" aria-label="Code source" title="Code source (GitHub)">
            <Code2 className="w-[18px] h-[18px]" />
          </a>
        </div>
      </aside>

      {open && <div className="seo-sidebar-backdrop" onClick={() => setOpen(false)} />}

      <div className="seo-content">
        <header className="seo-topbar">
          <button onClick={() => setOpen(true)} aria-label="Ouvrir le menu" className="seo-topbar-btn" type="button">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {current?.label || "Tableau de bord"}
          </span>
          <ThemeToggle />
        </header>

        <main className="seo-main">{children}</main>
      </div>
    </div>
  );
}
