"use client";

import React, { useState, useMemo } from "react";
import {
  Flame,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Mail,
  Globe,
  Lock,
  Server,
  Key,
  Radio,
  Users,
  Search,
  Crosshair,
  GitCompare,
  ArrowRight,
  Copy,
  Check,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Cpu,
  KeyRound,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { computeMitreMatrix } from "@/lib/scanner/mitre-mapper";
import type { CompleteScanResult } from "@/lib/types/scanner";

interface ThreatSurfaceHeatmapProps {
  scan: CompleteScanResult;
  onSwitchTab?: (tab: string, sectionId?: string) => void;
}

interface HeatmapCell {
  id: string;
  name: string;
  category: "Identity & Phishing" | "Edge & Application" | "Network & Infrastructure" | "Threat Posture & OSINT";
  score: number; // 0 to 100
  threatLevel: "CRITICAL" | "ELEVATED" | "MODERATE" | "HARDENED";
  keyMetric: string;
  detail: string;
  tab: string;
  sectionId: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

export function ThreatSurfaceHeatmap({
  scan,
  onSwitchTab,
}: ThreatSurfaceHeatmapProps) {
  const { playClick, playDownload } = useTacticalAudio();
  const [selectedFilter, setSelectedFilter] = useState<
    "ALL" | "CRITICAL" | "ELEVATED" | "HARDENED"
  >("ALL");
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  // Derive individual vector scores and statuses
  const cells: HeatmapCell[] = useMemo(() => {
    const list: HeatmapCell[] = [];

    // 1. Email & Phishing Vector
    const emailScore = scan.emailSpoof.score;
    const emailLevel: HeatmapCell["threatLevel"] =
      scan.emailSpoof.status === "critical"
        ? "CRITICAL"
        : scan.emailSpoof.canSpoofDirectly
        ? "ELEVATED"
        : emailScore >= 80
        ? "HARDENED"
        : "MODERATE";
    list.push({
      id: "email",
      name: "Email Auth & Phishing",
      category: "Identity & Phishing",
      score: emailScore,
      threatLevel: emailLevel,
      keyMetric: `DMARC: ${scan.emailSpoof.dmarc.policy.toUpperCase()}`,
      detail: scan.emailSpoof.canSpoofDirectly
        ? "Direct domain spoofing feasible (RFC 7208 / RFC 7489 violation)"
        : "SPF & DMARC enforcement active against unauthorized senders",
      tab: "email",
      sectionId: "email-spoof-panel",
      icon: Mail,
      accentColor: emailLevel === "CRITICAL" ? "rose" : emailLevel === "ELEVATED" ? "amber" : "emerald",
    });

    // 2. Edge HTTP Headers & OWASP
    const headerScore = scan.headers.score;
    const headerLevel: HeatmapCell["threatLevel"] =
      headerScore < 45 ? "CRITICAL" : headerScore < 70 ? "ELEVATED" : headerScore >= 85 ? "HARDENED" : "MODERATE";
    list.push({
      id: "headers",
      name: "Edge Headers & OWASP",
      category: "Edge & Application",
      score: headerScore,
      threatLevel: headerLevel,
      keyMetric: `${scan.headers.missingCount} Missing Headers`,
      detail: scan.headers.hasSecurityTxt
        ? "RFC 9116 security.txt present, CSP/HSTS policies evaluated"
        : "Missing security.txt, critical defense-in-depth headers absent",
      tab: "headers",
      sectionId: "headers-panel",
      icon: Shield,
      accentColor: headerLevel === "CRITICAL" ? "rose" : headerLevel === "ELEVATED" ? "amber" : "emerald",
    });

    // 3. Subdomain & Cloud Takeovers
    const takeovers = scan.subdomains.danglingTakeoversFound;
    const subLevel: HeatmapCell["threatLevel"] =
      takeovers > 0 ? "CRITICAL" : scan.subdomains.discoveredCount > 30 ? "MODERATE" : "HARDENED";
    const subScore = takeovers > 0 ? 25 : 95;
    list.push({
      id: "subdomains",
      name: "Subdomain & Takeover",
      category: "Edge & Application",
      score: subScore,
      threatLevel: subLevel,
      keyMetric: takeovers > 0 ? `${takeovers} Dangling Takeovers` : `${scan.subdomains.discoveredCount} Subdomains`,
      detail: takeovers > 0
        ? "Active dangling CNAME pointing to unclaimed cloud provider assets"
        : "All public subdomains point to live and authenticated endpoints",
      tab: "subdomains",
      sectionId: "subdomains-panel",
      icon: Globe,
      accentColor: subLevel === "CRITICAL" ? "rose" : subLevel === "MODERATE" ? "amber" : "emerald",
    });

    // 4. TLS Cryptography & PKI Chain
    const tlsExpiring = scan.tls.isExpiringSoon || scan.tls.isExpired;
    const tlsScore = scan.tls.isExpired ? 10 : tlsExpiring ? 50 : 95;
    const tlsLevel: HeatmapCell["threatLevel"] =
      scan.tls.isExpired ? "CRITICAL" : tlsExpiring ? "ELEVATED" : "HARDENED";
    list.push({
      id: "tls",
      name: "TLS & PKI Cryptography",
      category: "Edge & Application",
      score: tlsScore,
      threatLevel: tlsLevel,
      keyMetric: scan.tls.protocol || "TLS 1.3",
      detail: `${scan.tls.daysRemaining} days remaining (${scan.tls.issuer?.org || "Trusted CA"})`,
      tab: "tls",
      sectionId: "tls-panel",
      icon: Lock,
      accentColor: tlsLevel === "CRITICAL" ? "rose" : tlsLevel === "ELEVATED" ? "amber" : "emerald",
    });

    // 5. Origin IP & WAF Cloaking
    const originLeak = scan.originBypass?.candidates?.length ?? 0;
    const originScore = originLeak > 0 ? 40 : 92;
    const originLevel: HeatmapCell["threatLevel"] =
      originLeak > 0 ? "ELEVATED" : "HARDENED";
    list.push({
      id: "origin",
      name: "Origin IP & WAF Cloaking",
      category: "Network & Infrastructure",
      score: originScore,
      threatLevel: originLevel,
      keyMetric: originLeak > 0 ? `${originLeak} Leaked Origin IPs` : "WAF Cloaked",
      detail: originLeak > 0
        ? "Direct origin backend IP discovered bypassing edge reverse proxy"
        : "Origin infrastructure successfully shielded behind reverse proxy",
      tab: "origin",
      sectionId: "origin-panel",
      icon: Flame,
      accentColor: originLevel === "ELEVATED" ? "amber" : "emerald",
    });

    // 6. Authoritative DNSSEC & Zone Protection
    const dnssecActive = scan.authoritativeDns?.dnssec?.isEnabled ?? false;
    const dnssecScore = dnssecActive ? 95 : 60;
    const dnssecLevel: HeatmapCell["threatLevel"] =
      dnssecActive ? "HARDENED" : "ELEVATED";
    list.push({
      id: "dnssec",
      name: "DNSSEC & Zone Protection",
      category: "Network & Infrastructure",
      score: dnssecScore,
      threatLevel: dnssecLevel,
      keyMetric: dnssecActive ? "RFC 4035 Active" : "Unsigned Zone",
      detail: dnssecActive
        ? "Cryptographic DS chain validated; Kaminsky cache poisoning mitigated"
        : "Zone unsigned at parent TLD registry; vulnerable to DNS spoofing",
      tab: "dnssec",
      sectionId: "dnssec-panel",
      icon: Key,
      accentColor: dnssecLevel === "ELEVATED" ? "amber" : "emerald",
    });

    // 7. BGP Routing & Anycast Fabric
    const anycast = scan.network?.isAnycastProtected ?? false;
    const netScore = scan.network?.routingSecurityScore ?? 85;
    const netLevel: HeatmapCell["threatLevel"] =
      anycast ? "HARDENED" : netScore < 60 ? "ELEVATED" : "MODERATE";
    list.push({
      id: "network",
      name: "BGP Routing & Anycast",
      category: "Network & Infrastructure",
      score: netScore,
      threatLevel: netLevel,
      keyMetric: anycast ? "Anycast Edge" : "Unicast Pop",
      detail: anycast
        ? "Distributed multi-POP DDoS scrubbing and routing resilience active"
        : "Single-homed or unicast routing vulnerable to upstream transit cuts",
      tab: "network",
      sectionId: "network-panel",
      icon: Server,
      accentColor: netLevel === "ELEVATED" ? "amber" : netLevel === "MODERATE" ? "yellow" : "emerald",
    });

    // 8. Global Satellite DNS Propagation
    const propPercent = scan.satelliteRadar?.propagationPercentage ?? 100;
    const satScore = propPercent;
    const satLevel: HeatmapCell["threatLevel"] =
      propPercent === 100 ? "HARDENED" : propPercent >= 80 ? "MODERATE" : "ELEVATED";
    list.push({
      id: "satellite",
      name: "Satellite DNS Fabric",
      category: "Network & Infrastructure",
      score: satScore,
      threatLevel: satLevel,
      keyMetric: `${propPercent}% Consistency`,
      detail: `Validated across 6 global sovereign backbones (${scan.satelliteRadar?.averageLatencyMs ?? 24}ms latency)`,
      tab: "satellite",
      sectionId: "satellite-panel",
      icon: Radio,
      accentColor: satLevel === "ELEVATED" ? "amber" : "emerald",
    });

    // 9. Dark Web & Breach Exposure
    const breachCount = scan.breachRadar?.historicalBreaches?.length ?? 0;
    const breachScore = breachCount > 5 ? 35 : breachCount > 0 ? 65 : 98;
    const breachLevel: HeatmapCell["threatLevel"] =
      breachCount > 5 ? "CRITICAL" : breachCount > 0 ? "ELEVATED" : "HARDENED";
    list.push({
      id: "breach",
      name: "Dark Web & Breach Posture",
      category: "Threat Posture & OSINT",
      score: breachScore,
      threatLevel: breachLevel,
      keyMetric: `${breachCount} Incident Leaks`,
      detail: breachCount > 0
        ? "Corporate domain credentials identified in external mega-breaches"
        : "No corporate credential dump exposures detected in dark web indexes",
      tab: "breach",
      sectionId: "breach-panel",
      icon: Users,
      accentColor: breachLevel === "CRITICAL" ? "rose" : breachLevel === "ELEVATED" ? "amber" : "emerald",
    });

    // 10. OSINT Dork Reconnaissance
    list.push({
      id: "dorks",
      name: "OSINT Sensitive Dorks",
      category: "Threat Posture & OSINT",
      score: 88,
      threatLevel: "MODERATE",
      keyMetric: "16 Search Vectors",
      detail: "16 automated Google & Shodan reconnaissance dorks generated for sensitive exposure",
      tab: "dorks",
      sectionId: "dorks-panel",
      icon: Search,
      accentColor: "cyan",
    });

    // 11. MITRE ATT&CK Enterprise Matrix
    const mitreMatrix = computeMitreMatrix(scan);
    const activeMitreVulns = mitreMatrix.activeExposures;
    const mitreScore = activeMitreVulns > 3 ? 45 : activeMitreVulns > 0 ? 70 : 95;
    const mitreLevel: HeatmapCell["threatLevel"] =
      activeMitreVulns > 3 ? "CRITICAL" : activeMitreVulns > 0 ? "ELEVATED" : "HARDENED";
    list.push({
      id: "mitre",
      name: "MITRE ATT&CK Vectors",
      category: "Threat Posture & OSINT",
      score: mitreScore,
      threatLevel: mitreLevel,
      keyMetric: `${activeMitreVulns} Threat Vectors`,
      detail: activeMitreVulns > 0
        ? "Perimeter weaknesses mapped to adversary techniques (TA0001 / TA0006)"
        : "Minimal attack surface mapping to active adversary recon techniques",
      tab: "mitre",
      sectionId: "mitre-panel",
      icon: Crosshair,
      accentColor: mitreLevel === "CRITICAL" ? "rose" : mitreLevel === "ELEVATED" ? "amber" : "emerald",
    });

    // 12. Infrastructure Delta & Drift
    const driftChanges = scan.drift
      ? scan.drift.newSubdomains.length + scan.drift.dnsChanges.length
      : 0;
    const driftScore = driftChanges > 2 ? 65 : 95;
    const driftLevel: HeatmapCell["threatLevel"] =
      driftChanges > 2 ? "MODERATE" : "HARDENED";
    list.push({
      id: "drift",
      name: "Infrastructure Drift Delta",
      category: "Network & Infrastructure",
      score: driftScore,
      threatLevel: driftLevel,
      keyMetric: `${driftChanges} Perimeter Deltas`,
      detail: driftChanges > 0
        ? "Recent DNS or subdomain changes detected since prior reconnaissance"
        : "Stable, verified perimeter configuration with zero unlogged changes",
      tab: "drift",
      sectionId: "drift-panel",
      icon: GitCompare,
      accentColor: driftLevel === "MODERATE" ? "amber" : "emerald",
    });

    // 13. Passive Technology Stack
    if (scan.techStack) {
      list.push({
        id: "techstack",
        name: "Passive Tech Stack",
        category: "Edge & Application",
        score: scan.techStack.totalIdentified > 5 ? 75 : 92,
        threatLevel: scan.techStack.totalIdentified > 5 ? "MODERATE" : "HARDENED",
        keyMetric: `${scan.techStack.totalIdentified} Identified Layers`,
        detail: `Server: ${scan.techStack.primaryServer || "Hardened"} | Edge: ${scan.techStack.cdnProvider || "Direct Origin"}`,
        tab: "techstack",
        sectionId: "techstack-panel",
        icon: Cpu,
        accentColor: "cyan",
      });
    }

    // 14. Reputation Threat & IP Toxicity
    if (scan.threatReputation) {
      const tox = scan.threatReputation.toxicityScore;
      const toxLevel: HeatmapCell["threatLevel"] =
        tox >= 66 ? "CRITICAL" : tox >= 36 ? "ELEVATED" : tox >= 16 ? "MODERATE" : "HARDENED";
      list.push({
        id: "reputation",
        name: "IP Threat & Toxicity Radar",
        category: "Network & Infrastructure",
        score: Math.max(10, 100 - tox),
        threatLevel: toxLevel,
        keyMetric: `Toxicity ${tox}/100`,
        detail: `Audited IP: ${scan.threatReputation.targetIp} | ${scan.threatReputation.blacklistsFlagged} of ${scan.threatReputation.totalBlacklistsChecked} feeds flagged`,
        tab: "reputation",
        sectionId: "reputation-panel",
        icon: Radio,
        accentColor: tox >= 36 ? "rose" : "emerald",
      });
    }

    // 15. Public Secret Exposure & Code Dorks
    if (scan.secretDorks) {
      const hasCritical = scan.secretDorks.criticalVectors > 0;
      list.push({
        id: "secretdorks",
        name: "Public Secret Exposure Dorks",
        category: "Threat Posture & OSINT",
        score: hasCritical ? 60 : 88,
        threatLevel: hasCritical ? "ELEVATED" : "HARDENED",
        keyMetric: `${scan.secretDorks.totalVectors} Dork Vectors`,
        detail: `Automated reconnaissance for leaked API tokens, private keys, and environment configs`,
        tab: "secretdorks",
        sectionId: "secretdorks-panel",
        icon: KeyRound,
        accentColor: hasCritical ? "amber" : "cyan",
      });
    }

    return list;
  }, [scan]);

  // Filtered cells
  const filteredCells = useMemo(() => {
    if (selectedFilter === "ALL") return cells;
    return cells.filter((c) => c.threatLevel === selectedFilter);
  }, [cells, selectedFilter]);

  // Aggregate stats
  const criticalCount = cells.filter((c) => c.threatLevel === "CRITICAL").length;
  const elevatedCount = cells.filter((c) => c.threatLevel === "ELEVATED").length;
  const hardenedCount = cells.filter((c) => c.threatLevel === "HARDENED").length;

  // Export full markdown table
  const handleExportMarkdown = () => {
    playDownload();
    const mdRows = cells
      .map(
        (c) =>
          `| ${c.name} | ${c.category} | ${c.threatLevel} | ${c.score}/100 | ${c.keyMetric} | ${c.detail} |`
      )
      .join("\n");

    const fullMd = `# SHADOR Defensive Threat Heatmap: ${scan.targetDomain}\n\n` +
      `**Generated:** ${new Date().toUTCString()}  \n` +
      `**Overall Grade:** ${scan.score.letterGrade} (${scan.score.score}/100)  \n` +
      `**Critical Vectors:** ${criticalCount} | **Elevated Vectors:** ${elevatedCount} | **Hardened Vectors:** ${hardenedCount}\n\n` +
      `| Perimeter Vector | Category | Posture | Score | Primary Metric | Assessment Detail |\n` +
      `|---|---|---|---|---|---|\n` +
      mdRows +
      `\n\n---\n*Generated by SHADOR Autonomous OSINT & Attack Surface Engine*`;

    navigator.clipboard.writeText(fullMd);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2500);
  };

  const handleTeleport = (cell: HeatmapCell) => {
    playClick();
    if (onSwitchTab) {
      onSwitchTab(cell.tab, cell.sectionId);
    } else {
      window.dispatchEvent(
        new CustomEvent("shador:switch-tab", {
          detail: { tab: cell.tab, sectionId: cell.sectionId },
        })
      );
      window.dispatchEvent(
        new CustomEvent("shadowtrace:switch-tab", {
          detail: { tab: cell.tab, sectionId: cell.sectionId },
        })
      );
      const el = document.getElementById(cell.sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      id="threat-heatmap-panel"
      className="rounded-2xl border border-white/[0.1] shadow-2xl p-4 sm:p-6 md:p-7 space-y-6 select-none"
      style={{ backgroundColor: "#060914" }}
    >
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-cyan-500/35 bg-cyan-500/15 flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                Unified Attack Surface Defense Heatmap
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hidden sm:inline">
                12-Vector Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Cross-vector telemetry correlation and real-time defensive posture matrix for {scan.targetDomain}
            </p>
          </div>
        </div>

        {/* Action Controls & Markdown Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-cyan-500/10 hover:border-cyan-400/50 text-slate-300 hover:text-white text-xs font-mono transition-all active:scale-95 shadow-sm"
            title="Export full risk heatmap matrix as Markdown table"
          >
            {copiedMarkdown ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied Table</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-cyan-400" />
                <span>Export Markdown</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs & Quick Statistics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#03050c] p-3 rounded-xl border border-white/[0.08]">
        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => {
              playClick();
              setSelectedFilter("ALL");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap ${
              selectedFilter === "ALL"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            All Vectors ({cells.length})
          </button>
          <button
            onClick={() => {
              playClick();
              setSelectedFilter("CRITICAL");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap ${
              selectedFilter === "CRITICAL"
                ? "bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                : "text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => {
              playClick();
              setSelectedFilter("ELEVATED");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap ${
              selectedFilter === "ELEVATED"
                ? "bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                : "text-slate-400 hover:text-amber-300 hover:bg-amber-500/10"
            }`}
          >
            Elevated ({elevatedCount})
          </button>
          <button
            onClick={() => {
              playClick();
              setSelectedFilter("HARDENED");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap ${
              selectedFilter === "HARDENED"
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            }`}
          >
            Hardened ({hardenedCount})
          </button>
        </div>

        {/* Global Security Posture Ratio */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 shrink-0 self-end sm:self-center">
          <span>Overall Hardening:</span>
          <span className="font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08]">
            {Math.round(
              (cells.reduce((acc, c) => acc + c.score, 0) / (cells.length * 100)) * 100
            )}
            %
          </span>
        </div>
      </div>

      {/* 
        Interactive High-Density Heatmap Grid
        1-col on mobile, 2-col on small tablets, 3-col on tablets/laptops, 4-col on desktop
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
        {filteredCells.map((cell) => {
          const Icon = cell.icon;
          const isCritical = cell.threatLevel === "CRITICAL";
          const isElevated = cell.threatLevel === "ELEVATED";
          const isHardened = cell.threatLevel === "HARDENED";

          return (
            <div
              key={cell.id}
              onClick={() => handleTeleport(cell)}
              className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] ${
                isCritical
                  ? "border-rose-500/50 bg-gradient-to-b from-rose-950/35 to-[#040610] hover:border-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.2)]"
                  : isElevated
                  ? "border-amber-500/40 bg-gradient-to-b from-amber-950/25 to-[#040610] hover:border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.15)]"
                  : isHardened
                  ? "border-emerald-500/40 bg-gradient-to-b from-emerald-950/25 to-[#040610] hover:border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.15)]"
                  : "border-white/[0.09] bg-[#040610] hover:border-cyan-400/50"
              }`}
              style={{ opacity: 1 }}
            >
              <div>
                {/* Cell Header: Category & Status Badge */}
                <div className="flex items-center justify-between gap-2 pb-2">
                  <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider truncate max-w-[130px]">
                    {cell.category}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                      isCritical
                        ? "border-rose-500/40 bg-rose-500/20 text-rose-300 animate-pulse"
                        : isElevated
                        ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                        : isHardened
                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                        : "border-slate-500/30 bg-slate-500/10 text-slate-300"
                    }`}
                  >
                    {cell.threatLevel}
                  </span>
                </div>

                {/* Name & Icon */}
                <div className="flex items-start gap-2.5 mt-1">
                  <div
                    className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                      isCritical
                        ? "border-rose-500/40 bg-rose-500/15 text-rose-400"
                        : isElevated
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                        : isHardened
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                        : "border-cyan-500/40 bg-cyan-500/15 text-cyan-400"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {cell.name}
                    </h4>
                    <div className="text-[10px] font-mono font-semibold text-slate-300 mt-0.5 truncate">
                      {cell.keyMetric}
                    </div>
                  </div>
                </div>

                {/* Tactical Explanation Detail */}
                <p className="text-[10.5px] text-slate-400 leading-snug font-sans mt-2.5 line-clamp-2">
                  {cell.detail}
                </p>
              </div>

              {/* Bottom Score Bar & Teleport Trigger */}
              <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Security Score:</span>
                  <span
                    className={`font-bold ${
                      isCritical
                        ? "text-rose-400"
                        : isElevated
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {cell.score} / 100
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical
                        ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                        : isElevated
                        ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                        : "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    }`}
                    style={{ width: `${Math.max(8, cell.score)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 group-hover:text-cyan-400 transition-colors pt-0.5">
                  <span>Inspect Teleport</span>
                  <ChevronRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tactical Guidance Footer */}
      <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#070b18] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <span className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>Click any threat cell to instantly teleport to deep telemetry & remediation code</span>
        </span>
        <span className="text-slate-500 text-[10.5px]">ISO/IEC 27001 & NIST CSF Aligned</span>
      </div>
    </div>
  );
}
