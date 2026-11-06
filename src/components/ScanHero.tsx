"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Loader2, ArrowRight, ShieldAlert, AlertCircle, Globe, Flame, Lock, Terminal, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { DiagnosticTerminal } from "./DiagnosticTerminal";
import type { DiagnosticLog } from "@/lib/types/scanner";

interface ScanHeroProps {
  onScan: (domain: string) => void;
  isScanning: boolean;
  logs: DiagnosticLog[];
  errorMessage: string | null;
  hasActiveScan?: boolean;
  activeDomain?: string;
  onResetScan?: () => void;
}

const SAMPLE_DOMAINS = [
  { domain: "hackerone.com", badge: "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:border-rose-400 hover:bg-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]", icon: Globe },
  { domain: "cloudflare.com", badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]", icon: Flame },
  { domain: "tesla.com", badge: "border-white/30 bg-white/10 text-white hover:border-white/60 hover:bg-white/20 shadow-[0_0_12px_rgba(255,255,255,0.1)]", icon: Lock },
];

export function ScanHero({
  onScan,
  isScanning,
  logs,
  errorMessage,
  hasActiveScan = false,
  activeDomain,
  onResetScan,
}: ScanHeroProps) {
  const { playClick, playPing, triggerHaptic } = useTacticalAudio();
  const [domainInput, setDomainInput] = useState("");
  const [inputWarning, setInputWarning] = useState<string | null>(null);
  const [isSurging, setIsSurging] = useState(false);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });
  const [showCompactLogs, setShowCompactLogs] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isScanning) {
      setShowCompactLogs(false);
    }
  }, [isScanning]);

  const handleTitleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setClickPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    triggerHaptic("heavy");
    playPing();
    setIsSurging(true);
    setTimeout(() => setIsSurging(false), 700);
  };

  const validateInputRealtime = (val: string) => {
    const clean = val.trim().toLowerCase();
    if (!clean) {
      setInputWarning(null);
      return;
    }

    // SSRF / Private subnet quick detection
    if (
      clean.includes("127.0.0.1") ||
      clean.includes("localhost") ||
      clean.startsWith("192.168.") ||
      clean.startsWith("10.") ||
      clean.startsWith("172.16.") ||
      clean.includes("169.254.169.254") ||
      clean.includes("::1") ||
      clean.startsWith("fe80:")
    ) {
      setInputWarning("SSRF Safety Guard: Local/private addresses are strictly prohibited.");
      return;
    }

    // Octal/Hex IP evasion checks
    if (/^0x[0-9a-f]+/i.test(clean) || /^0[0-7]+/.test(clean)) {
      setInputWarning("SSRF Safety Guard: Hex/Octal IP encoding detected.");
      return;
    }

    setInputWarning(null);
  };

  const handleInputChange = (val: string) => {
    setDomainInput(val);
    validateInputRealtime(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim() || isScanning) return;
    triggerHaptic("heavy");
    playClick();
    onScan(domainInput.trim());
  };

  const handleSampleClick = (sample: string) => {
    triggerHaptic("light");
    playClick();
    setDomainInput(sample);
    setInputWarning(null);
    onScan(sample);
  };

  // Compact Active Target Command Strip when results are rendered (eliminates 600px+ scroll overhead on phones)
  if (hasActiveScan && !isScanning) {
    return (
      <section id="scanner" className="relative w-full pt-3 pb-1 border-b border-white/[0.06] bg-[#03050c]/95">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Active Target Status + Re-scan Input */}
            <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 min-w-0">
              <div className="hidden sm:flex items-center gap-2 shrink-0 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  {activeDomain || "ACTIVE TARGET"}
                </span>
              </div>

              <div className="flex-1 flex items-center rounded-xl border border-white/[0.12] bg-[#070a14] px-2.5 py-1 focus-within:border-cyan-400/60 transition-colors min-w-0">
                <Search className="h-4 w-4 text-cyan-400 shrink-0 mr-2" />
                <input
                  ref={inputRef}
                  type="text"
                  value={domainInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={activeDomain ? `Switch target (current: ${activeDomain})...` : "Enter new domain..."}
                  disabled={isScanning}
                  className="w-full bg-transparent py-1.5 text-xs sm:text-sm font-mono text-white placeholder-slate-400 focus:outline-none min-w-0"
                />
                <button
                  type="submit"
                  disabled={isScanning || !domainInput.trim() || Boolean(inputWarning)}
                  className="ml-1.5 shrink-0 flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-rose-600 px-3 py-1.5 text-[11px] font-mono font-bold uppercase text-white disabled:opacity-40 active:scale-95 transition-opacity"
                >
                  <span>Scan</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            {/* Quick Visor Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowCompactLogs((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-mono font-semibold transition-colors ${
                  showCompactLogs
                    ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                    : "border-white/[0.1] bg-[#0a0f1c] text-slate-300 hover:text-white"
                }`}
              >
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                <span>Sensor Logs ({logs.length})</span>
                {showCompactLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {onResetScan && (
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    onResetScan();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#0a0f1c] px-3 py-1.5 text-[11px] font-mono font-semibold text-slate-200 hover:text-white hover:border-cyan-500/40 active:scale-95 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                  <span>New Audit</span>
                </button>
              )}
            </div>
          </div>

          {inputWarning && (
            <div className="flex items-center gap-2 text-xs font-mono text-rose-300 bg-rose-500/15 border border-rose-500/40 rounded-xl p-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{inputWarning}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 p-2.5 text-xs text-rose-300 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {showCompactLogs && (
            <div className="pb-3">
              <DiagnosticTerminal logs={logs} isScanning={isScanning} />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="scanner" className="relative w-full pt-8 pb-10 sm:pt-16 sm:pb-20 overflow-hidden">
      {/* Zero-Filter Volumetric Radial Beams (0ms Mobile Blur Cost) */}
      <div
        className="hidden sm:block absolute top-0 right-1/4 w-[700px] h-[360px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(6,182,212,0.14), rgba(37,99,235,0.06) 55%, transparent)" }}
      />
      <div
        className="hidden sm:block absolute top-1/4 -left-32 w-[500px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(225,29,72,0.12), transparent)" }}
      />
      <div
        className="hidden sm:block absolute top-1/3 -right-32 w-[480px] h-[360px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(37,99,235,0.10), transparent)" }}
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-7">
        {/* Hero Title - Pure, Pristine, Rock-Solid Stable (Zero Hover Shift across All Devices) */}
        <div
          onClick={handleTitleClick}
          className="relative select-none py-2 px-4 rounded-3xl"
        >
          {/* Quantum Shockwave Ripple on Click */}
          {isSurging && (
            <>
              <div
                className="absolute pointer-events-none rounded-full border-2 border-cyan-400 shadow-[0_0_30px_#00f0ff] animate-ping"
                style={{
                  left: clickPos.x - 40,
                  top: clickPos.y - 40,
                  width: 80,
                  height: 80,
                  animationDuration: "500ms",
                }}
              />
              <div
                className="absolute pointer-events-none rounded-full border border-rose-500 shadow-[0_0_40px_#ff003b] animate-ping"
                style={{
                  left: clickPos.x - 70,
                  top: clickPos.y - 70,
                  width: 140,
                  height: 140,
                  animationDuration: "700ms",
                }}
              />
            </>
          )}

          {/* Main Pristine Heading Stack - 100% Solid & Static Across All Devices */}
          <div className="relative flex items-center justify-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight leading-[1.14]">
              {/* Line 1: Pure Brilliant Platinum White */}
              <span className="block text-white">
                Attack Surface &amp; OSINT
              </span>

              {/* Line 2: Balanced Dual-Tone Gradient (Cyan to Crimson) */}
              <span className="relative inline-block mt-1 sm:mt-2 bg-gradient-to-r from-cyan-400 via-white via-50% to-rose-400 bg-clip-text text-transparent">
                Reconnaissance Engine
              </span>
            </h1>
          </div>

          {/* Static Anchored Razor-Sharp Laser Hairline Underline (Cyan -> White -> Crimson) */}
          <div
            className="h-[2px] w-36 sm:w-56 mx-auto bg-gradient-to-r from-transparent via-cyan-400 via-white via-50% via-rose-500 to-transparent rounded-full shadow-[0_0_12px_#00e5ff] mt-4 select-none pointer-events-none"
          />
        </div>

        {/* Subtitle with High-Contrast Crisp Typography */}
        <p className="mx-auto max-w-2xl text-xs sm:text-sm md:text-base text-slate-300 font-sans leading-relaxed">
          Autonomous zero-intrusion perimeter mapping. Discover dangling cloud takeovers, audit email spoofability (SPF/DMARC), inspect TLS cryptographic posture, and synthesize defensive hardening policies.
        </p>

        {/* Search Ingestion Bar with High-Precision Predator Perimeter */}
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl mt-5 space-y-3">
          {/* Predator Status Visor Bar */}
          <div className="flex items-center justify-between px-2 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 uppercase tracking-widest font-bold">DAEMON RECON VISOR: ARMED</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <span className="text-rose-400 font-bold">100% PASSIVE</span>
              <span>• ZERO FOOTPRINT</span>
            </div>
          </div>

          <div
            className={`relative transition-colors duration-200 ${
              inputWarning
                ? "rounded-2xl border-2 border-rose-500 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.35)] p-1.5"
                : "halo-glow-border"
            }`}
          >
            {/* Tactical Predator Corner Reticle Markers */}
            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none z-10" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-rose-500 pointer-events-none z-10" />
            <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none z-10" />
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-rose-500 pointer-events-none z-10" />

            <div className={`flex items-center p-1.5 sm:p-2.5 ${!inputWarning ? "halo-glow-border-inner" : ""}`}>
              <div className="pl-3.5 pr-2.5 text-cyan-400">
                <Search className="h-5 w-5 text-cyan-400" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={domainInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter target domain (e.g. target.com)..."
                disabled={isScanning}
                className="w-full bg-transparent px-2 py-2 text-xs sm:text-sm md:text-base font-mono text-white placeholder-slate-400 focus:outline-none"
              />

              <button
                type="submit"
                disabled={isScanning || !domainInput.trim() || Boolean(inputWarning)}
                className="shimmer-btn flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-rose-600 px-4 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold tracking-wider uppercase text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shrink-0 min-h-[44px] whitespace-nowrap"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span className="hidden sm:inline">Auditing...</span>
                  </>
                ) : (
                  <>
                    <span>Scan Target</span>
                    <ArrowRight className="h-4 w-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time SSRF Warning (Pre-submit) */}
          {inputWarning && (
            <div className="flex items-center gap-2 text-left text-xs font-mono text-rose-300 bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 shadow-lg">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{inputWarning}</span>
            </div>
          )}

          {/* Quick-Sample Badges in Tactical Capsules */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono">
            <span className="text-slate-400 mr-1 text-[11px] font-semibold uppercase tracking-wider">
              Instant Targets:
            </span>
            {SAMPLE_DOMAINS.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.domain}
                  type="button"
                  onClick={() => handleSampleClick(item.domain)}
                  disabled={isScanning}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors duration-150 active:scale-95 shadow-sm md:hover:scale-105 border ${item.badge}`}
                >
                  <IconComponent className="h-3 w-3" />
                  <span>{item.domain}</span>
                </button>
              );
            })}
          </div>

          {/* Server Error Alert */}
          {errorMessage && (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3.5 text-xs text-rose-300 text-left font-mono shadow-lg">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* Live Terminal Diagnostic Stream */}
        <div className="mx-auto max-w-3xl pt-2 text-left">
          <DiagnosticTerminal logs={logs} isScanning={isScanning} />
        </div>
      </div>
    </section>
  );
}
