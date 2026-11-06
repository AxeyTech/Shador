"use client";

import React, { useState } from "react";
import {
  Users,
  Shield,
  Key,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Database,
  Radio,
  FileText,
  Mail,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { BreachExposureResult } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";

interface BreachExposureRadarProps {
  breachRadar: BreachExposureResult;
  targetDomain: string;
}

export function BreachExposureRadar({ breachRadar, targetDomain }: BreachExposureRadarProps) {
  const { playClick, playDownload } = useTacticalAudio();
  const [copiedPattern, setCopiedPattern] = useState<string | null>(null);

  const handleCopy = (pattern: string) => {
    playDownload();
    navigator.clipboard.writeText(pattern);
    setCopiedPattern(pattern);
    setTimeout(() => setCopiedPattern(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Container - 100% Solid Opaque */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border border-amber-500/40 bg-amber-500/15 text-amber-300">
                <Users className="h-3.5 w-3.5 text-amber-400" />
                DARK WEB & CREDENTIAL EXPOSURE RADAR
              </span>

              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border border-rose-500/40 bg-rose-500/15 text-rose-300">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                PASSWORD SPRAY SUSCEPTIBLE
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              Corporate Identity Exposure & Mega-Breach Correlation
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              {breachRadar.summary}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#060813] text-center min-w-[120px]">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Mega-Dumps</span>
              <span className="text-sm font-bold font-mono text-amber-300">
                {breachRadar.historicalBreaches.length} Major Corpora
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#060813] text-center min-w-[120px]">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">OSINT Pivots</span>
              <span className="text-sm font-bold font-mono text-cyan-300">
                {breachRadar.osintPivots.length} Verifiers
              </span>
            </div>
          </div>
        </div>

        {/* Corporate Email Naming Conventions Ribbon */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-2">
          <span className="text-[11px] font-mono text-slate-400 font-semibold block">
            Synthesized Corporate Email Naming Formats (T1589.002):
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {breachRadar.commonEmailPatterns.map((pat, idx) => (
              <button
                key={idx}
                onClick={() => handleCopy(pat)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono border border-cyan-500/30 bg-[#060813] text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/10 active:scale-95 transition-all group"
                title="Click to copy pattern format"
              >
                <Mail className="h-3 w-3 text-cyan-400" />
                <span>{pat}</span>
                {copiedPattern === pat ? (
                  <Check className="h-3 w-3 text-emerald-400 ml-1" />
                ) : (
                  <Copy className="h-3 w-3 text-slate-500 group-hover:text-cyan-400 ml-1 opacity-70" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Historical Breaches & OSINT Pivots */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left: Historical Mega-Dumps Corpus (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm sm:text-base font-mono font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-400" />
              <span>Public Credential Wordlists & Infostealer Corpora</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Automated Spray Threat</span>
          </div>

          <div className="space-y-3">
            {breachRadar.historicalBreaches.map((breach, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/[0.06] bg-[#060813] p-3.5 space-y-1.5 transition-all hover:border-amber-500/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">{breach.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-white/[0.1] bg-white/[0.04] text-slate-400">
                      {breach.year}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-rose-300 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 shrink-0">
                    {breach.records}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-mono leading-relaxed">{breach.impact}</p>

                <div className="pt-1 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Category: {breach.cveOrCategory}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: OSINT Domain Verifier Deep-Links (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm sm:text-base font-mono font-bold text-white flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-400" />
              <span>OSINT Breach Verifiers</span>
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">Live Pivots</span>
          </div>

          <div className="space-y-2.5">
            {breachRadar.osintPivots.map((pivot) => (
              <a
                key={pivot.id}
                href={pivot.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={playClick}
                className="group flex flex-col justify-between p-3 rounded-xl border border-white/[0.06] bg-[#060813] hover:border-cyan-400/40 hover:bg-[#090e20] active:scale-[0.98] transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {pivot.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                      {pivot.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight font-mono">{pivot.description}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-cyan-400">
                  <span>Verify Domain Exposures</span>
                  <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Defensive Password Spraying & Credential Hardening Blueprint */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#0b0f1d] p-5 sm:p-6 shadow-xl space-y-3">
        <h4 className="text-sm font-mono font-bold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Enterprise Defensive Identity Architecture (MITRE M1027 & M1032)</span>
        </h4>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {breachRadar.defensiveRecommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-emerald-500/20 bg-[#060813] text-xs font-mono text-slate-300 leading-relaxed flex items-start gap-2"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
