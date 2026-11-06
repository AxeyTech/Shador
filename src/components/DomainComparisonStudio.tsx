"use client";

import React, { useState, useMemo } from "react";
import {
  Swords,
  Trophy,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Lock,
  Mail,
  Globe,
  Network,
  Flame,
  Zap,
  Copy,
  Check,
  Download,
  Activity,
  Layers,
  Cpu,
  RefreshCw,
} from "lucide-react";
import type { CompleteScanResult, LetterGrade } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { formatUtcDateTime } from "@/lib/utils";

interface DomainComparisonStudioProps {
  baseScan: CompleteScanResult;
}

const COMPARISON_PRESETS = [
  { domain: "cloudflare.com", label: "Cloudflare (Edge/WAF)" },
  { domain: "google.com", label: "Google (Hyperscale Cloud)" },
  { domain: "github.com", label: "GitHub (DevSecOps)" },
  { domain: "stripe.com", label: "Stripe (FinTech/PCI)" },
  { domain: "microsoft.com", label: "Microsoft (Enterprise)" },
];

export function DomainComparisonStudio({ baseScan }: DomainComparisonStudioProps) {
  const { playClick, playScanDispatch, playDownload, triggerHaptic } = useTacticalAudio();
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitorScan, setCompetitorScan] = useState<CompleteScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMatrix, setCopiedMatrix] = useState(false);

  const handleRunComparison = async (targetDomain: string) => {
    const clean = targetDomain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    if (!clean || !clean.includes(".")) return;

    if (clean === baseScan.targetDomain.toLowerCase()) {
      setErrorMessage("Please select or enter a different domain for comparative confrontation.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    playScanDispatch();
    triggerHaptic("heavy");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: clean }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        setCompetitorScan(data);
        playDownload();
        triggerHaptic("success");
      } else {
        setErrorMessage(data.error || "Failed to audit competitor perimeter. Verify target accessibility.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Network error during confrontation scan.");
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeBadge = (grade: LetterGrade) => {
    switch (grade) {
      case "A":
        return "border-emerald-500/50 bg-emerald-500/20 text-emerald-300";
      case "B":
        return "border-cyan-500/50 bg-cyan-500/20 text-cyan-300";
      case "C":
        return "border-amber-500/50 bg-amber-500/20 text-amber-300";
      case "D":
      case "F":
        return "border-rose-500/50 bg-rose-500/20 text-rose-300";
      default:
        return "border-slate-500/50 bg-slate-500/20 text-slate-300";
    }
  };

  // Determine Victor
  const isBaseVictor = competitorScan ? baseScan.score.score < competitorScan.score.score : false;
  const isTie = competitorScan ? baseScan.score.score === competitorScan.score.score : false;
  const scoreDiff = competitorScan ? Math.abs(baseScan.score.score - competitorScan.score.score) : 0;

  // Compute 6-Vector Advantages
  const vectorAdvantage = useMemo(() => {
    if (!competitorScan) return null;

    let baseWins = 0;
    let competitorWins = 0;

    // 1. Email Spoofing
    const baseEmailSpoofable = baseScan.emailSpoof.canSpoofDirectly;
    const compEmailSpoofable = competitorScan.emailSpoof.canSpoofDirectly;
    let emailWinner: "base" | "comp" | "tie" = "tie";
    if (!baseEmailSpoofable && compEmailSpoofable) {
      emailWinner = "base";
      baseWins++;
    } else if (baseEmailSpoofable && !compEmailSpoofable) {
      emailWinner = "comp";
      competitorWins++;
    }

    // 2. TLS Cryptography
    const baseTlsScore = baseScan.tls.hasTls ? 100 - (baseScan.tls.daysRemaining <= 14 ? 30 : 0) : 0;
    const compTlsScore = competitorScan.tls.hasTls ? 100 - (competitorScan.tls.daysRemaining <= 14 ? 30 : 0) : 0;
    let tlsWinner: "base" | "comp" | "tie" = "tie";
    if (baseTlsScore > compTlsScore) {
      tlsWinner = "base";
      baseWins++;
    } else if (compTlsScore > baseTlsScore) {
      tlsWinner = "comp";
      competitorWins++;
    }

    // 3. Edge Defensive Headers
    const baseHeaders = baseScan.headers.score;
    const compHeaders = competitorScan.headers.score;
    let headersWinner: "base" | "comp" | "tie" = "tie";
    if (baseHeaders > compHeaders) {
      headersWinner = "base";
      baseWins++;
    } else if (compHeaders > baseHeaders) {
      headersWinner = "comp";
      competitorWins++;
    }

    // 4. Subdomain Dangling Takeover
    const baseTakeovers = baseScan.subdomains.danglingTakeoversFound;
    const compTakeovers = competitorScan.subdomains.danglingTakeoversFound;
    let takeoverWinner: "base" | "comp" | "tie" = "tie";
    if (baseTakeovers < compTakeovers) {
      takeoverWinner = "base";
      baseWins++;
    } else if (compTakeovers < baseTakeovers) {
      takeoverWinner = "comp";
      competitorWins++;
    }

    // 5. Network Anycast & Routing
    const baseAnycast = baseScan.network?.isAnycastProtected ? 1 : 0;
    const compAnycast = competitorScan.network?.isAnycastProtected ? 1 : 0;
    let networkWinner: "base" | "comp" | "tie" = "tie";
    if (baseAnycast > compAnycast) {
      networkWinner = "base";
      baseWins++;
    } else if (compAnycast > baseAnycast) {
      networkWinner = "comp";
      competitorWins++;
    }

    // 6. Threat Horizon / Tech Stack
    const baseExposure = baseScan.techStack?.threatHorizon?.exposureScore ?? 85;
    const compExposure = competitorScan.techStack?.threatHorizon?.exposureScore ?? 85;
    let techWinner: "base" | "comp" | "tie" = "tie";
    if (baseExposure > compExposure) {
      techWinner = "base";
      baseWins++;
    } else if (compExposure > baseExposure) {
      techWinner = "comp";
      competitorWins++;
    }

    return {
      baseWins,
      competitorWins,
      emailWinner,
      tlsWinner,
      headersWinner,
      takeoverWinner,
      networkWinner,
      techWinner,
    };
  }, [baseScan, competitorScan]);

  const handleExportMatrix = () => {
    if (!competitorScan) return;
    playDownload();
    triggerHaptic("medium");

    const matrixMd =
      `# SHADOR Target Versus Mode: Dual-Domain Benchmark Report\n\n` +
      `**Confrontation Audit:** ${baseScan.targetDomain} vs ${competitorScan.targetDomain}  \n` +
      `**Generated At:** ${formatUtcDateTime(new Date())}  \n` +
      `**Outcome Verdict:** ${
        isTie
          ? "Dead Tie (Identical Overall Risk Score)"
          : isBaseVictor
          ? `${baseScan.targetDomain} is the Resilience Champion (Lower Risk Score)`
          : `${competitorScan.targetDomain} is the Resilience Champion (Lower Risk Score)`
      }  \n\n` +
      `## Executive Posture Scorecard\n` +
      `| Metric | ${baseScan.targetDomain} | ${competitorScan.targetDomain} | Advantage |\n` +
      `|---|---|---|---|\n` +
      `| **Composite Risk Score** | ${baseScan.score.score}/100 (Grade ${baseScan.score.letterGrade}) | ${competitorScan.score.score}/100 (Grade ${competitorScan.score.letterGrade}) | ${isBaseVictor ? baseScan.targetDomain : competitorScan.targetDomain} |\n` +
      `| **Email Spoofing (DMARC)** | ${baseScan.emailSpoof.dmarc?.policy || "Missing"} (${baseScan.emailSpoof.canSpoofDirectly ? "Vulnerable" : "Shielded"}) | ${competitorScan.emailSpoof.dmarc?.policy || "Missing"} (${competitorScan.emailSpoof.canSpoofDirectly ? "Vulnerable" : "Shielded"}) | ${vectorAdvantage?.emailWinner === "base" ? baseScan.targetDomain : vectorAdvantage?.emailWinner === "comp" ? competitorScan.targetDomain : "Parity"} |\n` +
      `| **Edge Defensive Headers** | ${baseScan.headers.score}/100 (${baseScan.headers.missingCount} Missing) | ${competitorScan.headers.score}/100 (${competitorScan.headers.missingCount} Missing) | ${vectorAdvantage?.headersWinner === "base" ? baseScan.targetDomain : vectorAdvantage?.headersWinner === "comp" ? competitorScan.targetDomain : "Parity"} |\n` +
      `| **TLS Protocol & Depth** | ${baseScan.tls.protocol} (${baseScan.tls.daysRemaining}d left) | ${competitorScan.tls.protocol} (${competitorScan.tls.daysRemaining}d left) | ${vectorAdvantage?.tlsWinner === "base" ? baseScan.targetDomain : vectorAdvantage?.tlsWinner === "comp" ? competitorScan.targetDomain : "Parity"} |\n` +
      `| **Subdomain Takeovers** | ${baseScan.subdomains.danglingTakeoversFound} Dangling | ${competitorScan.subdomains.danglingTakeoversFound} Dangling | ${vectorAdvantage?.takeoverWinner === "base" ? baseScan.targetDomain : vectorAdvantage?.takeoverWinner === "comp" ? competitorScan.targetDomain : "Parity"} |\n` +
      `| **Anycast DDoS Shielding** | ${baseScan.network?.isAnycastProtected ? "Anycast Mesh" : "Direct Unicast"} | ${competitorScan.network?.isAnycastProtected ? "Anycast Mesh" : "Direct Unicast"} | ${vectorAdvantage?.networkWinner === "base" ? baseScan.targetDomain : vectorAdvantage?.networkWinner === "comp" ? competitorScan.targetDomain : "Parity"} |\n\n` +
      `---\n*Report generated autonomously by SHADOR Target Versus Mode (Akshay Sharma)*`;

    navigator.clipboard.writeText(matrixMd);
    setCopiedMatrix(true);
    setTimeout(() => setCopiedMatrix(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border border-amber-500/40 bg-amber-500/15 text-amber-300">
                <Swords className="h-3.5 w-3.5 text-amber-400" />
                TARGET VERSUS MODE
              </span>

              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border border-cyan-500/40 bg-cyan-500/15 text-cyan-300">
                Dual-Domain Benchmark Arena
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              Competitive Head-to-Head Confrontation: {baseScan.targetDomain} vs Competitor
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Conduct instant side-by-side confrontation against competitors, peer organizations, or secondary perimeters.
              Evaluate relative hardening differentials across email spoofing resilience, TLS cryptography, edge headers,
              and dangling CNAME takeovers.
            </p>
          </div>
        </div>

        {/* Input Bar & Preset Quick Buttons */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunComparison(competitorInput);
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                placeholder="Enter competitor domain (e.g. cloudflare.com, stripe.com, google.com)..."
                className="w-full rounded-xl border border-white/[0.1] bg-[#060813] pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !competitorInput.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold border border-amber-500/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 hover:border-amber-400 disabled:opacity-40 transition-all shadow-md shadow-amber-500/10 active:scale-95 shrink-0"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-300 border-t-transparent animate-spin" />
                  <span>Auditing Competitor...</span>
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4" />
                  <span>Initiate Confrontation</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
            <span className="text-slate-400 mr-1">Instant Benchmark Presets:</span>
            {COMPARISON_PRESETS.map((preset) => (
              <button
                key={preset.domain}
                type="button"
                onClick={() => {
                  setCompetitorInput(preset.domain);
                  handleRunComparison(preset.domain);
                }}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg border border-white/[0.08] bg-[#060813] text-slate-300 hover:border-amber-500/40 hover:text-white transition-all disabled:opacity-50 active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-200 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Confrontation Arena Display */}
      {competitorScan ? (
        <div className="space-y-5">
          {/* Executive Confrontation Scorecard Header */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              {/* Domain A (Base Target) */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                    Primary Target
                  </span>
                  {isBaseVictor && (
                    <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                      <Trophy className="h-3 w-3 text-emerald-400" />
                      RESILIENCE CHAMPION
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-mono font-bold text-white">{baseScan.targetDomain}</h3>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span
                    className={`text-lg font-black font-mono px-3.5 py-1 rounded-xl border ${getGradeBadge(
                      baseScan.score.letterGrade
                    )}`}
                  >
                    [{baseScan.score.letterGrade}]
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Risk Index: <strong>{baseScan.score.score}/100</strong>
                  </span>
                </div>
              </div>

              {/* VS Badge in Center */}
              <div className="shrink-0 flex flex-col items-center justify-center p-3.5 rounded-2xl border border-amber-500/40 bg-[#060813] min-w-[100px] shadow-lg shadow-amber-500/5">
                <Swords className="h-6 w-6 text-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-black text-amber-200 mt-1">VS</span>
                <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {isTie ? "DEAD TIE" : `Δ ${scoreDiff} PTS`}
                </span>
                {vectorAdvantage && (
                  <span className="text-[9px] font-mono text-cyan-300 mt-1">
                    {vectorAdvantage.baseWins} vs {vectorAdvantage.competitorWins} vectors
                  </span>
                )}
              </div>

              {/* Domain B (Competitor) */}
              <div className="flex-1 space-y-2 text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end gap-2">
                  {!isBaseVictor && !isTie && (
                    <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                      <Trophy className="h-3 w-3 text-emerald-400" />
                      RESILIENCE CHAMPION
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Benchmark Competitor
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-mono font-bold text-white">{competitorScan.targetDomain}</h3>
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <span className="text-xs font-mono text-slate-300">
                    Risk Index: <strong>{competitorScan.score.score}/100</strong>
                  </span>
                  <span
                    className={`text-lg font-black font-mono px-3.5 py-1 rounded-xl border ${getGradeBadge(
                      competitorScan.score.letterGrade
                    )}`}
                  >
                    [{competitorScan.score.letterGrade}]
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Export Actions Bar */}
            <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Confrontation Audit Completed · 100% Passive Telemetry
              </span>
              <button
                onClick={handleExportMatrix}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] text-slate-300 hover:text-white hover:border-amber-400 transition-all active:scale-95"
              >
                {copiedMatrix ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied Dossier</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-amber-400" />
                    <span>Export Benchmark Matrix</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Deep Vector Confrontation Matrix Table */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#080c19] flex items-center justify-between">
              <h4 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span>Side-by-Side 6-Vector Security Architecture Confrontation</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Head-to-Head Telemetry</span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {/* Row 1: Email Spoofability */}
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-white/[0.01] transition-colors">
                <div className="md:col-span-4 flex items-center gap-2 text-xs font-mono font-bold text-white">
                  <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                  <div>
                    <span>Email Phishing Defense (RFC 7208 / 7489)</span>
                    <span className="text-[10px] font-mono text-slate-400 block font-normal">
                      SPF Mechanism & DMARC Enforcement
                    </span>
                  </div>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono">
                  <span className="text-[10px] text-slate-400 block mb-0.5">{baseScan.targetDomain}:</span>
                  <div className="flex items-center justify-between">
                    <span>SPF: <code className="text-cyan-300">{baseScan.emailSpoof.spf?.mechanism || "None"}</code></span>
                    <span>DMARC: <code className="text-cyan-300">{baseScan.emailSpoof.dmarc?.policy || "Missing"}</code></span>
                  </div>
                  <span
                    className={`text-[10px] font-bold block mt-1 ${
                      baseScan.emailSpoof.canSpoofDirectly ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {baseScan.emailSpoof.canSpoofDirectly ? "⚠️ Spoofing Possible" : "✅ Hardened Reject"}
                  </span>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono">
                  <span className="text-[10px] text-slate-400 block mb-0.5">{competitorScan.targetDomain}:</span>
                  <div className="flex items-center justify-between">
                    <span>SPF: <code className="text-amber-300">{competitorScan.emailSpoof.spf?.mechanism || "None"}</code></span>
                    <span>DMARC: <code className="text-amber-300">{competitorScan.emailSpoof.dmarc?.policy || "Missing"}</code></span>
                  </div>
                  <span
                    className={`text-[10px] font-bold block mt-1 ${
                      competitorScan.emailSpoof.canSpoofDirectly ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {competitorScan.emailSpoof.canSpoofDirectly ? "⚠️ Spoofing Possible" : "✅ Hardened Reject"}
                  </span>
                </div>
              </div>

              {/* Row 2: Cryptographic TLS */}
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-white/[0.01] transition-colors">
                <div className="md:col-span-4 flex items-center gap-2 text-xs font-mono font-bold text-white">
                  <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span>TLS Cryptography & Lifespan</span>
                    <span className="text-[10px] font-mono text-slate-400 block font-normal">
                      Protocol Level & Expiry Variance
                    </span>
                  </div>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">{baseScan.targetDomain}:</span>
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="text-cyan-300 font-bold">{baseScan.tls.protocol || "Unknown"}</span>
                    <span>{baseScan.tls.daysRemaining} days left</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {baseScan.tls.cipherSuite || "Cipher Suite"}
                  </span>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">{competitorScan.targetDomain}:</span>
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="text-amber-300 font-bold">{competitorScan.tls.protocol || "Unknown"}</span>
                    <span>{competitorScan.tls.daysRemaining} days left</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {competitorScan.tls.cipherSuite || "Cipher Suite"}
                  </span>
                </div>
              </div>

              {/* Row 3: Subdomain & Dangling Takeover Surface */}
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-white/[0.01] transition-colors">
                <div className="md:col-span-4 flex items-center gap-2 text-xs font-mono font-bold text-white">
                  <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
                  <div>
                    <span>Subdomain Perimeter Exposure</span>
                    <span className="text-[10px] font-mono text-slate-400 block font-normal">
                      Asset Count & Dangling CNAMEs
                    </span>
                  </div>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono">
                  <span className="text-[10px] text-slate-400 block mb-0.5">{baseScan.targetDomain}:</span>
                  <div className="flex items-center justify-between">
                    <span>{baseScan.subdomains.discoveredCount} Discovered</span>
                    <span
                      className={`font-bold ${
                        baseScan.subdomains.danglingTakeoversFound > 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {baseScan.subdomains.danglingTakeoversFound} Takeovers
                    </span>
                  </div>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono">
                  <span className="text-[10px] text-slate-400 block mb-0.5">{competitorScan.targetDomain}:</span>
                  <div className="flex items-center justify-between">
                    <span>{competitorScan.subdomains.discoveredCount} Discovered</span>
                    <span
                      className={`font-bold ${
                        competitorScan.subdomains.danglingTakeoversFound > 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {competitorScan.subdomains.danglingTakeoversFound} Takeovers
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 4: OWASP Edge Security Headers */}
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-white/[0.01] transition-colors">
                <div className="md:col-span-4 flex items-center gap-2 text-xs font-mono font-bold text-white">
                  <Shield className="h-4 w-4 text-cyan-400 shrink-0" />
                  <div>
                    <span>Edge Defensive Headers (OWASP)</span>
                    <span className="text-[10px] font-mono text-slate-400 block font-normal">
                      HSTS, CSP & Clickjacking Posture
                    </span>
                  </div>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono">
                  <span className="text-[10px] text-slate-400 block mb-0.5">{baseScan.targetDomain}:</span>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300 font-bold">Score: {baseScan.headers.score}/100</span>
                    <span className="text-slate-400">{baseScan.headers.missingCount} Missing</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    HTTPS Forced: {baseScan.headers.forcesHttpsRedirect ? "Yes" : "No"}
                  </span>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono">
                  <span className="text-[10px] text-slate-400 block mb-0.5">{competitorScan.targetDomain}:</span>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-bold">Score: {competitorScan.headers.score}/100</span>
                    <span className="text-slate-400">{competitorScan.headers.missingCount} Missing</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    HTTPS Forced: {competitorScan.headers.forcesHttpsRedirect ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              {/* Row 5: WAF & Anycast Network Architecture */}
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-white/[0.01] transition-colors">
                <div className="md:col-span-4 flex items-center gap-2 text-xs font-mono font-bold text-white">
                  <Flame className="h-4 w-4 text-orange-400 shrink-0" />
                  <div>
                    <span>Ingress Network & DDoS Anycast</span>
                    <span className="text-[10px] font-mono text-slate-400 block font-normal">
                      Volumetric Scrubbing & Autonomous System
                    </span>
                  </div>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">{baseScan.targetDomain}:</span>
                  <span className="text-cyan-300 font-bold block">
                    {baseScan.network?.isAnycastProtected ? "Anycast Edge Scrubbing" : "Direct Unicast Origin"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {baseScan.network?.primaryAsn?.asn || "AS-Unknown"} ({baseScan.network?.primaryAsn?.organization || "Provider"})
                  </span>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">{competitorScan.targetDomain}:</span>
                  <span className="text-amber-300 font-bold block">
                    {competitorScan.network?.isAnycastProtected ? "Anycast Edge Scrubbing" : "Direct Unicast Origin"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {competitorScan.network?.primaryAsn?.asn || "AS-Unknown"} ({competitorScan.network?.primaryAsn?.organization || "Provider"})
                  </span>
                </div>
              </div>

              {/* Row 6: Passive Technology Threat Horizon */}
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-white/[0.01] transition-colors">
                <div className="md:col-span-4 flex items-center gap-2 text-xs font-mono font-bold text-white">
                  <Cpu className="h-4 w-4 text-purple-400 shrink-0" />
                  <div>
                    <span>Technology Horizon & Token Leaks</span>
                    <span className="text-[10px] font-mono text-slate-400 block font-normal">
                      Server Obfuscation & CISA KEV Exposure
                    </span>
                  </div>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">{baseScan.targetDomain}:</span>
                  <span className="text-cyan-300 font-bold block">
                    {baseScan.techStack?.primaryServer || "Tokens Sanitized"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {baseScan.techStack?.totalIdentified || 0} Layers Detected
                  </span>
                </div>

                <div className="md:col-span-4 p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">{competitorScan.targetDomain}:</span>
                  <span className="text-amber-300 font-bold block">
                    {competitorScan.techStack?.primaryServer || "Tokens Sanitized"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {competitorScan.techStack?.totalIdentified || 0} Layers Detected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-8 sm:p-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Swords className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-mono font-bold text-white">Dual-Perimeter Benchmark Arena Ready</h3>
            <p className="text-xs font-mono text-slate-400 max-w-md mx-auto leading-relaxed">
              Enter any competitor domain above or choose an instant benchmark preset to launch a real-time side-by-side
              architectural confrontation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
