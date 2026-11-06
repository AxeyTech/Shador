"use client";

import React, { useState, useMemo } from "react";
import {
  Terminal,
  Copy,
  Check,
  ShieldAlert,
  Cpu,
  Download,
  FileCode,
  ShieldCheck,
  FileText,
  Layers,
  ArrowDownToLine,
  Filter,
  Crosshair,
} from "lucide-react";
import type { AiThreatAnalysis, RemediationPlan } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";

interface AiThreatReportProps {
  analysis: AiThreatAnalysis;
  targetDomain: string;
}

interface AttackStep {
  number: number;
  title: string;
  description: string;
}

function parseAttackChainNarrative(rawText: string) {
  if (!rawText) return { heading: "", steps: [], fallbackText: "" };

  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  let heading = "";
  const steps: AttackStep[] = [];
  const fallbackLines: string[] = [];

  for (const line of lines) {
    // 1. Heading check
    if (line.startsWith("#")) {
      heading = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/`/g, "").trim();
      continue;
    }

    if (!heading && (line.toLowerCase().includes("attack simulation") || line.toLowerCase().includes("threat modeling"))) {
      heading = line.replace(/\*\*/g, "").replace(/`/g, "").trim();
      continue;
    }

    // 2. Numbered step matching:
    const stepMatch = line.match(/^(?:Step\s*)?(\d+)[\.\:]\s*(?:\*\*)?([^*:\-–—]+)(?:\*\*)?[:\-–—]\s*(.*)$/i);
    if (stepMatch) {
      const num = parseInt(stepMatch[1], 10);
      const title = stepMatch[2].replace(/\*\*/g, "").replace(/`/g, "").trim();
      const description = stepMatch[3].replace(/\*\*/g, "").replace(/`/g, "").trim();
      steps.push({ number: num, title, description });
      continue;
    }

    // If already inside steps, append as continuation
    if (steps.length > 0) {
      steps[steps.length - 1].description += " " + line.replace(/\*\*/g, "").replace(/`/g, "").trim();
    } else {
      fallbackLines.push(line.replace(/\*\*/g, "").replace(/`/g, "").trim());
    }
  }

  return {
    heading,
    steps,
    fallbackText: fallbackLines.join(" "),
  };
}

function getPlanDownloadInfo(plan: RemediationPlan, targetDomain: string) {
  const lang = (plan.language || "").toLowerCase();
  const cat = (plan.category || "").toLowerCase();
  const title = (plan.title || "").toLowerCase();

  let extension = "conf";
  let mimeType = "text/plain;charset=utf-8";
  let filename = `${targetDomain}-remediation.conf`;

  if (lang.includes("nginx") || cat.includes("header") || title.includes("nginx") || title.includes("header")) {
    extension = "conf";
    filename = `${targetDomain}-security.conf`;
  } else if (lang.includes("dns") || cat.includes("dns") || cat.includes("email") || title.includes("spf") || title.includes("dmarc") || title.includes("zone")) {
    extension = "zone";
    filename = `${targetDomain}-dns-hardening.zone`;
  } else if (lang.includes("bash") || lang.includes("sh") || title.includes("script") || title.includes("subdomain")) {
    extension = "sh";
    filename = `remediate-${targetDomain}-${cat}.sh`;
  } else if (lang.includes("json")) {
    extension = "json";
    mimeType = "application/json";
    filename = `${targetDomain}-policy.json`;
  } else {
    extension = "txt";
    filename = `${targetDomain}-${cat}.txt`;
  }

  return { extension, filename, mimeType };
}

function generateMasterBashScript(targetDomain: string, plans: RemediationPlan[]): string {
  const timestamp = new Date().toUTCString();
  const banner = `#!/usr/bin/env bash
# ==============================================================================
# SHADOR Tactical Perimeter Hardening Master Script
# Target Domain: ${targetDomain}
# Generated: ${timestamp}
# Standard: IEEE Std 830-1998 Tactical Security Blueprint
# ==============================================================================
# CAUTION: Run with appropriate administrative privileges (sudo/root) where
# modifying system-level reverse proxy or daemon configurations.
# ==============================================================================

set -euo pipefail

echo "[*] SHADOR: Commencing automated perimeter hardening for ${targetDomain}..."

# Pre-flight Configuration Backup Routine
BACKUP_DIR="/var/backups/shador_${targetDomain}_\$(date +%s)"
echo "[+] Creating pre-flight backup directory: \$BACKUP_DIR"
mkdir -p "\$BACKUP_DIR"

if [ -d /etc/nginx ]; then
  cp -r /etc/nginx "\$BACKUP_DIR/nginx_backup"
  echo "    -> Nginx configuration preserved."
fi

`;

  let body = "";
  plans.forEach((plan, idx) => {
    const ext = plan.language === "nginx" ? "conf" : plan.language === "dns" ? "zone" : "txt";
    body += `
# ------------------------------------------------------------------------------
# Mitigation Stage #${idx + 1}: ${plan.title}
# Category: ${plan.category} | Severity: ${plan.riskLevel.toUpperCase()}
# Instructions: ${plan.instructions.replace(/\n/g, " ")}
# ------------------------------------------------------------------------------
echo "[+] Deploying mitigation stage #${idx + 1}: ${plan.title}..."

cat << 'EOF' > "${targetDomain}_stage${idx + 1}_${plan.category.toLowerCase()}.${ext}"
${plan.codeSnippet}
EOF

echo "    -> Artifact written to ${targetDomain}_stage${idx + 1}_${plan.category.toLowerCase()}.${ext}"
`;
  });

  const footer = `
# ------------------------------------------------------------------------------
# Verification Phase
# ------------------------------------------------------------------------------
echo "[*] All mitigation artifacts written. Validating syntax..."

if command -v nginx >/dev/null 2>&1; then
  echo "[+] Validating Nginx configuration syntax..."
  nginx -t || echo "[!] WARNING: Nginx configuration test flagged issues. Review output above."
fi

echo "[✓] SHADOR defensive hardening script execution completed for ${targetDomain}."
`;

  return banner + body + footer;
}

function generateHardeningManifest(targetDomain: string, analysis: AiThreatAnalysis): string {
  const manifest = {
    generator: "SHADOR Tactical OSINT & Attack Surface Engine",
    targetDomain,
    generatedAt: new Date().toISOString(),
    executiveSummary: analysis.executiveSummary,
    postureGrade: analysis.postureGrade,
    keyFindings: analysis.keyFindings,
    remediationPlans: analysis.remediationPlans.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      riskLevel: p.riskLevel,
      language: p.language,
      instructions: p.instructions,
      codeSnippet: p.codeSnippet,
    })),
  };
  return JSON.stringify(manifest, null, 2);
}

function generateDnsZoneFile(targetDomain: string, plans: RemediationPlan[]): string {
  const dnsPlans = plans.filter((p) => p.category === "DNS" || p.category === "EMAIL" || p.language === "dns");
  const timestamp = new Date().toUTCString();
  let content = `; ==============================================================================
; SHADOR RFC Hardened DNS Zone Declarations
; Target Domain: ${targetDomain}
; Generated: ${timestamp}
; ==============================================================================
$ORIGIN ${targetDomain}.
$TTL 3600

`;
  if (dnsPlans.length === 0) {
    content += `; No DNS modifications flagged. Existing zone configuration aligns with baseline security.\n`;
  } else {
    dnsPlans.forEach((p) => {
      content += `; --- ${p.title} (${p.riskLevel.toUpperCase()}) ---\n`;
      content += `${p.codeSnippet}\n\n`;
    });
  }
  return content;
}

function generateNginxConfig(targetDomain: string, plans: RemediationPlan[]): string {
  const webPlans = plans.filter((p) => p.category === "HEADERS" || p.category === "TLS" || p.language === "nginx");
  const timestamp = new Date().toUTCString();
  let content = `# ==============================================================================
# SHADOR Hardened Nginx Reverse Proxy Perimeter Configuration
# Target Domain: ${targetDomain}
# Generated: ${timestamp}
# Standards: Mozilla Modern TLS Guideline & OWASP Secure Headers
# ==============================================================================

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${targetDomain} www.${targetDomain};

`;
  if (webPlans.length === 0) {
    content += `    # Core Baseline Defensive Headers\n`;
    content += `    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;\n`;
    content += `    add_header X-Frame-Options "DENY" always;\n`;
    content += `    add_header X-Content-Type-Options "nosniff" always;\n`;
    content += `    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n`;
  } else {
    webPlans.forEach((p) => {
      content += `    # --- ${p.title} ---\n`;
      const indented = p.codeSnippet
        .split("\n")
        .map((l) => (l.trim() ? `    ${l}` : ""))
        .join("\n");
      content += `${indented}\n\n`;
    });
  }
  content += `    location / {\n        try_files $uri $uri/ /index.html;\n    }\n}\n`;
  return content;
}

export function AiThreatReport({ analysis, targetDomain }: AiThreatReportProps) {
  const { playClick, playDownload } = useTacticalAudio();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const handleCopyCode = (id: string, code: string) => {
    playClick();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (
    filename: string,
    content: string,
    mimeType = "text/plain;charset=utf-8",
    trackerId?: string
  ) => {
    try {
      playDownload();
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (trackerId) {
        setDownloadedId(trackerId);
        setTimeout(() => setDownloadedId(null), 2000);
      }
    } catch (e) {
      console.error("Hardening artifact download failed:", e);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "critical":
        return "badge-chroma-rose";
      case "warning":
        return "badge-chroma-amber";
      default:
        return "badge-chroma-cyan";
    }
  };

  const cleanSummary = analysis.executiveSummary
    ? analysis.executiveSummary.replace(/\*\*/g, "").replace(/`/g, "").trim()
    : "";

  const attackChain = parseAttackChainNarrative(analysis.attackChainNarrative);

  const getStepBadge = (num: number) => {
    switch (num) {
      case 1:
        return "border-purple-500/40 bg-purple-500/15 text-purple-300";
      case 2:
        return "border-amber-500/40 bg-amber-500/15 text-amber-300";
      case 3:
        return "border-orange-500/40 bg-orange-500/15 text-orange-300";
      default:
        return "border-rose-500/40 bg-rose-500/15 text-rose-300";
    }
  };

  // Distinct categories available in remediation plans
  const categories = useMemo(() => {
    const set = new Set<string>();
    analysis.remediationPlans.forEach((p) => set.add(p.category));
    return ["ALL", ...Array.from(set)];
  }, [analysis.remediationPlans]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    if (selectedCategory === "ALL") return analysis.remediationPlans;
    return analysis.remediationPlans.filter((p) => p.category === selectedCategory);
  }, [analysis.remediationPlans, selectedCategory]);

  return (
    <section id="remediation" className="w-full space-y-6">
      {/* AI Header Card with Cyber Aurora Depth */}
      <div className="relative overflow-hidden rounded-2xl cyber-card p-5 sm:p-7 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] shrink-0">
              <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
                Autonomous Threat Modeling & Hardening Studio
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                Automated threat modeling and copy-paste infrastructure diffs for {targetDomain}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-1 text-xs font-mono text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Cpu className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>Autonomous Threat Modeling Engine</span>
            </div>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#070914] p-4 sm:p-5 shadow-lg">
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300 mb-2.5 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-400" />
              Executive Posture Synthesis
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-sans">
              {cleanSummary}
            </p>
          </div>

          {/* Key Findings List */}
          {analysis.keyFindings && analysis.keyFindings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
                Critical Vulnerability Findings:
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {analysis.keyFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-[#090d18]/70 p-3 text-xs text-slate-200 shadow-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-cyan-400 mt-1 shrink-0 shadow-[0_0_8px_#00e5ff]" />
                    <span className="leading-relaxed font-sans">{finding.replace(/\*\*/g, "").replace(/`/g, "")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adversary Attack Narrative as Structured Tactical Stages */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#070914] p-4 sm:p-5 shadow-lg">
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-rose-400 mb-4 flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Adversary Attack Chain Simulation
            </h3>

            {attackChain.heading && (
              <div className="mb-4 pb-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-300 tracking-wide uppercase">
                  {attackChain.heading}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                  {attackChain.steps.length} Sequenced Vectors
                </span>
              </div>
            )}

            {attackChain.steps.length > 0 ? (
              <div className="space-y-3">
                {attackChain.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-start gap-3 p-3.5 sm:p-4 rounded-xl border border-white/[0.06] bg-[#090d1a]/85 shadow-md hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:flex-col sm:items-center sm:gap-1 shrink-0 sm:w-20">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStepBadge(
                          step.number
                        )}`}
                      >
                        Stage 0{step.number}
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                          {step.title}
                        </h4>
                        <button
                          onClick={() => {
                            playClick();
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(
                                new CustomEvent("shador:simulate-attack-stage", {
                                  detail: { stageNumber: step.number },
                                })
                              );
                              window.dispatchEvent(
                                new CustomEvent("shadowtrace:simulate-attack-stage", {
                                  detail: { stageNumber: step.number },
                                })
                              );
                            }
                          }}
                          className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 font-mono text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 shadow-sm"
                          title={`Simulate Stage 0${step.number} vector on relational attack graph`}
                        >
                          <Crosshair className="h-3 w-3 text-rose-400" />
                          <span>Simulate on Canvas</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {attackChain.fallbackText || analysis.attackChainNarrative.replace(/\*\*/g, "").replace(/#/g, "").replace(/`/g, "")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 1-Click Hardening Deployment Hub (Master Downloader Bar) */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#070a14] p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-2">
                1-Click Hardening Config Downloader Hub
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Directly export production-hardened configurations, DNS zone declarations, and master automation scripts
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 rounded-full self-start sm:self-auto flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="h-3 w-3" />
            <span>IEEE Std 830 Hardening Blueprint</span>
          </span>
        </div>

        {/* Master Export Action Grid (Multi-Device Responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Master Bash Script (.sh) */}
          <button
            onClick={() => {
              const content = generateMasterBashScript(targetDomain, analysis.remediationPlans);
              handleDownload(`remediate-${targetDomain}.sh`, content, "application/x-sh", "master-bash");
            }}
            className="group flex flex-col p-3 rounded-xl border border-white/[0.08] bg-[#0a0e1c] hover:border-emerald-500/40 hover:bg-emerald-500/10 active:scale-95 transition-all text-left shadow-sm min-h-[52px]"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300">
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                Master Script
              </span>
              {downloadedId === "master-bash" ? (
                <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Downloaded
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-400 transition-colors">
                  .sh
                </span>
              )}
            </div>
            <span className="text-[10.5px] font-mono text-slate-400 truncate">
              remediate-{targetDomain}.sh
            </span>
          </button>

          {/* 2. Web Server Hardened Config (.conf) */}
          <button
            onClick={() => {
              const content = generateNginxConfig(targetDomain, analysis.remediationPlans);
              handleDownload(`${targetDomain}-nginx.conf`, content, "text/plain;charset=utf-8", "master-nginx");
            }}
            className="group flex flex-col p-3 rounded-xl border border-white/[0.08] bg-[#0a0e1c] hover:border-cyan-500/40 hover:bg-cyan-500/10 active:scale-95 transition-all text-left shadow-sm min-h-[52px]"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                Nginx Hardening
              </span>
              {downloadedId === "master-nginx" ? (
                <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Downloaded
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">
                  .conf
                </span>
              )}
            </div>
            <span className="text-[10.5px] font-mono text-slate-400 truncate">
              {targetDomain}-nginx.conf
            </span>
          </button>

          {/* 3. DNS Zone Declarations (.zone) */}
          <button
            onClick={() => {
              const content = generateDnsZoneFile(targetDomain, analysis.remediationPlans);
              handleDownload(`${targetDomain}-zone.db`, content, "text/plain;charset=utf-8", "master-dns");
            }}
            className="group flex flex-col p-3 rounded-xl border border-white/[0.08] bg-[#0a0e1c] hover:border-cyan-500/40 hover:bg-cyan-500/10 active:scale-95 transition-all text-left shadow-sm min-h-[52px]"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                DNS Zone Records
              </span>
              {downloadedId === "master-dns" ? (
                <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Downloaded
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">
                  .zone
                </span>
              )}
            </div>
            <span className="text-[10.5px] font-mono text-slate-400 truncate">
              {targetDomain}-zone.db
            </span>
          </button>

          {/* 4. Complete Audit Manifest (.json) */}
          <button
            onClick={() => {
              const content = generateHardeningManifest(targetDomain, analysis);
              handleDownload(`${targetDomain}-hardening-manifest.json`, content, "application/json", "master-manifest");
            }}
            className="group flex flex-col p-3 rounded-xl border border-white/[0.08] bg-[#0a0e1c] hover:border-amber-500/40 hover:bg-amber-500/10 active:scale-95 transition-all text-left shadow-sm min-h-[52px]"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300">
                <FileText className="h-3.5 w-3.5 text-amber-400" />
                Audit Manifest
              </span>
              {downloadedId === "master-manifest" ? (
                <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Downloaded
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-amber-400 transition-colors">
                  .json
                </span>
              )}
            </div>
            <span className="text-[10.5px] font-mono text-slate-400 truncate">
              hardening-manifest.json
            </span>
          </button>
        </div>
      </div>

      {/* Actionable Remediation Diff Cards with Multi-Device Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Actionable Perimeter Hardening Configurations
              <span className="text-xs font-mono text-slate-400 font-normal">
                ({filteredPlans.length} scripts ready)
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Individual infrastructure diffs with 1-click download and clipboard export
            </p>
          </div>

          {/* Category Filter Pills (Mobile Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <span className="text-[10px] font-mono text-slate-400 uppercase mr-1 hidden sm:inline flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider font-semibold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-sm"
                    : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredPlans.map((plan) => {
            const isCopied = copiedId === plan.id;
            const isDownloaded = downloadedId === plan.id;
            const planInfo = getPlanDownloadInfo(plan, targetDomain);

            return (
              <div
                key={plan.id}
                className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#070a14] overflow-hidden shadow-xl"
              >
                {/* Plan Card Header */}
                <div className="p-4 sm:p-5 border-b border-white/[0.06] bg-[#0b0f1d]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full border ${getRiskBadge(
                        plan.riskLevel
                      )}`}
                    >
                      {plan.category} · {plan.riskLevel}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-800/60 px-2.5 py-0.5 rounded-full">
                      {plan.language}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-wide">{plan.title}</h4>
                  <p className="mt-1 text-xs text-slate-300 leading-normal font-sans">{plan.instructions}</p>
                </div>

                {/* Tactical Code Toolbar (Multi-Device Responsive Row) */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-4 py-2 border-b border-white/[0.05] bg-[#050811] text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-none">
                    <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="text-slate-300 truncate">{planInfo.filename}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* 1-Click Individual File Downloader */}
                    <button
                      onClick={() =>
                        handleDownload(planInfo.filename, plan.codeSnippet, planInfo.mimeType, plan.id)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#0f1526] px-2.5 py-1 text-[11px] font-mono text-slate-200 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all shadow-sm"
                      title={`Download ${planInfo.filename}`}
                    >
                      {isDownloaded ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-300 font-semibold">Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownToLine className="h-3 w-3 text-cyan-400" />
                          <span>Download .{planInfo.extension}</span>
                        </>
                      )}
                    </button>

                    {/* 1-Click Copy */}
                    <button
                      onClick={() => handleCopyCode(plan.id, plan.codeSnippet)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#0f1526] px-2.5 py-1 text-[11px] font-mono text-slate-200 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all shadow-sm"
                      title="Copy configuration diff to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-300 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preformatted Code Block */}
                <div className="relative bg-[#04060c] p-3.5 sm:p-4">
                  <pre className="overflow-x-auto text-xs font-mono text-cyan-200 leading-relaxed max-h-48 scrollbar-thin select-all">
                    <code>{plan.codeSnippet}</code>
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
