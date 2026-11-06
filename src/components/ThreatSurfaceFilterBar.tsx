"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  X,
  Filter,
  ShieldAlert,
  Flame,
  Globe,
  Mail,
  Shield,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Radio,
  Key,
  BookOpen,
  Crosshair,
  ListFilter,
  Zap,
  Cpu,
  KeyRound,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import type { CompleteScanResult } from "@/lib/types/scanner";

interface ThreatSurfaceFilterBarProps {
  scan: CompleteScanResult;
  activeTab: string;
  onSelectTab: (
    tab:
      | "overview"
      | "email"
      | "subdomains"
      | "tls"
      | "headers"
      | "drift"
      | "network"
      | "mitre"
      | "dorks"
      | "origin"
      | "watchlist"
      | "cli"
      | "breach"
      | "compare"
      | "satellite"
      | "dnssec"
      | "heatmap"
      | "methodology"
      | "killchain"
      | "batch"
      | "hardening"
      | "techstack"
      | "reputation"
      | "secretdorks",
    sectionId?: string
  ) => void;
}

interface FilterMatch {
  id: string;
  tab:
    | "email"
    | "subdomains"
    | "tls"
    | "headers"
    | "network"
    | "origin"
    | "breach"
    | "mitre"
    | "satellite"
    | "dnssec"
    | "methodology"
    | "killchain"
    | "batch"
    | "hardening"
    | "techstack"
    | "reputation"
    | "secretdorks";
  sectionId: string;
  title: string;
  subtitle: string;
  severity: "critical" | "warning" | "info" | "success";
  icon: React.ComponentType<{ className?: string }>;
}

export function ThreatSurfaceFilterBar({
  scan,
  activeTab,
  onSelectTab,
}: ThreatSurfaceFilterBarProps) {
  const { playClick, playAlert, playDownload } = useTacticalAudio();
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "critical" | "warning" | "optimal"
  >("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+/ or Cmd+/ to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute live match items across all attack surface telemetry
  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    const results: FilterMatch[] = [];

    // 1. Email Vector
    const emailSpoofable = scan.emailSpoof.canSpoofDirectly;
    const emailCritical = scan.emailSpoof.status === "critical";
    if (
      !q ||
      "email spf dmarc spoof phishing bimi mta-sts".includes(q) ||
      scan.emailSpoof.spf.mechanism.includes(q) ||
      scan.emailSpoof.dmarc.policy.includes(q)
    ) {
      results.push({
        id: "match-email",
        tab: "email",
        sectionId: "email-spoof-panel",
        title: "Email Spoofability & DMARC",
        subtitle: emailSpoofable
          ? `Direct Phishing Feasible (DMARC: ${scan.emailSpoof.dmarc.policy}, SPF: ${scan.emailSpoof.spf.mechanism})`
          : `Hardened Posture (DMARC: ${scan.emailSpoof.dmarc.policy})`,
        severity: emailCritical ? "critical" : emailSpoofable ? "warning" : "success",
        icon: Mail,
      });
    }

    // 2. Subdomains Vector
    const takeovers = scan.subdomains.danglingTakeoversFound;
    if (
      !q ||
      "subdomain cname takeover dns crt.sh certificate transparency".includes(q) ||
      scan.subdomains.subdomains.some(
        (s) =>
          s.domain.toLowerCase().includes(q) ||
          (s.cname && s.cname.toLowerCase().includes(q))
      )
    ) {
      results.push({
        id: "match-subdomains",
        tab: "subdomains",
        sectionId: "subdomain-panel",
        title: "Subdomain Enumeration & Takeovers",
        subtitle:
          takeovers > 0
            ? `${takeovers} Dangling CNAME Takeover Vulnerabilities Found`
            : `${scan.subdomains.discoveredCount} Subdomains Discovered (Zero Orphaned Pointers)`,
        severity: takeovers > 0 ? "critical" : "success",
        icon: Globe,
      });
    }

    // 3. WAF Origin Leaks
    const hasOriginCandidates =
      (scan.originBypass?.candidates && scan.originBypass.candidates.length > 0) ||
      false;
    if (
      !q ||
      "origin cloudflare waf bypass ip time-machine historical dns".includes(q) ||
      scan.originBypass?.wafProvider?.toLowerCase().includes(q)
    ) {
      results.push({
        id: "match-origin",
        tab: "origin",
        sectionId: "origin-bypass-panel",
        title: "Cloudflare Origin IP & Historical DNS",
        subtitle: hasOriginCandidates
          ? `${scan.originBypass?.candidates.length} Candidate Backend Origin IPs Discovered`
          : scan.originBypass?.isBehindWaf
          ? `Protected behind ${scan.originBypass.wafProvider || "WAF"} Reverse Proxy`
          : "Direct Unproxied Server Ingress",
        severity: hasOriginCandidates ? "warning" : "info",
        icon: Flame,
      });
    }

    // 4. Edge Defensive Headers
    const headersMissing = scan.headers.missingCount;
    if (
      !q ||
      "header hsts csp security.txt owasp x-frame-options xss".includes(q) ||
      scan.headers.criticalMissing.some((h) => h.toLowerCase().includes(q))
    ) {
      results.push({
        id: "match-headers",
        tab: "headers",
        sectionId: "headers-panel",
        title: "OWASP Edge Defense & HTTP Headers",
        subtitle:
          headersMissing > 0
            ? `${headersMissing} Defensive Headers Missing (Score: ${scan.headers.score}/100)`
            : "Fully Hardened Header Perimeter (Score: 100/100)",
        severity:
          scan.headers.score < 40
            ? "critical"
            : scan.headers.score < 75
            ? "warning"
            : "success",
        icon: Shield,
      });
    }

    // 5. Dark Web & Breach Exposure
    if (
      !q ||
      "breach dark web credentials password leak email pattern".includes(q) ||
      (scan.breachRadar &&
        scan.breachRadar.historicalBreaches.some((b) =>
          b.name.toLowerCase().includes(q)
        ))
    ) {
      const breachRisk = scan.breachRadar?.exposureRiskLevel || "info";
      results.push({
        id: "match-breach",
        tab: "breach",
        sectionId: "breach-panel",
        title: "Dark Web & Breach Exposure Radar",
        subtitle:
          breachRisk === "critical"
            ? "Severe Credential Stuffing & Password Spray Exposure Risk"
            : `Exposure Index: ${breachRisk.toUpperCase()} (${scan.breachRadar?.historicalBreaches.length || 0} Dump Correlations)`,
        severity:
          breachRisk === "critical"
            ? "critical"
            : breachRisk === "warning"
            ? "warning"
            : "info",
        icon: Users,
      });
    }

    // 6. Global Satellite DNS & Propagation Radar
    if (
      !q ||
      "satellite dns propagation resolver latency anycast geodns dig".includes(q)
    ) {
      const sat = scan.satelliteRadar;
      if (sat) {
        results.push({
          id: "match-satellite",
          tab: "satellite",
          sectionId: "satellite-panel",
          title: "Global Multi-Resolver Satellite HUD",
          subtitle: `${sat.propagationPercentage}% Propagation Across 6 Worldwide Backbones (${sat.averageLatencyMs}ms Avg Latency)`,
          severity:
            sat.propagationPercentage === 100
              ? "success"
              : sat.isGeoDnsActive
              ? "info"
              : "warning",
          icon: Radio,
        });
      }
    }

    // 10. DNSSEC & AXFR Zone Vector
    if (scan.authoritativeDns) {
      const dnssecActive = scan.authoritativeDns.dnssec.isEnabled;
      if (
        !q ||
        "dnssec axfr zone transfer soa nameserver ns rrsig digest".includes(q) ||
        scan.authoritativeDns.nameservers.some((n) => n.host.toLowerCase().includes(q))
      ) {
        results.push({
          id: "match-dnssec",
          tab: "dnssec",
          sectionId: "dnssec-panel",
          title: "Authoritative DNSSEC & AXFR Zone Transfer",
          subtitle: dnssecActive
            ? `Cryptographic Root Chain Verified (${scan.authoritativeDns.nameservers.length} NS, AXFR Secured)`
            : `Unsigned DNS Zone - Spoofing / Poisoning Risk (${scan.authoritativeDns.nameservers.length} Nameservers)`,
          severity: dnssecActive ? "success" : "warning",
          icon: Key,
        });
      }
    }

    // 11. OWASP WSTG & Bug Bounty Methodology Checklist
    if (
      !q ||
      "methodology checklist wstg ptes owasp pentest workflow bounty".includes(q)
    ) {
      results.push({
        id: "match-methodology",
        tab: "methodology",
        sectionId: "methodology-panel",
        title: "OWASP WSTG v4.2 Pentest Methodology Studio",
        subtitle: "20 standardized reconnaissance and verification execution vectors",
        severity: "info",
        icon: BookOpen,
      });
    }

    // 12. Cyber Kill Chain & Attack Path Simulator
    if (
      !q ||
      "kill chain killchain attack path exploit chain adversary sequence simulator".includes(q)
    ) {
      results.push({
        id: "match-killchain",
        tab: "killchain",
        sectionId: "attack-path-panel",
        title: "Autonomous Cyber Kill Chain & Attack Path Simulator",
        subtitle: "Simulated multi-vector exploitation chains and blue-team break-the-chain disruptors",
        severity: "critical",
        icon: Crosshair,
      });
    }

    // 13. Scope Queue & Batch Recon Hub
    if (
      !q ||
      "batch scope queue bulk multi-target targets csv export list".includes(q)
    ) {
      results.push({
        id: "match-batch",
        tab: "batch",
        sectionId: "batch-recon-panel",
        title: "Multi-Target Scope Queue & Batch Recon Hub",
        subtitle: "Bulk attack surface scope ingestion, parallel queue runner, and CSV/JSON export",
        severity: "info",
        icon: ListFilter,
      });
    }

    // 14. Defensive Hardening Policy Studio
    if (
      !q ||
      "hardening nginx bind9 terraform aws route53 takeovers scripts policy remediate fix".includes(q)
    ) {
      results.push({
        id: "match-hardening",
        tab: "hardening",
        sectionId: "hardening-panel",
        title: "Defensive Hardening Configuration & Policy Studio",
        subtitle: "Copy-paste Nginx .conf, BIND9 zone files, Cloudflare Terraform & AWS Route 53 scripts",
        severity: "info",
        icon: Zap,
      });
    }

    // 15. Passive Technology Stack Fingerprint Studio
    if (scan.techStack) {
      if (
        !q ||
        "tech stack technology fingerprint server cms framework cdn waf software version nginx apache cloudflare".includes(q) ||
        scan.techStack.detectedTechnologies.some((t) => t.name.toLowerCase().includes(q))
      ) {
        results.push({
          id: "match-techstack",
          tab: "techstack",
          sectionId: "techstack-panel",
          title: "Passive Technology Stack Fingerprint Studio",
          subtitle: `${scan.techStack.totalIdentified} software layers identified (Server: ${scan.techStack.primaryServer || "Hardened"})`,
          severity: "info",
          icon: Cpu,
        });
      }
    }

    // 16. Reputation Threat Intelligence & IP Toxicity Radar
    if (scan.threatReputation) {
      const isToxic = scan.threatReputation.toxicityScore >= 36;
      if (
        !q ||
        "reputation ip threat toxicity blacklist spamhaus abuseipdb tor bogon spam clean".includes(q) ||
        scan.threatReputation.targetIp.includes(q)
      ) {
        results.push({
          id: "match-reputation",
          tab: "reputation",
          sectionId: "reputation-panel",
          title: "Reputation Threat Intelligence & IP Toxicity Radar",
          subtitle: `Toxicity Score: ${scan.threatReputation.toxicityScore}/100 [${scan.threatReputation.threatClassification}] (${scan.threatReputation.blacklistsFlagged} flagged)`,
          severity: isToxic ? "critical" : "success",
          icon: Radio,
        });
      }
    }

    // 17. Public Secret Exposure & Code Dork Radar
    if (scan.secretDorks) {
      const hasCritical = scan.secretDorks.criticalVectors > 0;
      if (
        !q ||
        "secrets dork dorks api key github gitlab pastebin shodan token akia credentials .env".includes(q) ||
        scan.secretDorks.dorks.some((d) => d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q))
      ) {
        results.push({
          id: "match-secretdorks",
          tab: "secretdorks",
          sectionId: "secretdorks-panel",
          title: "Public Secret Exposure & Code Dork Radar",
          subtitle: `${scan.secretDorks.totalVectors} active query patterns (${scan.secretDorks.criticalVectors} critical exposure vectors)`,
          severity: hasCritical ? "critical" : "warning",
          icon: KeyRound,
        });
      }
    }

    // Apply severity filter
    if (severityFilter === "critical") {
      return results.filter((r) => r.severity === "critical");
    }
    if (severityFilter === "warning") {
      return results.filter((r) => r.severity === "warning" || r.severity === "critical");
    }
    if (severityFilter === "optimal") {
      return results.filter((r) => r.severity === "success" || r.severity === "info");
    }
    return results;
  }, [query, severityFilter, scan]);

  const handleChipClick = (match: FilterMatch) => {
    playClick();
    onSelectTab(match.tab, match.sectionId);
  };

  const handleClear = () => {
    setQuery("");
    setSeverityFilter("all");
    inputRef.current?.focus();
  };

  return (
    <div
      className="p-3 sm:p-3.5 rounded-2xl border border-white/[0.1] shadow-xl space-y-2.5 select-none"
      style={{ backgroundColor: "#080c18" }}
    >
      {/* Search Input Bar & Tactical Filter HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter attack vectors: 'cname', 'spf', 'origin', 'hsts', 'breach'..."
            className="w-full pl-9 pr-16 py-2 rounded-xl border border-white/[0.08] bg-[#05070e] text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 transition-all"
          />
          {query ? (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white transition-colors"
              title="Clear search query"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 rounded hidden sm:inline">
              Ctrl + /
            </span>
          )}
        </div>

        {/* Severity Filter Toggle Pills */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => {
              playClick();
              setSeverityFilter("all");
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono font-bold transition-all ${
              severityFilter === "all"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
            }`}
          >
            All Vectors
          </button>
          <button
            onClick={() => {
              playClick();
              setSeverityFilter("critical");
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono font-bold flex items-center gap-1 transition-all ${
              severityFilter === "critical"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                : "bg-white/[0.03] text-slate-400 hover:text-rose-300 border border-white/[0.06]"
            }`}
          >
            <ShieldAlert className="h-3 w-3" />
            Critical Only
          </button>
          <button
            onClick={() => {
              playClick();
              setSeverityFilter("warning");
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono font-bold flex items-center gap-1 transition-all ${
              severityFilter === "warning"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                : "bg-white/[0.03] text-slate-400 hover:text-amber-300 border border-white/[0.06]"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Warnings
          </button>
          <button
            onClick={() => {
              playClick();
              setSeverityFilter("optimal");
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono font-bold flex items-center gap-1 transition-all ${
              severityFilter === "optimal"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                : "bg-white/[0.03] text-slate-400 hover:text-emerald-300 border border-white/[0.06]"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            Optimal
          </button>
        </div>
      </div>

      {/* Live Matching Telemetry Pills */}
      {matches.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-0.5">
          <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>{matches.length} Telemetry Vector{matches.length === 1 ? "" : "s"}:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {matches.map((m) => {
              const Icon = m.icon;
              const isSelected = activeTab === m.tab;
              return (
                <button
                  key={m.id}
                  onClick={() => handleChipClick(m)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-mono border shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      : m.severity === "critical"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:border-rose-400"
                      : m.severity === "warning"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400"
                      : "border-white/[0.1] bg-white/[0.04] text-slate-300 hover:border-cyan-400/50"
                  }`}
                  title={m.subtitle}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="font-semibold">{m.title}</span>
                  <ArrowRight className="h-2.5 w-2.5 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-2 text-center text-xs font-mono text-slate-400 bg-white/[0.02] rounded-lg border border-white/[0.06]">
          No security vectors match query &apos;{query}&apos;. Try searching &apos;cname&apos;, &apos;spf&apos;, or &apos;origin&apos;.
        </div>
      )}
    </div>
  );
}
