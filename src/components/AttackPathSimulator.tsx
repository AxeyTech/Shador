"use client";

import React, { useState, useMemo } from "react";
import {
  Crosshair,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  Terminal,
  Flame,
  Globe,
  Mail,
  Lock,
  Key,
  Layers,
  Zap,
  GitCommit,
  Radio,
  ExternalLink,
  Shield,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import type { CompleteScanResult } from "@/lib/types/scanner";

interface AttackPathSimulatorProps {
  scan: CompleteScanResult;
  onSwitchTab?: (tab: string, sectionId?: string) => void;
}

export interface AttackStep {
  stepNumber: number;
  phase: string;
  mitreTactic: string;
  name: string;
  description: string;
  status: "EXPLOITABLE" | "BLOCKED";
  findingEvidence: string;
  breakingRemediation: string;
}

export interface AttackChain {
  id: string;
  title: string;
  overallStatus: "CRITICAL_PATH_VIABLE" | "ELEVATED_RISK" | "DEFENDED_AND_MITIGATED";
  cvssEstimate: string;
  summary: string;
  steps: AttackStep[];
  breakingDefense: string;
}

export function AttackPathSimulator({
  scan,
  onSwitchTab,
}: AttackPathSimulatorProps) {
  const { playClick, playDownload, playAlert } = useTacticalAudio();
  const [selectedChainId, setSelectedChainId] = useState<string>("chain-phish-takeover");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [copiedNarrative, setCopiedNarrative] = useState(false);

  const target = scan.targetDomain;

  // Synthesize realistic attack chains dynamically from actual scan telemetry
  const chains: AttackChain[] = useMemo(() => {
    const list: AttackChain[] = [];

    // --- CHAIN 1: Phishing & Dangling Cloud Subdomain Takeover ---
    const canSpoof = scan.emailSpoof.canSpoofDirectly || scan.emailSpoof.status === "critical";
    const takeovers = scan.subdomains.danglingTakeoversFound;
    const hasTakeover = takeovers > 0;
    const chain1Viable = canSpoof || hasTakeover;

    list.push({
      id: "chain-phish-takeover",
      title: "Executive Spoofing & Subdomain Takeover Hijack",
      overallStatus:
        canSpoof && hasTakeover
          ? "CRITICAL_PATH_VIABLE"
          : chain1Viable
          ? "ELEVATED_RISK"
          : "DEFENDED_AND_MITIGATED",
      cvssEstimate: canSpoof && hasTakeover ? "CVSS 8.9 (High)" : hasTakeover ? "CVSS 8.6 (High)" : "CVSS 4.3 (Medium)",
      summary:
        "Adversary exploits permissive email authentication to forge corporate notifications directing victims to an orphaned cloud subdomain.",
      steps: [
        {
          stepNumber: 1,
          phase: "Reconnaissance & Weaponization",
          mitreTactic: "TA0043 (Reconnaissance)",
          name: "Perimeter Email Configuration Audit",
          description: `Attacker queries DNS for SPF mechanism and DMARC enforcement on ${target}.`,
          status: canSpoof ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: canSpoof
            ? `DMARC policy '${scan.emailSpoof.dmarc.policy}' allows direct forging of executive emails from @${target}.`
            : `DMARC policy '${scan.emailSpoof.dmarc.policy}' strictly rejects spoofed email traffic.`,
          breakingRemediation: "Configure DMARC with 'v=DMARC1; p=reject; aspf=r; adkim=r;' in DNS.",
        },
        {
          stepNumber: 2,
          phase: "Infrastructure Staging",
          mitreTactic: "TA0042 (Resource Development)",
          name: "Dangling Cloud CNAME Claiming",
          description: "Attacker discovers unmapped CNAME alias and registers the orphaned bucket on AWS/Azure/GitHub.",
          status: hasTakeover ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: hasTakeover
            ? `${takeovers} orphaned subdomain CNAME records detected pointing to unclaimed cloud providers.`
            : "All discovered subdomains resolve to active, authenticated server endpoints.",
          breakingRemediation: "Remove stale DNS CNAME records or claim the associated cloud resource immediately.",
        },
        {
          stepNumber: 3,
          phase: "Initial Access & Delivery",
          mitreTactic: "TA0001 (Initial Access)",
          name: "Spearphishing with Legitimate Domain Reputation",
          description: `Attacker sends spoofed email from executive@${target} linking to the hijacked subdomain.`,
          status: chain1Viable ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: chain1Viable
            ? "Victim's browser trusts the domain reputation and genuine SSL certificate of the hijacked subdomain."
            : "Modern email gateways quarantine spoofed emails; no orphaned subdomains exist.",
          breakingRemediation: "Enforce strict SPF hard fail (-all) and deploy SPF/DKIM alignment across all mail streams.",
        },
        {
          stepNumber: 4,
          phase: "Credential Harvesting / Session Theft",
          mitreTactic: "TA0006 (Credential Access)",
          name: "Cookie Scope & Session Hijacking",
          description: `Because the hijacked subdomain sits on *.${target}, cookies with domain=${target} leak to the attacker.`,
          status: hasTakeover ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: hasTakeover
            ? "Wide cookie scope vulnerability: authentication cookies leak to attacker-controlled subdomain."
            : "Subdomain takeover prevented; cookie confidentiality preserved.",
          breakingRemediation: "Scope sensitive authentication cookies without wildcard parent domain flags.",
        },
      ],
      breakingDefense:
        "Setting DMARC to 'p=reject' and deleting the orphaned CNAME alias terminates this attack chain at Step 1.",
    });

    // --- CHAIN 2: Direct Origin IP Leak & WAF Bypass ---
    const originLeakCount = scan.originBypass?.candidates?.length ?? 0;
    const isBehindWaf = scan.originBypass?.isBehindWaf ?? false;
    const originBypassed = originLeakCount > 0;

    list.push({
      id: "chain-origin-bypass",
      title: "Cloudflare/WAF Bypass & Direct Origin Attack",
      overallStatus: originBypassed
        ? "CRITICAL_PATH_VIABLE"
        : isBehindWaf
        ? "DEFENDED_AND_MITIGATED"
        : "ELEVATED_RISK",
      cvssEstimate: originBypassed ? "CVSS 8.2 (High)" : "CVSS 3.5 (Low)",
      summary:
        "Adversary uncovers unproxied backend origin IP through historical DNS or MX telemetry, bypassing all edge DDoS scrubbers and WAF rules.",
      steps: [
        {
          stepNumber: 1,
          phase: "Passive Telemetry Recon",
          mitreTactic: "TA0043 (Reconnaissance)",
          name: "Origin IP Candidate Discovery",
          description: "Attacker queries historical DNS databases, SSL Certificate Transparency, and MX records for direct IPs.",
          status: originBypassed ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: originBypassed
            ? `Discovered ${originLeakCount} origin candidates (e.g. ${scan.originBypass?.candidates[0]?.ip || "origin IP"}).`
            : "No backend origin IP leaks discovered; reverse proxy cloaking intact.",
          breakingRemediation: "Rotate backend server IP and ensure all DNS records proxy through the WAF provider.",
        },
        {
          stepNumber: 2,
          phase: "Defense Evasion",
          mitreTactic: "TA0005 (Defense Evasion)",
          name: "WAF Security Bypass via Direct Routing",
          description: `Attacker crafts direct HTTP requests to the backend IP with 'Host: ${target}'.`,
          status: originBypassed ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: originBypassed
            ? "Attacker bypasses Cloudflare Bot Management, rate-limiting, and OWASP rule inspection."
            : "Edge proxy strictly mediates all inbound traffic; direct ingress blocked.",
          breakingRemediation: "Restrict backend firewall (Security Groups / iptables) to only accept traffic from WAF IP ranges.",
        },
        {
          stepNumber: 3,
          phase: "Application Exploitation",
          mitreTactic: "TA0001 (Initial Access)",
          name: "Unfiltered Exploit Delivery to Backend",
          description: "Attacker exploits backend services (e.g. unauthenticated API endpoints, SSRF, SQLi) without WAF filtering.",
          status: originBypassed ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: originBypassed
            ? "Backend web application receives raw, uninspected payload from external adversary."
            : "WAF inspects and drops malicious payloads before reaching application servers.",
          breakingRemediation: "Deploy Cloudflare Authenticated Origin Pulls (mTLS) so backend rejects direct non-WAF connections.",
        },
      ],
      breakingDefense:
        "Enforcing an ingress firewall rule permitting only official WAF reverse-proxy CIDR blocks breaks this chain completely.",
    });

    // --- CHAIN 3: Unsigned DNS Zone & Cache Poisoning (Kaminsky Attack) ---
    const dnssecMissing = !(scan.authoritativeDns?.dnssec?.isEnabled ?? false);

    list.push({
      id: "chain-dns-poisoning",
      title: "DNSSEC Absence & Recursive Resolver Cache Poisoning",
      overallStatus: dnssecMissing ? "ELEVATED_RISK" : "DEFENDED_AND_MITIGATED",
      cvssEstimate: dnssecMissing ? "CVSS 7.4 (High)" : "CVSS 0.0 (None)",
      summary:
        "Absence of cryptographic DNSSEC Delegation Signer (DS) records permits malicious resolver cache poisoning, redirecting client traffic.",
      steps: [
        {
          stepNumber: 1,
          phase: "DNS Infrastructure Recon",
          mitreTactic: "TA0043 (Reconnaissance)",
          name: "Cryptographic Delegation Signer Audit",
          description: `Attacker verifies whether ${target} publishes cryptographic DS records at the parent TLD registry.`,
          status: dnssecMissing ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: dnssecMissing
            ? "Zone is unsigned; recursive DNS resolvers accept unvalidated DNS responses."
            : "RFC 4035 DNSSEC active; RRSIG cryptographic validation enforced.",
          breakingRemediation: "Generate KSK/ZSK key pair and submit DS record to domain registrar.",
        },
        {
          stepNumber: 2,
          phase: "Network Tampering & Poisoning",
          mitreTactic: "TA0009 (Collection)",
          name: "Kaminsky Cache Poisoning Race",
          description: "Attacker floods vulnerable ISP/recursive resolvers with forged response packets guessing the TXID/UDP port.",
          status: dnssecMissing ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: dnssecMissing
            ? "Without DNSSEC cryptographic proof, poisoned records are cached for the duration of the TTL."
            : "Recursive resolver verifies cryptographic RRSIG signature and discards forged packets.",
          breakingRemediation: "Enable DNSSEC validation at all enterprise recursive resolvers and authoritatives.",
        },
        {
          stepNumber: 3,
          phase: "Adversary-in-the-Middle (AiTM)",
          mitreTactic: "TA0006 (Credential Access)",
          name: "Transparent Traffic Redirection",
          description: `Users resolving ${target} are routed to an adversary reverse-proxy harvesting credentials.`,
          status: dnssecMissing ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: dnssecMissing
            ? "Victims communicate with attacker-controlled IP without receiving DNS-level tamper alerts."
            : "Tampered DNS response triggers BOGUS validation status; connection rejected.",
          breakingRemediation: "Implement HSTS Preload to ensure browser detects TLS certificate mismatch on redirected host.",
        },
      ],
      breakingDefense:
        "Activating DNSSEC at your domain registrar cryptographically signs all records, eliminating cache poisoning completely.",
    });

    // --- CHAIN 4: Missing HSTS & Clickjacking Redressing Chain ---
    const hstsMissing = !(scan.headers.auditedHeaders?.["strict-transport-security"]?.present ?? false);
    const xfoMissing = !(scan.headers.auditedHeaders?.["x-frame-options"]?.present ?? false);

    list.push({
      id: "chain-ui-redress",
      title: "SSL Stripping & UI Redressing (Clickjacking)",
      overallStatus:
        hstsMissing && xfoMissing
          ? "CRITICAL_PATH_VIABLE"
          : hstsMissing || xfoMissing
          ? "ELEVATED_RISK"
          : "DEFENDED_AND_MITIGATED",
      cvssEstimate: hstsMissing && xfoMissing ? "CVSS 7.1 (High)" : "CVSS 4.3 (Medium)",
      summary:
        "Attacker strips HTTPS encryption on unencrypted public Wi-Fi or frames application inside malicious portal to hijack authenticated clicks.",
      steps: [
        {
          stepNumber: 1,
          phase: "Header Inspection",
          mitreTactic: "TA0043 (Reconnaissance)",
          name: "Security Header Policy Evaluation",
          description: `Attacker checks HTTP response headers for missing HSTS, CSP, and X-Frame-Options.`,
          status: hstsMissing || xfoMissing ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: `HSTS: ${hstsMissing ? "MISSING" : "ENFORCED"} | X-Frame-Options: ${xfoMissing ? "MISSING" : "ENFORCED"}.`,
          breakingRemediation: "Add Strict-Transport-Security and X-Frame-Options: DENY headers in edge reverse proxy.",
        },
        {
          stepNumber: 2,
          phase: "Adversary-in-the-Middle / Phishing",
          mitreTactic: "TA0001 (Initial Access)",
          name: "SSLstrip Downgrade or IFrame Embedding",
          description: "Attacker downgrades HTTPS requests to unencrypted HTTP or embeds application in transparent iframe.",
          status: hstsMissing || xfoMissing ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: hstsMissing
            ? "Browsers connecting over HTTP without HSTS preload are vulnerable to SSLstrip downgrade."
            : "Browser enforces HTTPS automatically via HSTS preload list.",
          breakingRemediation: "Submit domain to hstspreload.org and enforce Content-Security-Policy: frame-ancestors 'none'.",
        },
        {
          stepNumber: 3,
          phase: "Credential Theft / Action Hijack",
          mitreTactic: "TA0006 (Credential Access)",
          name: "Unauthenticated Click Execution",
          description: "Victims clicking seemingly benign buttons on attacker page trigger sensitive actions on target app.",
          status: xfoMissing ? "EXPLOITABLE" : "BLOCKED",
          findingEvidence: xfoMissing
            ? "Victim's authenticated session exploited via transparent overlay buttons."
            : "Browser rejects framing attempt with X-Frame-Options DENY policy.",
          breakingRemediation: "Enforce strict SameSite=Strict on session cookies to prevent framed session abuse.",
        },
      ],
      breakingDefense:
        "Adding HSTS preload and Content-Security-Policy: frame-ancestors 'none' blocks both downgrade and framing vectors.",
    });

    return list;
  }, [scan, target]);

  // Selected chain
  const activeChain = useMemo(() => {
    return chains.find((c) => c.id === selectedChainId) || chains[0];
  }, [chains, selectedChainId]);

  const activeStep = activeChain.steps[activeStepIndex] || activeChain.steps[0];

  // Export full markdown attack narrative
  const handleExportNarrative = () => {
    playDownload();
    const stepsMd = activeChain.steps
      .map(
        (s) =>
          `### Step ${s.stepNumber}: ${s.name} (${s.status})\n` +
          `* **Phase:** ${s.phase} [${s.mitreTactic}]\n` +
          `* **Mechanics:** ${s.description}\n` +
          `* **Evidence from Telemetry:** ${s.findingEvidence}\n` +
          `* **Remediation:** \`${s.breakingRemediation}\`\n`
      )
      .join("\n");

    const fullMd = `# SHADOR Attack Path Simulation: ${target}\n\n` +
      `**Chain:** ${activeChain.title}  \n` +
      `**Threat Assessment:** ${activeChain.overallStatus} (${activeChain.cvssEstimate})  \n` +
      `**Executive Summary:** ${activeChain.summary}  \n\n` +
      `## Multi-Vector Exploitation Sequence\n\n` +
      stepsMd +
      `\n## Blue-Team Countermeasure ("Break the Chain")\n\n` +
      `> ${activeChain.breakingDefense}\n\n` +
      `---\n*Generated by SHADOR Autonomous OSINT & Attack Surface Engine*`;

    navigator.clipboard.writeText(fullMd);
    setCopiedNarrative(true);
    setTimeout(() => setCopiedNarrative(false), 2500);
  };

  const handleSelectChain = (id: string) => {
    playClick();
    setSelectedChainId(id);
    setActiveStepIndex(0);
  };

  const handleSelectStep = (index: number) => {
    playClick();
    setActiveStepIndex(index);
  };

  return (
    <div
      id="attack-path-panel"
      className="rounded-2xl border border-white/[0.1] shadow-2xl p-4 sm:p-6 md:p-7 space-y-6 select-none"
      style={{ backgroundColor: "#060914" }}
    >
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-rose-500/35 bg-rose-500/15 flex items-center justify-center shrink-0">
            <Crosshair className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                Autonomous Cyber Kill Chain & Attack Path Simulator
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 hidden sm:inline">
                Adversary Chaining
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Simulates how external threat actors chain observed misconfigurations into end-to-end compromises for {target}
            </p>
          </div>
        </div>

        {/* Action Controls & Markdown Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportNarrative}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-cyan-500/10 hover:border-cyan-400/50 text-slate-300 hover:text-white text-xs font-mono transition-all active:scale-95 shadow-sm"
            title="Export full attack chain narrative as Markdown"
          >
            {copiedNarrative ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Narrative Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-cyan-400" />
                <span>Export Attack Narrative</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chain Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {chains.map((c) => {
          const isSelected = c.id === selectedChainId;
          const isViable = c.overallStatus === "CRITICAL_PATH_VIABLE";
          const isElevated = c.overallStatus === "ELEVATED_RISK";

          return (
            <div
              key={c.id}
              onClick={() => handleSelectChain(c.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "border-rose-500/60 bg-[#0d1226] shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                  : "border-white/[0.06] bg-[#090d1e] hover:border-white/[0.15]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 pb-1">
                  <span
                    className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                      isViable
                        ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                        : isElevated
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                        : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {isViable ? "VIABLE" : isElevated ? "ELEVATED" : "DEFENDED"}
                  </span>
                  <span className="text-[9.5px] font-mono text-slate-400">{c.cvssEstimate.split(" ")[0]}</span>
                </div>
                <h4 className="text-xs font-mono font-bold text-white mt-1 leading-snug line-clamp-2">
                  {c.title}
                </h4>
              </div>

              <div className="text-[10px] font-mono text-cyan-400/80 pt-2 flex items-center justify-between">
                <span>{c.steps.length} Attack Links</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Attack Chain Overview Card */}
      <div className="p-4 rounded-xl border border-white/[0.08] bg-[#080d20] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
            <h4 className="text-sm font-mono font-bold text-white">{activeChain.title}</h4>
          </div>
          <span
            className={`self-start sm:self-auto text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
              activeChain.overallStatus === "CRITICAL_PATH_VIABLE"
                ? "border-rose-500/50 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                : activeChain.overallStatus === "ELEVATED_RISK"
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                : "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
            }`}
          >
            {activeChain.overallStatus.replace(/_/g, " ")} • {activeChain.cvssEstimate}
          </span>
        </div>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">{activeChain.summary}</p>
      </div>

      {/* 
        Sequential Kill Chain Stepper Flowchart
        Responsive: horizontal scroll on desktop, stacked on mobile
      */}
      <div className="space-y-3">
        <div className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-2 px-1">
          <GitCommit className="h-4 w-4 text-rose-400" />
          <span>Interactive Exploit Sequence (Click any node to inspect mechanics):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {activeChain.steps.map((step, idx) => {
            const isSelected = idx === activeStepIndex;
            const isExploitable = step.status === "EXPLOITABLE";

            return (
              <div
                key={step.stepNumber}
                onClick={() => handleSelectStep(idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? "border-cyan-400 bg-[#0d142c] shadow-[0_0_18px_rgba(6,182,212,0.25)] scale-[1.01]"
                    : "border-white/[0.08] bg-[#080c1b] hover:border-white/[0.2]"
                }`}
              >
                {/* Step Number & Indicator */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                        isSelected
                          ? "bg-cyan-400 text-black font-black"
                          : "bg-white/[0.08] text-slate-300"
                      }`}
                    >
                      {step.stepNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[110px]">
                      {step.mitreTactic.split(" ")[0]}
                    </span>
                  </div>

                  <span
                    className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                      isExploitable
                        ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                        : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {isExploitable ? "EXPLOITABLE" : "BLOCKED"}
                  </span>
                </div>

                <h5 className="text-xs font-mono font-bold text-white mt-2 leading-snug line-clamp-2">
                  {step.name}
                </h5>

                <p className="text-[10.5px] text-slate-400 font-sans mt-1.5 line-clamp-2">
                  {step.description}
                </p>

                {/* Tactical Indicator Dot */}
                {isSelected && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-6 bg-cyan-400 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Step Detailed Mechanics & Blue-Team Breaker */}
      <div className="p-4 sm:p-5 rounded-xl border border-white/[0.1] bg-[#070b19] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${
                activeStep.status === "EXPLOITABLE"
                  ? "border-rose-500/40 bg-rose-500/15 text-rose-400"
                  : "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
              }`}
            >
              {activeStep.status === "EXPLOITABLE" ? (
                <ShieldAlert className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                Step {activeStep.stepNumber} • {activeStep.phase} ({activeStep.mitreTactic})
              </div>
              <h4 className="text-sm font-mono font-bold text-white mt-0.5">
                {activeStep.name}
              </h4>
            </div>
          </div>

          <span
            className={`self-start sm:self-auto text-xs font-mono font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
              activeStep.status === "EXPLOITABLE"
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
            }`}
          >
            {activeStep.status === "EXPLOITABLE" ? "Live Vulnerability Identified" : "Control Verified Hardened"}
          </span>
        </div>

        {/* Technical Exploit Narrative */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#0b0f22] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] uppercase text-rose-400 font-bold block">
              Observed Telemetry Finding
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              {activeStep.findingEvidence}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b0f22] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] uppercase text-emerald-400 font-bold block">
              Step Remediation Countermeasure
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              {activeStep.breakingRemediation}
            </p>
          </div>
        </div>

        {/* Blue-Team "Break the Chain" Master Playbook */}
        <div className="p-3.5 rounded-xl border border-cyan-500/25 bg-cyan-950/15 text-xs font-mono space-y-1">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span>Blue-Team Kill Chain Disruptor (&ldquo;Break the Chain&rdquo;):</span>
          </div>
          <p className="text-slate-300 text-[11px] font-sans leading-relaxed pt-0.5">
            {activeChain.breakingDefense}
          </p>
        </div>
      </div>

      {/* Tactical Guidance Footer */}
      <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#070b18] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <span className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-rose-400 shrink-0" />
          <span>Lockheed Martin Cyber Kill Chain & MITRE ATT&CK Enterprise Matrix Aligned</span>
        </span>
        <span className="text-slate-500 text-[10.5px]">CVSS v3.1 Impact Scored</span>
      </div>
    </div>
  );
}
