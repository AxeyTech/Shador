"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Flame,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Crosshair,
  Copy,
  Check,
  X,
  Play,
  SkipBack,
  SkipForward,
  ChevronRight,
  Code2,
  AlertTriangle,
  Radio,
  Eye,
  Server,
  Lock,
} from "lucide-react";
import type { NodeAttackSimulation } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";

interface InteractiveAttackArenaProps {
  simulation: NodeAttackSimulation | null;
  isOpen: boolean;
  onClose: () => void;
  targetDomain: string;
}

export function InteractiveAttackArena({
  simulation,
  isOpen,
  onClose,
  targetDomain,
}: InteractiveAttackArenaProps) {
  const { playClick, playPing, playScanDispatch, playDownload } = useTacticalAudio();
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [perspective, setPerspective] = useState<"red" | "blue">("red");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !simulation) return null;

  const currentStep = simulation.killChain[activeStepIdx] || simulation.killChain[0];

  const handleCopy = (text: string, key: string) => {
    playDownload();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleNextStep = () => {
    playScanDispatch();
    setActiveStepIdx((prev) => (prev + 1) % simulation.killChain.length);
  };

  const handlePrevStep = () => {
    playClick();
    setActiveStepIdx((prev) => (prev - 1 + simulation.killChain.length) % simulation.killChain.length);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Attack Vector Simulator Arena"
    >
      {/* Tactical Container - 100% Solid Opaque */}
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-white/[0.14] shadow-[-10px_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(244,63,94,0.18)] max-h-[92vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: "#060813", opacity: 1 }}
      >
        {/* Top Tactical Laser Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300 ${
            perspective === "red"
              ? "bg-gradient-to-r from-transparent via-rose-500 to-transparent"
              : "bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all ${
                perspective === "red"
                  ? "border-rose-500/50 bg-rose-500/15 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  : "border-cyan-500/50 bg-cyan-500/15 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              }`}
            >
              {perspective === "red" ? <Crosshair className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  ATTACK ARENA // {simulation.nodeType.toUpperCase()} NODE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/[0.1] bg-white/[0.04] text-slate-300">
                  {simulation.nodeLabel}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-mono font-bold text-white flex items-center gap-2">
                <span>Tactical Kill-Chain Replay</span>
              </h3>
            </div>
          </div>

          {/* Perspective Toggle & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-xl border border-white/[0.1] bg-[#0b0f1d] p-1">
              <button
                onClick={() => {
                  playClick();
                  setPerspective("red");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  perspective === "red"
                    ? "bg-rose-500/25 text-rose-200 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-rose-400" />
                <span>Red Team (Attack)</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setPerspective("blue");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  perspective === "blue"
                    ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Blue Team (Defense)</span>
              </button>
            </div>

            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              className="p-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
              aria-label="Close Arena"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 5-Stage Stepper Ribbon (Horizontal on Desktop, Scrollable on Mobile) */}
        <div className="flex items-center border-b border-white/[0.08] bg-[#080c19] px-3 sm:px-5 py-2.5 overflow-x-auto scrollbar-none shrink-0 gap-2">
          {simulation.killChain.map((step, idx) => {
            const isActive = idx === activeStepIdx;
            const isCompleted = idx < activeStepIdx;
            return (
              <button
                key={idx}
                onClick={() => {
                  playClick();
                  setActiveStepIdx(idx);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap shrink-0 border ${
                  isActive
                    ? perspective === "red"
                      ? "bg-rose-500/20 text-rose-200 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                      : "bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : isCompleted
                    ? "bg-white/[0.03] text-slate-300 border-white/[0.08] hover:bg-white/[0.06]"
                    : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? perspective === "red"
                        ? "bg-rose-500 text-white"
                        : "bg-cyan-400 text-slate-950"
                      : isCompleted
                      ? "bg-white/[0.1] text-slate-300"
                      : "bg-white/[0.05] text-slate-400"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="font-semibold">{step.stage}</span>
                {idx < simulation.killChain.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-slate-400 ml-1 hidden md:inline" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Active Stage Header & Telemetry Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0b0f1d]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/15 text-cyan-300">
                  MITRE {currentStep.mitreId}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {currentStep.mitreTactic}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-mono font-bold text-white">
                Stage 0{activeStepIdx + 1}: {currentStep.redTeamTitle}
              </h4>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono uppercase text-slate-400">Severity CVSS:</span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                  currentStep.cvssScore >= 9.0
                    ? "border-rose-500/50 bg-rose-500/20 text-rose-300"
                    : currentStep.cvssScore >= 7.0
                    ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                    : "border-cyan-500/50 bg-cyan-500/20 text-cyan-300"
                }`}
              >
                {currentStep.cvssScore} / 10.0 ({currentStep.severity.toUpperCase()})
              </span>
            </div>
          </div>

          {/* Perspective Viewport: Red Team vs Blue Team */}
          {perspective === "red" ? (
            /* RED TEAM OFFENSIVE VIEW */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-rose-500/30 bg-[#0b0f1d] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-300">
                  <Flame className="h-4 w-4 text-rose-400" />
                  <span>Adversary Action Playbook:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
                  {currentStep.redTeamAction}
                </p>
              </div>

              {/* Copyable Red Team Command Terminal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
                    <Terminal className="h-3.5 w-3.5" />
                    Offensive PoC Terminal Command (Reproducible Verification):
                  </span>
                  <span className="text-[10px] text-slate-400">Safe Passive Replay</span>
                </div>

                <div className="relative flex items-center rounded-xl border border-rose-500/30 bg-[#02040a] p-3.5 text-xs font-mono text-rose-200 overflow-x-auto scrollbar-thin">
                  <span className="select-all pr-12">{currentStep.redTeamCommand}</span>
                  <button
                    onClick={() => handleCopy(currentStep.redTeamCommand, `red-cmd-${activeStepIdx}`)}
                    className="absolute right-2.5 top-2.5 p-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition-all"
                    title="Copy Red Team PoC Command"
                  >
                    {copiedKey === `red-cmd-${activeStepIdx}` ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* BLUE TEAM DEFENSIVE VIEW */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-[#0b0f1d] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  <span>Defensive Incident Countermeasure:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
                  {currentStep.blueTeamCountermeasure}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0b0f1d] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span>SIEM / EDR Detection Telemetry Rule:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {currentStep.blueTeamDetectionRule}
                </p>
              </div>

              {currentStep.blueTeamRemediationSnippet && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <Code2 className="h-3.5 w-3.5" />
                      1-Click Hardening Configuration Rule:
                    </span>
                    <span className="text-[10px] text-slate-400">Production Ready</span>
                  </div>

                  <div className="relative rounded-xl border border-emerald-500/30 bg-[#02040a] p-3.5 text-xs font-mono text-emerald-200 overflow-x-auto scrollbar-thin">
                    <pre className="select-all pr-12">
                      <code>{currentStep.blueTeamRemediationSnippet}</code>
                    </pre>
                    <button
                      onClick={() =>
                        handleCopy(currentStep.blueTeamRemediationSnippet!, `blue-snippet-${activeStepIdx}`)
                      }
                      className="absolute right-2.5 top-2.5 p-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 transition-all"
                      title="Copy Configuration Rule"
                    >
                      {copiedKey === `blue-snippet-${activeStepIdx}` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#080c19] flex items-center justify-between shrink-0">
          <button
            onClick={handlePrevStep}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono text-slate-300 border border-white/[0.08] hover:bg-white/[0.06] active:scale-95 transition-all"
          >
            <SkipBack className="h-3.5 w-3.5" />
            <span>Previous Stage</span>
          </button>

          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Stage {activeStepIdx + 1} of {simulation.killChain.length}
          </span>

          <button
            onClick={handleNextStep}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold active:scale-95 transition-all shadow-md ${
              perspective === "red"
                ? "bg-rose-500/25 text-rose-200 border border-rose-500/50 hover:bg-rose-500/35 shadow-rose-500/10"
                : "bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 hover:bg-cyan-500/35 shadow-cyan-500/10"
            }`}
          >
            <span>{activeStepIdx === simulation.killChain.length - 1 ? "Loop to Beginning" : "Next Attack Stage"}</span>
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
