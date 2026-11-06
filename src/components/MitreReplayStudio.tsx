"use client";

import React, { useState } from "react";
import {
  Terminal,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  Layers,
  Crosshair,
} from "lucide-react";
import { computeMitreMatrix } from "@/lib/scanner/mitre-mapper";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import type { CompleteScanResult } from "@/lib/types/scanner";

interface MitreReplayStudioProps {
  scan: CompleteScanResult;
}

export function MitreReplayStudio({ scan }: MitreReplayStudioProps) {
  const { playClick, playDownload } = useTacticalAudio();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const matrix = computeMitreMatrix(scan);

  const handleCopy = (cmd: string, id: string) => {
    playClick();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      if (typeof navigator.vibrate === "function") {
        navigator.vibrate(25);
      }
    }
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE_VULNERABILITY":
        return "border-rose-500/50 bg-rose-500/15 text-rose-300";
      case "ELEVATED_EXPOSURE":
        return "border-amber-500/50 bg-amber-500/15 text-amber-300";
      default:
        return "border-emerald-500/50 bg-emerald-500/15 text-emerald-300";
    }
  };

  const filteredTechniques =
    selectedFilter === "ALL"
      ? matrix.techniques
      : selectedFilter === "EXPOSURES"
      ? matrix.techniques.filter((t) => t.status !== "MITIGATED")
      : matrix.techniques.filter((t) => t.status === "MITIGATED");

  return (
    <section className="w-full space-y-6 animate-in fade-in-50 duration-300">
      {/* Studio Header Card */}
      <div className="rounded-2xl cyber-card p-5 sm:p-7 border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(0,245,255,0.35)] shrink-0">
              <Crosshair className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                MITRE ATT&CK Matrix & Replay Studio
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                Adversary techniques mapping (TA0001 – TA0042) and 1-click terminal verification commands
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              {matrix.activeExposures} Active Exposures
            </span>
            <span className="text-[11px] font-mono px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              {matrix.hardenedCount} Hardened Mitigations
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Top Tactic Priority:
            </span>
            <span className="text-cyan-300 font-bold truncate max-w-[280px] sm:max-w-none">
              {matrix.topThreatTactic}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: "ALL", label: `All (${matrix.totalAssessed})` },
              { id: "EXPOSURES", label: `Exposures (${matrix.activeExposures})` },
              { id: "HARDENED", label: `Hardened (${matrix.hardenedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  playClick();
                  setSelectedFilter(f.id);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all shrink-0 ${
                  selectedFilter === f.id
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-sm"
                    : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MITRE Techniques Grid */}
      <div className="space-y-4">
        {filteredTechniques.map((technique) => (
          <div
            key={technique.id}
            className="rounded-2xl border border-white/[0.08] bg-[#070a14] overflow-hidden shadow-xl"
          >
            {/* Technique Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.06] bg-[#090d1c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-lg border border-cyan-400/50 bg-cyan-500/15 text-cyan-300">
                    {technique.id}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] text-slate-300">
                    {technique.tactic}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                      technique.status
                    )}`}
                  >
                    {technique.status.replace(/_/g, " ")}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide pt-1">
                  {technique.name}
                </h3>
              </div>

              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0 self-start sm:self-auto">
                Vector: {technique.category}
              </span>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="space-y-2 text-xs font-sans text-slate-300 leading-relaxed">
                <p>
                  <strong className="text-white font-mono">Adversary Threat Vector: </strong>
                  {technique.explanation}
                </p>
                <p className="text-slate-400 text-[11.5px]">
                  <strong className="text-emerald-300 font-mono">MITRE Defense Guidance: </strong>
                  {technique.mitigationGuide}
                </p>
              </div>

              {/* 1-Click Pentester Replay Studio Commands */}
              <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  1-Click Verification CLI Replay:
                </span>

                <div className="grid gap-2">
                  {technique.verificationCommands.map((cmd, idx) => {
                    const cmdId = `${technique.id}-${idx}`;
                    const isCopied = copiedCommand === cmdId;

                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-white/[0.06] bg-[#04060e] hover:border-cyan-500/30 transition-all text-xs font-mono"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                              {cmd.tool}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate">
                              {cmd.description}
                            </span>
                          </div>
                          <pre className="overflow-x-auto text-xs text-cyan-200 select-all scrollbar-thin py-0.5">
                            <code>{cmd.command}</code>
                          </pre>
                        </div>

                        <button
                          onClick={() => handleCopy(cmd.command, cmdId)}
                          className="self-end sm:self-center flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#0c1020] hover:border-cyan-400 hover:bg-cyan-500/20 px-3 py-1.5 text-[11px] text-slate-200 hover:text-white transition-all shrink-0 active:scale-95 shadow-sm min-h-[36px]"
                          title="Copy command to clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-300 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                              <span>Copy CLI</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
