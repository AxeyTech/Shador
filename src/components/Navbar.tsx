"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Shield, Activity, Menu, X, Terminal, ExternalLink, Cpu, Layers, History, Command, Monitor, ChevronDown } from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { useCrtHud } from "@/lib/crt/CrtContext";

const HistoryDrawer = dynamic(
  () => import("./HistoryDrawer").then((mod) => mod.HistoryDrawer),
  { ssr: false }
);

const CommandPalette = dynamic(
  () => import("./CommandPalette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

const FeaturesDropdown = dynamic(
  () => import("./FeaturesDropdown").then((mod) => mod.FeaturesDropdown),
  { ssr: false }
);

interface NavbarProps {
  onScanSample?: (domain: string) => void;
  activeReportId?: string | null;
  hasActiveScan?: boolean;
}

export function Navbar({ hasActiveScan = false, onScanSample }: NavbarProps) {
  const { playClick } = useTacticalAudio();
  const { isCrtEnabled, toggleCrt } = useCrtHud();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);

  const jumpToWorkspaceSection = useCallback((sectionId: string) => {
    playClick();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("shador:switch-tab", {
          detail: { sectionId },
        })
      );
      window.dispatchEvent(
        new CustomEvent("shadowtrace:switch-tab", {
          detail: { sectionId },
        })
      );
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId) || document.getElementById("scan-workspace");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [playClick]);

  // Global Ctrl+K / Cmd+K tactical shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/[0.08] bg-[#020308]/95 md:backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
      {/* Specular iridescent quad-spectrum hairline reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 via-white/50 via-rose-500/40 to-transparent pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo with Quantum Cybernetic Hover Experience */}
        <Link
          href="/"
          className="relative flex items-center gap-3.5 py-1.5 px-3 -ml-2 rounded-2xl group transition-colors duration-200 select-none hover:bg-white/[0.04] border border-transparent hover:border-cyan-500/25"
        >
          {/* Ambient Cyber Aura Bloom on Hover (Desktop pointer devices only) */}
          <div className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 w-14 h-14 bg-cyan-400/0 group-hover:bg-cyan-400/25 rounded-full pointer-events-none transition-colors duration-300" />

          {/* Logo Squircle with Precision Laser Sweep & Dual-Accent Border */}
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-xl border border-white/[0.14] p-[2px] bg-gradient-to-br from-[#0a1226] via-[#030612] to-[#1a050f] shadow-[0_4px_16px_rgba(0,0,0,0.8)] transition-all duration-300 ease-out group-hover:border-cyan-400/80">
            <Image
              src="/shador-oni-logo.jpg"
              alt="SHADOR Cyber Monogram Crest"
              width={44}
              height={44}
              sizes="44px"
              priority
              className="h-full w-full object-cover rounded-[8px] transition-transform duration-300 group-hover:scale-105"
            />

            {/* Dynamic 45-degree Optical Laser Sheen */}
            <div className="hidden md:block absolute inset-0 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-cyan-300/40 via-white/60 to-transparent group-hover:translate-x-[150%] transition-transform duration-700 ease-out pointer-events-none" />
          </div>

          {/* Brand Typography Stack */}
          <div className="flex flex-col relative justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-[20px] font-black tracking-[0.08em] font-mono text-white transition-colors duration-200 group-hover:text-cyan-200">
                SHADOR
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] opacity-85" />
            </div>

            {/* Razor-sharp Laser Hairline (Cyan to White to Crimson) */}
            <div className="h-[1.5px] w-0 group-hover:w-full bg-gradient-to-r from-cyan-400 via-white via-50% to-rose-500 transition-all duration-300 ease-out rounded-full my-0.5" />

            <span className="text-[9px] sm:text-[9.5px] font-mono font-bold tracking-[0.22em] text-slate-400 uppercase hidden sm:block transition-colors duration-200 group-hover:text-cyan-300/95">
              Attack Surface &amp; OSINT Engine
            </span>
          </div>
        </Link>

        {/* Desktop Navigation & Actions */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-6 font-mono text-xs text-slate-300 font-medium">
            {/* Attractive High-Tech Features Dropdown Navigator */}
            <div className="relative">
              <button
                onClick={() => {
                  playClick();
                  setFeaturesDropdownOpen((prev) => !prev);
                }}
                className={`hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-xl font-mono text-xs font-semibold ${
                  featuresDropdownOpen
                    ? "text-cyan-300 bg-cyan-500/15 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    : "text-slate-300 hover:bg-white/[0.04]"
                }`}
                title="Browse & Teleport to Platform Features"
                aria-expanded={featuresDropdownOpen}
              >
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                <span>Features</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${
                    featuresDropdownOpen ? "rotate-180 text-cyan-400" : "text-slate-400"
                  }`}
                />
              </button>
            </div>

            {hasActiveScan ? (
              <>
                <button
                  type="button"
                  onClick={() => jumpToWorkspaceSection("topology")}
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  Topology
                </button>
                <button
                  type="button"
                  onClick={() => jumpToWorkspaceSection("posture")}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                  Posture
                </button>
                <button
                  type="button"
                  onClick={() => jumpToWorkspaceSection("remediation")}
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                  Remediation
                </button>
              </>
            ) : (
              <>
                <a href="#architecture" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                  Architecture
                </a>
                <a href="#scanner" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-amber-400" />
                  Audit Scanner
                </a>
              </>
            )}
          </nav>

          {/* Tactical Command Palette Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white hover:border-cyan-400/50 hover:bg-cyan-500/10 active:scale-95 transition-all shadow-sm group"
            title="Open Command Palette (Ctrl+K)"
          >
            <Command className="h-3.5 w-3.5 text-cyan-400 group-hover:rotate-12 transition-transform duration-200" />
            <span className="hidden lg:inline text-slate-300">Command</span>
            <kbd className="inline-flex items-center gap-0.5 rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-slate-400 font-sans border border-white/[0.1]">
              <span>⌘</span>K
            </kbd>
          </button>

          {/* Audit History Trigger Button */}
          <button
            onClick={() => {
              playClick();
              setHistoryDrawerOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white hover:border-cyan-400/50 hover:bg-cyan-500/10 active:scale-95 transition-all shadow-sm"
          >
            <History className="h-3.5 w-3.5 text-cyan-400" />
            <span>Audit History</span>
          </button>

          {/* Black-Ops CRT HUD Toggle */}
          <button
            onClick={() => {
              playClick();
              toggleCrt();
            }}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-mono font-medium active:scale-95 transition-all shadow-sm ${
              isCrtEnabled
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "border-white/[0.1] bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:border-white/[0.2]"
            }`}
            title={isCrtEnabled ? "Disable Black-Ops CRT Scanline Filter" : "Enable Black-Ops CRT Scanline Filter"}
          >
            <Monitor className={`h-3.5 w-3.5 ${isCrtEnabled ? "text-emerald-400" : "text-slate-400"}`} />
            <span className="hidden xl:inline">{isCrtEnabled ? "CRT: ON" : "CRT: OFF"}</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center shrink-0 ml-auto">
          <button
            onClick={() => {
              playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.15] bg-[#0c1020] text-slate-200 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-colors cursor-pointer active:scale-95 shadow-md"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-cyan-400" /> : <Menu className="h-5 w-5 text-slate-200" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Menu - 100% Solid & Opaque with Touch-Fluid Scroll */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-b border-white/[0.12] px-4 py-4 animate-in slide-in-from-top-2 shadow-2xl max-h-[calc(100dvh-4.25rem)] overflow-y-auto overscroll-contain"
          style={{ backgroundColor: "#060813", opacity: 1 }}
        >
          <nav className="flex flex-col gap-2.5 font-mono text-xs font-medium text-slate-300">
            <button
              type="button"
              onClick={() => {
                playClick();
                setMobileMenuOpen(false);
                setFeaturesDropdownOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span>Platform Features Matrix (24+)</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                OPEN
              </span>
            </button>

            {hasActiveScan ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    jumpToWorkspaceSection("topology");
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] hover:text-cyan-300 transition-colors text-left"
                >
                  <Activity className="h-4 w-4 text-cyan-400" />
                  Interactive Topology
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    jumpToWorkspaceSection("posture");
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] hover:text-amber-300 transition-colors text-left"
                >
                  <Shield className="h-4 w-4 text-amber-400" />
                  Attack Surface Posture
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    jumpToWorkspaceSection("remediation");
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] hover:text-emerald-300 transition-colors text-left"
                >
                  <ExternalLink className="h-4 w-4 text-emerald-400" />
                  Threat Remediation Scripts
                </button>
              </>
            ) : (
              <>
                <a
                  href="#architecture"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] hover:text-cyan-300 transition-colors"
                >
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  Engine Architecture
                </a>
                <a
                  href="#scanner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] hover:text-amber-300 transition-colors"
                >
                  <Terminal className="h-4 w-4 text-amber-400" />
                  Audit Scanner
                </a>
              </>
            )}

            {/* Mobile Command Palette Trigger */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setCommandPaletteOpen(true);
              }}
              className="flex items-center justify-between p-2 rounded-lg text-xs font-mono text-cyan-300 hover:bg-cyan-500/10 transition-colors border-t border-white/[0.08] mt-2 pt-3"
            >
              <div className="flex items-center gap-2.5">
                <Command className="h-4 w-4 text-cyan-400" />
                <span>Command HUD</span>
              </div>
              <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[9px] text-slate-400">Ctrl+K</kbd>
            </button>

            {/* Mobile History Trigger */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setHistoryDrawerOpen(true);
              }}
              className="flex items-center gap-2.5 p-2 rounded-lg text-xs font-mono text-cyan-300 hover:bg-cyan-500/10 transition-colors"
            >
              <History className="h-4 w-4 text-cyan-400" />
              <span>Audit History</span>
            </button>

            {/* Mobile CRT HUD Toggle */}
            <button
              onClick={() => {
                playClick();
                toggleCrt();
              }}
              className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-colors ${
                isCrtEnabled
                  ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30"
                  : "text-slate-400 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Monitor className={`h-4 w-4 ${isCrtEnabled ? "text-emerald-400" : "text-slate-400"}`} />
                <span>Black-Ops CRT Filter</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isCrtEnabled
                  ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                  : "border-white/[0.1] text-slate-500"
              }`}>
                {isCrtEnabled ? "ACTIVE" : "OFF"}
              </span>
            </button>
          </nav>
        </div>
      )}

      {/* Conditionally Lazy-Loaded Modals & Drawers */}
      {historyDrawerOpen && (
        <HistoryDrawer isOpen={historyDrawerOpen} onClose={() => setHistoryDrawerOpen(false)} />
      )}

      {commandPaletteOpen && (
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onOpenHistory={() => setHistoryDrawerOpen(true)}
          onScanSample={onScanSample}
        />
      )}

      {featuresDropdownOpen && (
        <FeaturesDropdown
          isOpen={featuresDropdownOpen}
          onClose={() => setFeaturesDropdownOpen(false)}
          hasActiveScan={hasActiveScan}
        />
      )}
    </header>
    {/* Precision Flow Spacer to Prevent Any Hero Overlap */}
    <div className="h-16 w-full shrink-0 pointer-events-none" aria-hidden="true" />
  </>
  );
}
