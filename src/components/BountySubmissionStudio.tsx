"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Crosshair,
  X,
  Copy,
  Check,
  Download,
  ShieldAlert,
  AlertTriangle,
  FileCode,
  Terminal,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { CompleteScanResult } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";

interface BountySubmissionStudioProps {
  scan: CompleteScanResult;
  isOpen: boolean;
  onClose: () => void;
}

interface BountyIssue {
  id: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  cvssScore: string;
  cvssVector: string;
  cwe: string;
  summary: string;
  pocCommands: string[];
  impact: string;
  remediation: string;
}

export function BountySubmissionStudio({ scan, isOpen, onClose }: BountySubmissionStudioProps) {
  const { playClick, playDownload } = useTacticalAudio();
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [copiedMd, setCopiedMd] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive findings from scan
  const issues: BountyIssue[] = useMemo(() => {
    const list: BountyIssue[] = [];

    // 1. Dangling Subdomain Takeover
    if (scan.subdomains.danglingTakeoversFound > 0) {
      const danglingSub = scan.subdomains.subdomains.find((s) => s.isDangling);
      const domainName = danglingSub?.domain || `sub.${scan.targetDomain}`;
      const targetCname = danglingSub?.cname || "unclaimed-service.s3.amazonaws.com";
      const provider = danglingSub?.takeoverProvider || "Cloud Provider";

      list.push({
        id: "issue-takeover",
        title: `Subdomain Takeover on ${domainName} via Dangling ${provider} CNAME`,
        severity: "Critical",
        cvssScore: "9.1",
        cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
        cwe: "CWE-284: Improper Access Control",
        summary: `The subdomain \`${domainName}\` resolves via CNAME to \`${targetCname}\`. The external cloud resource has been decommissioned by the organization but the DNS record remains active, enabling an unauthenticated adversary to claim the resource and host arbitrary malicious content on the authoritative enterprise domain.`,
        pocCommands: [
          `# 1. Query Authoritative CNAME Record`,
          `dig +short CNAME ${domainName}`,
          `# Result: ${targetCname}`,
          ``,
          `# 2. Verify NXDOMAIN response on cloud resource`,
          `curl -i -s https://${domainName} | grep -i "NoSuchBucket\\|not found\\|unregistered"`,
        ],
        impact: `An attacker can claim the resource on ${provider} and execute Stored Cross-Site Scripting (XSS), harvest session tokens/cookies with \`domain=.${scan.targetDomain}\`, and bypass CORS restrictions under the organization's trusted apex domain.`,
        remediation: `Immediately decommission the dangling CNAME pointer from the authoritative DNS zone or claim the registered resource under the organization's verified cloud account.`,
      });
    }

    // 2. Email Spoofing & Phishing Impersonation
    if (scan.emailSpoof.canSpoofDirectly) {
      const spfMech = scan.emailSpoof.spf.mechanism;
      const dmarcPolicy = scan.emailSpoof.dmarc.policy;

      list.push({
        id: "issue-email-spoof",
        title: `Direct Email Spoofability on ${scan.targetDomain} via Missing/Weak DMARC Policy`,
        severity: "High",
        cvssScore: "7.5",
        cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N",
        cwe: "CWE-290: Authentication Bypass by Spoofing",
        summary: `The apex domain \`${scan.targetDomain}\` lacks strict DMARC enforcement (Policy: \`${dmarcPolicy}\`, SPF: \`${spfMech}\`). Mail Transfer Agents (MTAs) worldwide will accept spoofed inbound messages claiming to originate directly from executive addresses @${scan.targetDomain}.`,
        pocCommands: [
          `# 1. Verify DMARC Record on authoritative nameservers`,
          `dig +short TXT _dmarc.${scan.targetDomain}`,
          `# Result: ${scan.emailSpoof.dmarc.raw || "No DMARC record found"}`,
          ``,
          `# 2. Check SPF Mechanism and Lookup Count`,
          `dig +short TXT ${scan.targetDomain} | grep "v=spf1"`,
          `# Result: ${scan.emailSpoof.spf.raw || "No SPF record found"} (Lookups: ${scan.emailSpoof.spf.lookupCount}/10)`,
        ],
        impact: `Adversaries can launch high-credibility Business Email Compromise (BEC) and phishing campaigns targeting company customers and employees, severely damaging enterprise reputation and facilitating wire fraud.`,
        remediation: `Publish an authoritative DMARC record with \`p=reject\` or \`p=quarantine\` and ensure SPF is configured with strict \`-all\` fail enforcement.`,
      });
    }

    // 3. Cleartext Transmission & Missing HSTS
    if (!scan.headers.forcesHttpsRedirect || scan.headers.criticalMissing.includes("strict-transport-security")) {
      list.push({
        id: "issue-hsts",
        title: `Missing Strict-Transport-Security (HSTS) & Cleartext Downgrade Exposure`,
        severity: "Medium",
        cvssScore: "5.3",
        cvssVector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:N",
        cwe: "CWE-319: Cleartext Transmission of Sensitive Information",
        summary: `The target domain \`${scan.targetDomain}\` does not enforce the HTTP Strict Transport Security (RFC 6797) header with adequate \`max-age\` or \`includeSubDomains\`. Insecure plaintext HTTP connections are not permanently redirected to HTTPS.`,
        pocCommands: [
          `# 1. Inspect HTTP Edge Response Headers for Strict-Transport-Security`,
          `curl -s -I -L http://${scan.targetDomain} | grep -i "Strict-Transport-Security\\|Location"`,
        ],
        impact: `Adversaries in an inline position (public Wi-Fi, compromised router, rogue ISP) can perform SSL stripping attacks (using tools like sslstrip) to downgrade encrypted user traffic to plaintext HTTP and intercept authentication cookies.`,
        remediation: `Deploy \`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload\` across all edge reverse proxies and enforce permanent 301/308 redirects from port 80 to port 443.`,
      });
    }

    // 4. Default / General Attack Surface Dossier
    if (list.length === 0) {
      list.push({
        id: "issue-general",
        title: `External Attack Surface Telemetry & Missing RFC 9116 security.txt on ${scan.targetDomain}`,
        severity: "Low",
        cvssScore: "3.1",
        cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
        cwe: "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor",
        summary: `Reconnaissance scan conducted on \`${scan.targetDomain}\`. While primary perimeters show hardened posture (Grade [${scan.score.letterGrade}]), secondary security hygiene improvements (such as RFC 9116 security.txt policy declaration and defense-in-depth header hardening) should be applied.`,
        pocCommands: [
          `# Query standard RFC 9116 Vulnerability Disclosure Policy`,
          `curl -i https://${scan.targetDomain}/.well-known/security.txt`,
        ],
        impact: `External security researchers encountering critical zero-day vulnerabilities in the future may lack a standardized, cryptographically signed channel to report bugs responsibly.`,
        remediation: `Publish \`/.well-known/security.txt\` with Contact, Expires, and Canonical policy declarations per RFC 9116.`,
      });
    }

    return list;
  }, [scan]);

  // Set default active issue
  useEffect(() => {
    if (issues.length > 0 && !selectedIssueId) {
      setSelectedIssueId(issues[0].id);
    }
  }, [issues, selectedIssueId]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        playClick();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, playClick]);

  if (!isOpen) return null;

  const activeIssue = issues.find((i) => i.id === selectedIssueId) || issues[0];

  const generateHackerOneMarkdown = (issue: BountyIssue) => {
    return `### **Summary**
${issue.summary}

---

### **Vulnerability Details**
- **Target Asset**: \`${scan.targetDomain}\`
- **Vulnerability Category**: \`${issue.title}\`
- **Weakness (CWE)**: \`${issue.cwe}\`
- **CVSS v3.1 Score**: **${issue.cvssScore} (${issue.severity})**
- **CVSS Vector**: \`${issue.cvssVector}\`

---

### **Steps to Reproduce (Proof of Concept)**
Execute the following commands from an external terminal:

\`\`\`bash
${issue.pocCommands.join("\n")}
\`\`\`

---

### **Business & Security Impact**
${issue.impact}

---

### **Suggested Remediation**
${issue.remediation}

---
*Report formatted automatically via SHADOR Bug Bounty Submission Studio.*
`;
  };

  const handleCopyMarkdown = () => {
    playDownload();
    const md = generateHackerOneMarkdown(activeIssue);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    playDownload();
    const md = generateHackerOneMarkdown(activeIssue);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bounty-report-${scan.targetDomain}-${activeIssue.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityBadge = (sev: BountyIssue["severity"]) => {
    switch (sev) {
      case "Critical":
        return "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.35)]";
      case "High":
        return "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.35)]";
      case "Medium":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.35)]";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)]";
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Dark backdrop */}
      <div
        onClick={() => {
          playClick();
          onClose();
        }}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Container */}
      <div className="min-h-screen px-4 text-center flex items-center justify-center py-6 sm:py-10">
        <div
          className="w-full max-w-4xl rounded-2xl border border-white/[0.14] text-left shadow-[-15px_30px_70px_rgba(0,0,0,0.95),0_0_45px_rgba(244,63,94,0.18)] relative z-10 overflow-hidden flex flex-col"
          style={{ backgroundColor: "#060813", opacity: 1 }}
        >
          {/* Top Rose Laser Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/80 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <Crosshair className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  1-Click Bug Bounty Submission Studio
                  <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/35 px-2 py-0.5 rounded-full uppercase">
                    HackerOne / Bugcrowd Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Instantly formats verified external reconnaissance findings into submission-ready triage reports with CVSS v3.1 scoring.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-h-[calc(85vh-160px)] overflow-y-auto custom-scrollbar">
            {/* Left Sidebar: Issues List */}
            <div className="lg:col-span-4 space-y-2.5">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 block px-1">
                Identified Submission Vectors ({issues.length})
              </span>

              {issues.map((issue) => {
                const isSelected = issue.id === activeIssue.id;
                return (
                  <button
                    key={issue.id}
                    onClick={() => {
                      playClick();
                      setSelectedIssueId(issue.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all select-none flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "border-rose-500/60 bg-[#12182e] shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                        : "border-white/[0.08] bg-[#0b0f1d] hover:border-white/[0.2] hover:bg-[#0e1428]"
                    }`}
                    style={{ opacity: 1 }}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadge(
                          issue.severity
                        )}`}
                      >
                        {issue.severity} · {issue.cvssScore}
                      </span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          isSelected ? "text-rose-400 translate-x-0.5" : "text-slate-500"
                        }`}
                      />
                    </div>

                    <h4 className="text-xs font-mono font-bold text-white line-clamp-2">
                      {issue.title}
                    </h4>

                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      {issue.cwe}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Pane: Report Inspector & Preview */}
            <div
              className="lg:col-span-8 rounded-xl border border-white/[0.1] p-4 sm:p-5 flex flex-col justify-between space-y-4"
              style={{ backgroundColor: "#0b0f1d", opacity: 1 }}
            >
              <div className="space-y-4">
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Vulnerability Title</span>
                    <h4 className="text-sm font-mono font-bold text-white mt-0.5">{activeIssue.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${getSeverityBadge(
                        activeIssue.severity
                      )}`}
                    >
                      CVSS {activeIssue.cvssScore} ({activeIssue.severity})
                    </span>
                  </div>
                </div>

                {/* CVSS Vector */}
                <div className="flex items-center gap-2 text-[11px] font-mono bg-[#060813] border border-white/[0.08] px-3 py-1.5 rounded-lg text-slate-300">
                  <span className="text-slate-500 font-bold">Vector:</span>
                  <span className="text-rose-300 select-all">{activeIssue.cvssVector}</span>
                </div>

                {/* Summary */}
                <div>
                  <h5 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Summary</h5>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{activeIssue.summary}</p>
                </div>

                {/* Proof of Concept */}
                <div>
                  <h5 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <Terminal className="h-3 w-3 text-cyan-400" />
                    Steps to Reproduce (PoC Terminal Execution)
                  </h5>
                  <div className="rounded-lg border border-white/[0.08] bg-[#060813] p-3 font-mono text-xs text-cyan-300 select-all overflow-x-auto whitespace-pre">
                    {activeIssue.pocCommands.join("\n")}
                  </div>
                </div>

                {/* Business Impact */}
                <div>
                  <h5 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Business Impact</h5>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeIssue.impact}</p>
                </div>

                {/* Remediation */}
                <div>
                  <h5 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Remediation Guidance</h5>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeIssue.remediation}</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-rose-400" />
                  <span>Target: {scan.targetDomain}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadMarkdown}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/[0.1] bg-[#080b15] text-xs font-mono text-slate-300 hover:text-white hover:border-white/[0.2] transition-colors"
                    title="Download .md report file"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .md</span>
                  </button>

                  <button
                    onClick={handleCopyMarkdown}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-rose-500/50 bg-rose-500/20 text-xs font-mono text-rose-200 hover:bg-rose-500/30 hover:border-rose-400 transition-all font-bold shadow-md active:scale-95"
                    title="Copy formatted report to clipboard"
                  >
                    {copiedMd ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Report Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-rose-400" />
                        <span>Copy HackerOne Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}