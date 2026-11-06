"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Shield,
  Activity,
  Terminal,
  Lock,
  Globe,
  Mail,
  Radio,
  AlertTriangle,
  CheckCircle2,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Monitor,
  Crosshair,
  Flame,
  Copy,
  Check,
  Network,
  Zap,
  Server,
  Download,
  Share2,
  Compass,
  FileText,
} from "lucide-react";
import type { CompleteScanResult } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { useCrtHud } from "@/lib/crt/CrtContext";

// Accelerated dynamic topology loader with zero hydration lag
const DynamicTopologyCanvas = dynamic(
  () => import("./TopologyCanvas").then((mod) => mod.TopologyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center font-mono text-xs text-slate-500 gap-2 bg-[#020409]">
        <div className="h-7 w-7 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span>Synthesizing tactical topology stream...</span>
      </div>
    ),
  }
);

interface WarRoomDeckProps {
  scan: CompleteScanResult;
  isOpen: boolean;
  onClose: () => void;
}

export function WarRoomDeck({ scan, isOpen, onClose }: WarRoomDeckProps) {
  const { playClick, playDownload, triggerHaptic, isAudioEnabled, toggleAudio } = useTacticalAudio();
  const { isCrtEnabled, toggleCrt } = useCrtHud();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"map" | "telemetry" | "vulns" | "terminal">("map");
  const [utcTime, setUtcTime] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const warRoomRef = useRef<HTMLDivElement>(null);

  // Live UTC Tactical Clock Oscillator
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = new Date();
      setUtcTime(
        `${now.toISOString().substring(11, 19)}.${String(
          Math.floor(now.getMilliseconds() / 10)
        ).padStart(2, "0")} UTC`
      );
    }, 50);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Global ESC and Hotkey listeners
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    triggerHaptic("medium");
    playClick();
    if (!document.fullscreenElement) {
      warRoomRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  const { score, emailSpoof, subdomains, tls, headers, network, originBypass } = scan;

  const defconLevel =
    score.score < 25
      ? { level: 5, label: "DEFCON 5 // MINIMAL RISK", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" }
      : score.score < 50
      ? { level: 4, label: "DEFCON 4 // ELEVATED SURVEILLANCE", color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" }
      : score.score < 75
      ? { level: 3, label: "DEFCON 3 // SUBSTANTIAL EXPOSURE", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" }
      : { level: 1, label: "DEFCON 1 // CRITICAL PERIMETER BREACH", color: "text-rose-400 border-rose-500/40 bg-rose-500/15" };

  const handleCopyMarkdown = () => {
    triggerHaptic("medium");
    playDownload();
    const md = `# SHADOR Command Deck Dossier — ${scan.targetDomain}
**DEFCON Rating**: ${defconLevel.label}
**Risk Score**: ${score.score}/100 [Grade ${score.letterGrade}]
**Email Spoofability**: ${emailSpoof.canSpoofDirectly ? "CRITICAL (Direct Spoofable)" : "Hardened"}
**Subdomains Identified**: ${subdomains.discoveredCount} (Dangling: ${subdomains.danglingTakeoversFound})
**Primary BGP/ASN**: ${network?.primaryAsn?.asn || "N/A"} (${network?.primaryAsn?.organization || "N/A"})
**Audit Timestamp**: ${new Date(scan.sanitizedAt).toUTCString()}`;
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleCopyShare = () => {
    triggerHaptic("medium");
    playDownload();
    const url = `${window.location.origin}/report/${scan.id}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div
      ref={warRoomRef}
      className="fixed inset-0 z-[100] bg-[#020308] text-white flex flex-col overflow-hidden select-none font-mono"
    >
      {/* Specular Quad-Spectrum Laser Hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-white via-50% to-rose-500 z-50 shadow-[0_0_15px_#00e5ff]" />

      {/* Subtle Background Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f0ff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      {/* TOP COMMAND DECK BAR */}
      <header className="h-14 sm:h-16 shrink-0 border-b border-white/[0.1] bg-[#040612]/98 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 relative z-40">
        {/* Left: Brand & Target Identification */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-cyan-400/50 bg-cyan-500/10 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0">
            <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-black tracking-wider text-white shrink-0">
                SHADOR
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">{"//"}</span>
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest hidden lg:inline">
                WAR ROOM OPS
              </span>
              <span className="text-[9.5px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-300 truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
                {scan.targetDomain}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              <span className={`px-1.5 sm:px-2 py-0.2 rounded border font-bold text-[9px] sm:text-[9.5px] ${defconLevel.color}`}>
                {defconLevel.label}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live UTC Clock & Telemetry Badges (Desktop only) */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl border border-white/[0.08] bg-[#080d1e] text-xs font-mono text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="tabular-nums tracking-widest">{utcTime || "00:00:00.00 UTC"}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-300">
              <strong className="text-white">{subdomains.discoveredCount}</strong> Assets
            </span>
            <span className="px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-300">
              <strong className="text-cyan-300">{score.score}</strong> Risk Index
            </span>
            {subdomains.danglingTakeoversFound > 0 && (
              <span className="px-2.5 py-1 rounded-lg border border-rose-500/40 bg-rose-500/20 text-rose-300 animate-pulse">
                <strong>{subdomains.danglingTakeoversFound}</strong> Takeovers
              </span>
            )}
          </div>
        </div>

        {/* Right: Tactical Command Controls (Guaranteed Always-Visible Close Button) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto z-50">
          {/* Audio Synthesizer Toggle */}
          <button
            onClick={() => {
              triggerHaptic("light");
              toggleAudio();
            }}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all active:scale-95 ${
              isAudioEnabled
                ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white"
            }`}
            title="Toggle Tactical Audio"
            aria-label="Toggle Tactical Audio"
          >
            {isAudioEnabled ? <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>

          {/* CRT Scanline Toggle */}
          <button
            onClick={() => {
              triggerHaptic("light");
              toggleCrt();
            }}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all active:scale-95 hidden sm:inline-flex ${
              isCrtEnabled
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white"
            }`}
            title="Toggle CRT HUD Scanlines"
            aria-label="Toggle CRT Scanlines"
          >
            <Activity className="h-4 w-4" />
          </button>

          {/* Fullscreen Expand Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white transition-all active:scale-95 hidden sm:inline-flex"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Unmissable Close / Exit Button */}
          <button
            onClick={() => {
              triggerHaptic("light");
              playClick();
              onClose();
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-rose-500/70 bg-rose-500/25 text-rose-200 hover:bg-rose-500/35 transition-all active:scale-95 text-xs font-bold font-mono shadow-[0_0_15px_rgba(244,63,94,0.35)] shrink-0"
            title="Exit War Room Deck (ESC)"
            aria-label="Exit War Room Deck"
          >
            <X className="h-4 w-4 shrink-0 text-rose-300" />
            <span className="font-bold">EXIT</span>
          </button>
        </div>
      </header>

      {/* MOBILE / TABLET DEDICATED SUB-BAR: Tab Switcher (screens < lg) */}
      <div className="flex lg:hidden items-center justify-between px-3 py-1.5 border-b border-white/[0.08] bg-[#030612]/95 backdrop-blur-xl shrink-0 z-30">
        <div className="grid grid-cols-3 w-full gap-1 p-0.5 rounded-xl bg-black/60 border border-white/[0.08]">
          <button
            onClick={() => {
              triggerHaptic("light");
              setMobileTab("map");
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === "map"
                ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              setMobileTab("telemetry");
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === "telemetry"
                ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Telemetry</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              setMobileTab("vulns");
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === "vulns"
                ? "bg-rose-500/25 text-rose-200 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Risks {subdomains.danglingTakeoversFound > 0 ? `(${subdomains.danglingTakeoversFound})` : ""}</span>
          </button>
        </div>
      </div>

      {/* MAIN COMMAND DECK WORKSPACE */}
      <div className="flex-1 overflow-hidden relative">
        {/* DESKTOP 3-PANEL HIGH-DENSITY GRID */}
        <div className="hidden lg:grid lg:grid-cols-12 h-full">
          {/* LEFT TELEMETRY SENSOR ARRAY (3 cols) */}
          <aside className="col-span-3 h-full border-r border-white/[0.08] bg-[#030612]/90 backdrop-blur-xl p-3.5 overflow-y-auto scrollbar-none space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="text-[11px] font-bold text-cyan-300 tracking-wider uppercase flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-cyan-400" />
                Sensor Array Telemetry
              </span>
              <span className="text-[9.5px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                PASSIVE FEED
              </span>
            </div>

            {/* Email Spoofability Armor */}
            <div className="p-3 rounded-xl border border-white/[0.08] bg-[#070b1a] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-amber-400" />
                  Email Spoofability Index
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  emailSpoof.canSpoofDirectly
                    ? "border-rose-500/50 bg-rose-500/20 text-rose-300"
                    : "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                }`}>
                  {emailSpoof.canSpoofDirectly ? "SPOOFABLE" : "HARDENED"}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                SPF: <span className="text-white">{emailSpoof.spf.status}</span> · DMARC:{" "}
                <span className="text-white">{emailSpoof.dmarc.policy.toUpperCase()}</span>
              </div>
            </div>

            {/* TLS Cryptographic Posture */}
            <div className="p-3 rounded-xl border border-white/[0.08] bg-[#070b1a] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  TLS Cryptography
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                  {tls.protocol || "TLS 1.3"}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                Days Remaining: <strong className="text-white font-mono">{tls.daysRemaining}d</strong>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Issuer: {typeof tls.issuer === "string" ? tls.issuer : tls.issuer?.org || tls.issuer?.commonName || "Certificate Authority"}
              </div>
            </div>

            {/* Autonomous System & BGP Routing */}
            {network && (
              <div className="p-3 rounded-xl border border-white/[0.08] bg-[#070b1a] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Network className="h-3.5 w-3.5 text-cyan-400" />
                    BGP Autonomous System
                  </span>
                  <span className="text-[10px] font-bold text-cyan-300">
                    {network.primaryAsn?.asn || "AS-Unknown"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  Operator: {network.primaryAsn?.organization || "N/A"}
                </div>
                <div className="text-[10px] text-slate-400">
                  Routing Resilience: <span className="text-cyan-300 font-bold">{network.routingSecurityScore}/100</span>
                </div>
              </div>
            )}

            {/* Edge Defensive Headers */}
            <div className="p-3 rounded-xl border border-white/[0.08] bg-[#070b1a] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-cyan-400" />
                  Edge Defensive Headers
                </span>
                <span className="text-[10px] font-bold text-cyan-300">
                  {headers.score}/100
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {Object.entries(headers.auditedHeaders || {}).slice(0, 5).map(([hName, val]) => (
                  <span
                    key={hName}
                    className={`text-[9.5px] px-2 py-0.5 rounded border ${
                      val.present
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-800 bg-slate-900 text-slate-500"
                    }`}
                  >
                    {hName.substring(0, 14)}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Export Bar */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center gap-2">
              <button
                onClick={handleCopyMarkdown}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-mono transition-all active:scale-95"
              >
                {copiedMarkdown ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <FileText className="h-3.5 w-3.5 text-cyan-400" />}
                <span>{copiedMarkdown ? "Copied MD" : "CISO Dossier"}</span>
              </button>
              <button
                onClick={handleCopyShare}
                className="flex items-center justify-center px-3 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-mono transition-all active:scale-95"
                title="Copy Link"
              >
                {copiedShare ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5 text-rose-400" />}
              </button>
            </div>
          </aside>

          {/* CENTER ATTACK SURFACE TOPOLOGY CANVAS (6 cols) */}
          <main className="col-span-6 h-full flex flex-col relative bg-[#010206] border-r border-white/[0.08]">
            <div className="h-9 px-4 border-b border-white/[0.08] bg-[#040612]/90 flex items-center justify-between text-xs text-slate-400 font-mono shrink-0">
              <span className="flex items-center gap-2">
                <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
                Autonomous Graph Telemetry & Attack Vectors
              </span>
              <span className="text-[10px] text-slate-500">
                120 FPS Accelerated Canvas
              </span>
            </div>

            <div className="flex-1 w-full h-full relative overflow-hidden">
              {scan.topology ? (
                <DynamicTopologyCanvas topology={scan.topology} domain={scan.targetDomain} fullHeight />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                  No topology graph stream generated for this scan.
                </div>
              )}
            </div>
          </main>

          {/* RIGHT VULNERABILITY RADAR & ACTION QUEUE (3 cols) */}
          <aside className="col-span-3 h-full border-l border-white/[0.08] bg-[#030612]/90 backdrop-blur-xl p-3.5 overflow-y-auto scrollbar-none space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="text-[11px] font-bold text-rose-300 tracking-wider uppercase flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                Vulnerability Horizon
              </span>
              <span className="text-[9.5px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono">
                PRIORITY QUEUE
              </span>
            </div>

            {/* Dangling Cloud Takeover Alert */}
            {subdomains.danglingTakeoversFound > 0 ? (
              <div className="p-3 rounded-xl border border-rose-500/60 bg-rose-500/15 space-y-1.5 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                <div className="flex items-center justify-between text-xs font-bold text-rose-200">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-rose-400" />
                    Subdomain Takeovers
                  </span>
                  <span>{subdomains.danglingTakeoversFound} Active</span>
                </div>
                <p className="text-[10.5px] text-rose-200/90 leading-tight">
                  CNAME records pointing to unclaimed cloud buckets or dangling provider endpoints.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Zero dangling subdomain takeovers detected.</span>
              </div>
            )}

            {/* WAF & Origin Bypass Radar */}
            {originBypass && (
              <div className="p-3 rounded-xl border border-white/[0.08] bg-[#070b1a] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-rose-400" />
                    WAF Origin Status
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    originBypass.candidates.length > 0
                      ? "border-rose-500/50 bg-rose-500/20 text-rose-300"
                      : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                  }`}>
                    {originBypass.candidates.length > 0 ? `${originBypass.candidates.length} Origin Leaks` : "Protected"}
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-300">
                  Provider: {originBypass.wafProvider || "Direct Apex Server"}
                </div>
              </div>
            )}

            {/* Subdomain Discovered Stream */}
            <div className="space-y-2">
              <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider block">
                Discovered Endpoints ({subdomains.subdomains.length})
              </span>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
                {subdomains.subdomains.slice(0, 10).map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg border border-white/[0.05] bg-black/40 flex items-center justify-between text-[11px] font-mono"
                  >
                    <span className="truncate text-slate-300 max-w-[180px]">{sub.domain}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${
                        sub.isDangling
                          ? "border-rose-500/60 bg-rose-500/30 text-rose-200"
                          : "border-slate-700 bg-slate-800 text-slate-400"
                      }`}
                    >
                      {sub.isDangling ? "DANGLING" : "ACTIVE"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* MOBILE SINGLE VIEWPORT (Tab-switchable on screens < lg) */}
        <div className="lg:hidden h-full flex flex-col min-h-0">
          {mobileTab === "map" && (
            <div className="flex-1 w-full h-full relative overflow-hidden bg-[#010206] min-h-0">
              {scan.topology ? (
                <DynamicTopologyCanvas topology={scan.topology} domain={scan.targetDomain} fullHeight />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                  No topology graph stream available.
                </div>
              )}
            </div>
          )}

          {mobileTab === "telemetry" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#030612]">
              {/* Telemetry Cards for Mobile */}
              <div className="p-3.5 rounded-xl border border-white/[0.1] bg-[#070b1a] space-y-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-amber-400" />
                  Email Spoofability Status
                </span>
                <p className="text-xs text-slate-300">{emailSpoof.summary}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/[0.1] bg-[#070b1a] space-y-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  TLS Cryptography
                </span>
                <p className="text-xs text-slate-300">
                  Protocol: {tls.protocol || "TLS 1.3"} · Valid: {tls.daysRemaining} days remaining
                </p>
              </div>

              {network && (
                <div className="p-3.5 rounded-xl border border-white/[0.1] bg-[#070b1a] space-y-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Network className="h-4 w-4 text-cyan-400" />
                    BGP Autonomous System
                  </span>
                  <p className="text-xs text-slate-300">
                    {network.primaryAsn?.asn || "AS-Unknown"} — {network.primaryAsn?.organization || "N/A"}
                  </p>
                </div>
              )}
            </div>
          )}

          {mobileTab === "vulns" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#030612]">
              {subdomains.danglingTakeoversFound > 0 && (
                <div className="p-3.5 rounded-xl border border-rose-500 bg-rose-950/30 text-rose-200 space-y-1">
                  <strong className="text-xs flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-rose-400" />
                    {subdomains.danglingTakeoversFound} Dangling Subdomain Takeovers
                  </strong>
                  <p className="text-xs">Takeover vulnerability detected in DNS CNAME records.</p>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300">Discovered Endpoints ({subdomains.discoveredCount})</span>
                {subdomains.subdomains.slice(0, 15).map((sub, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-white/[0.08] bg-black/40 text-xs font-mono flex items-center justify-between">
                    <span className="truncate max-w-[220px] text-slate-300">{sub.domain}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      sub.isDangling ? "bg-rose-500/20 text-rose-300" : "bg-white/5 text-slate-400"
                    }`}>
                      {sub.isDangling ? "Dangling" : "Active"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}