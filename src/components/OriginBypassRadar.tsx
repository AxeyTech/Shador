"use client";

import React, { useState } from "react";
import {
  Flame,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Server,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Search,
  Radio,
  Lock,
  Archive,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Globe,
  Code2,
} from "lucide-react";
import type { OriginBypassResult, RiskLevel } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";

interface OriginBypassRadarProps {
  originBypass: OriginBypassResult;
  targetDomain: string;
}

export function OriginBypassRadar({ originBypass, targetDomain }: OriginBypassRadarProps) {
  const { playClick, playPing, playAlert, playDownload } = useTacticalAudio();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showHardeningGuide, setShowHardeningGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<"candidates" | "time-machine" | "remediation">("candidates");

  const handleCopy = (text: string, id: string) => {
    playDownload();
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case "critical":
        return {
          border: "border-rose-500/50",
          bg: "bg-rose-500/15",
          text: "text-rose-300",
          label: "CRITICAL ORIGIN LEAK",
          icon: ShieldAlert,
        };
      case "warning":
        return {
          border: "border-amber-500/50",
          bg: "bg-amber-500/15",
          text: "text-amber-300",
          label: "ELEVATED BYPASS RISK",
          icon: AlertTriangle,
        };
      case "secure":
      default:
        return {
          border: "border-emerald-500/50",
          bg: "bg-emerald-500/15",
          text: "text-emerald-300",
          label: "SOLID WAF ENCAPSULATION",
          icon: ShieldCheck,
        };
    }
  };

  const statusBadge = getRiskBadge(originBypass.bypassRiskLevel);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="space-y-6">
      {/* Executive Radar Header Card - Solid Opaque */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border border-rose-500/40 bg-rose-500/15 text-rose-300">
                <Flame className="h-3.5 w-3.5 text-rose-400" />
                CLOUDFLARE & WAF ORIGIN BYPASS RADAR
              </span>

              <span
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border ${statusBadge.border} ${statusBadge.bg} ${statusBadge.text}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {statusBadge.label}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
              <span>Origin Backend Detection & Historical DNS</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              {originBypass.summary}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#060813] text-center min-w-[120px]">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">WAF Edge</span>
              <span className="text-sm font-bold font-mono text-cyan-300">{originBypass.wafProvider || "None"}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#060813] text-center min-w-[120px]">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Origin Leaks</span>
              <span
                className={`text-sm font-bold font-mono ${
                  originBypass.candidates.length > 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {originBypass.candidates.length} Candidate{originBypass.candidates.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* WAF Telemetry Evidence Chips */}
        {originBypass.wafEvidence.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 font-semibold mr-1">Edge Signatures:</span>
            {originBypass.wafEvidence.map((ev, idx) => (
              <span
                key={idx}
                className="text-xs font-mono px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 flex items-center gap-1.5"
              >
                <Server className="h-3 w-3 text-cyan-400" />
                {ev}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            playClick();
            setActiveTab("candidates");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all whitespace-nowrap ${
            activeTab === "candidates"
              ? "bg-rose-500/20 text-rose-200 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Surfaced Origin Candidates ({originBypass.candidates.length})</span>
        </button>

        <button
          onClick={() => {
            playClick();
            setActiveTab("time-machine");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all whitespace-nowrap ${
            activeTab === "time-machine"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Historical DNS Time-Machine ({originBypass.historicalTools.length} Tools)</span>
        </button>

        <button
          onClick={() => {
            playClick();
            setActiveTab("remediation");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all whitespace-nowrap ${
            activeTab === "remediation"
              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Hardening & DevOps Guide</span>
        </button>
      </div>

      {/* TAB 1: Surfaced Origin Candidates */}
      {activeTab === "candidates" && (
        <div className="space-y-4">
          {originBypass.candidates.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-8 text-center space-y-3">
              <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-mono font-bold text-white">No Direct Origin Server Leaks Detected</h3>
              <p className="text-xs font-mono text-slate-400 max-w-lg mx-auto leading-relaxed">
                All discovered subdomains, mail exchanges, and SPF records are proxied behind Anycast edge routing.
                Check the <strong>Historical DNS Time-Machine</strong> tab to search historical records recorded prior to CDN onboarding.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {originBypass.candidates.map((cand, idx) => {
                const isHigh = cand.confidence === "high";
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 sm:p-6 shadow-xl space-y-4 transition-all hover:border-rose-500/30"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl border ${
                            isHigh
                              ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                              : "border-amber-500/40 bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          <Server className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold font-mono text-white tracking-wide">{cand.ip}</span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                                isHigh
                                  ? "border-rose-500/40 bg-rose-500/20 text-rose-300"
                                  : "border-amber-500/40 bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {cand.confidence} Confidence
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            {cand.asn?.asn ? `${cand.asn.asn} · ${cand.asn.organization}` : "Autonomous System"} (
                            {cand.asn?.countryCode || "Global"})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 bg-[#060813] px-3 py-1.5 rounded-xl border border-white/[0.08]">
                          Source: <strong className="text-slate-200 capitalize">{cand.source.replace("_", " ")}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Source Detail Explanation */}
                    <div className="p-3 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono text-slate-300 leading-relaxed">
                      {cand.sourceDetail}
                    </div>

                    {/* 1-Click Verification Command Box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                          <Terminal className="h-3.5 w-3.5" />
                          1-Click WAF Bypass Verification PoC (HTTPS):
                        </span>
                        <span className="text-[10px] text-slate-400">Direct Host-Header Probe</span>
                      </div>

                      <div className="relative flex items-center rounded-xl border border-cyan-500/30 bg-[#060813] p-3 text-xs font-mono text-cyan-200 overflow-x-auto scrollbar-thin">
                        <span className="select-all pr-12">{cand.validationCommand}</span>
                        <button
                          onClick={() => handleCopy(cand.validationCommand, `cmd-https-${idx}`)}
                          className="absolute right-2 top-2 p-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 transition-all"
                          title="Copy HTTPS Verification Command"
                        >
                          {copiedCmd === `cmd-https-${idx}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Secondary Commands (HTTP & Nmap) */}
                    <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#060813] px-3 py-2 text-xs font-mono">
                        <span className="text-slate-400 truncate mr-2">HTTP: {cand.validationCommandHttp}</span>
                        <button
                          onClick={() => handleCopy(cand.validationCommandHttp, `cmd-http-${idx}`)}
                          className="p-1 rounded text-slate-400 hover:text-white shrink-0"
                          title="Copy HTTP Command"
                        >
                          {copiedCmd === `cmd-http-${idx}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#060813] px-3 py-2 text-xs font-mono">
                        <span className="text-slate-400 truncate mr-2">Nmap: {cand.nmapCommand}</span>
                        <button
                          onClick={() => handleCopy(cand.nmapCommand, `cmd-nmap-${idx}`)}
                          className="p-1 rounded text-slate-400 hover:text-white shrink-0"
                          title="Copy Nmap Command"
                        >
                          {copiedCmd === `cmd-nmap-${idx}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Adversary Exploitation Narrative */}
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 sm:p-6 space-y-3">
            <h4 className="text-sm font-mono font-bold text-rose-300 flex items-center gap-2">
              <Zap className="h-4 w-4 text-rose-400" />
              How Adversaries Weaponize Leaked Origin Server IPs:
            </h4>
            <div className="grid sm:grid-cols-3 gap-3 text-xs font-mono text-slate-300">
              <div className="p-3 rounded-xl border border-rose-500/20 bg-[#060813]">
                <strong className="text-rose-200 block mb-1">1. Complete WAF Bypass</strong>
                Cloudflare OWASP rules, rate limiting, and bot-fight modes are ignored when requests hit origin IP directly.
              </div>
              <div className="p-3 rounded-xl border border-rose-500/20 bg-[#060813]">
                <strong className="text-rose-200 block mb-1">2. Direct DDoS Inundation</strong>
                Attackers flood the bare-metal port 80/443 without passing through Cloudflare Anycast DDoS scrubbing centers.
              </div>
              <div className="p-3 rounded-xl border border-rose-500/20 bg-[#060813]">
                <strong className="text-rose-200 block mb-1">3. Direct Port Scanning</strong>
                Ports blocked by Cloudflare (e.g., 22 SSH, 3306 MySQL, 5432 Postgres, 8080 Admin) become reachable directly.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Historical DNS Time-Machine */}
      {activeTab === "time-machine" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-200 flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>OSINT Principle:</strong> When organizations onboard to Cloudflare or Akamai, historical A/AAAA
              records prior to migration remain permanently recorded in historical DNS archives. Click any deep-link
              below to retrieve the historical origin hosting records.
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {originBypass.historicalTools.map((tool) => (
              <a
                key={tool.id}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={playClick}
                className="group rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 shadow-xl transition-all hover:border-amber-500/40 hover:bg-[#0f1426] flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/20 text-amber-300">
                      {tool.badge}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-300 transition-colors" />
                  </div>

                  <h4 className="text-sm font-mono font-bold text-white group-hover:text-amber-200 transition-colors">
                    {tool.name}
                  </h4>

                  <p className="text-xs text-slate-400 leading-relaxed">{tool.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-amber-300">
                  <span>Launch Query Pivot</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Hardening & DevOps Remediation Guide */}
      {activeTab === "remediation" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-200 flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Hardening Standard:</strong> Follow these verified mitigation blueprints to isolate backend origin
              servers so they cannot be reached by public attackers even if the IP is known.
            </span>
          </div>

          <div className="space-y-4">
            {originBypass.remediationAdvice.map((rem, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 sm:p-6 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-emerald-400" />
                    {rem.title}
                  </h4>
                  {rem.language && (
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      {rem.language}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-mono">{rem.description}</p>

                {rem.codeSnippet && (
                  <div className="relative mt-2">
                    <pre className="rounded-xl border border-emerald-500/20 bg-[#060813] p-4 text-xs font-mono text-emerald-200 overflow-x-auto scrollbar-thin">
                      <code>{rem.codeSnippet}</code>
                    </pre>
                    <button
                      onClick={() => handleCopy(rem.codeSnippet!, `rem-${idx}`)}
                      className="absolute right-3 top-3 p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all"
                      title="Copy Code Snippet"
                    >
                      {copiedCmd === `rem-${idx}` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
