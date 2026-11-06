"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Globe,
  AlertTriangle,
  ShieldAlert,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  X,
  FileText,
  ShieldCheck,
  Sparkles,
  Zap,
  Info,
  Layers,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import type { SubdomainItem, CompleteScanResult } from "@/lib/types/scanner";

interface CloudTakeoverStudioProps {
  isOpen: boolean;
  onClose: () => void;
  subdomain?: SubdomainItem | null;
  scan: CompleteScanResult;
}

interface FingerprintDef {
  provider: string;
  category: string;
  fingerprintError: string;
  verificationCommand: string;
  claimCommand: string;
  cvssScore: number;
  cwe: string;
  remediationStep: string;
}

const PROVIDER_FINGERPRINTS: Record<string, FingerprintDef> = {
  "AWS S3 / CloudFront": {
    provider: "AWS S3 / CloudFront",
    category: "Cloud Storage Bucket",
    fingerprintError: "NoSuchBucket / The specified bucket does not exist",
    verificationCommand: "curl -sI https://<subdomain> | grep -E 'x-amz-error|NoSuchBucket'",
    claimCommand: "aws s3 mb s3://<bucket-name> --region <target-region>",
    cvssScore: 8.8,
    cwe: "CWE-350 / CWE-284",
    remediationStep: "Delete the dangling CNAME record from your DNS zone, or recreate the target S3 bucket in your authoritative AWS account.",
  },
  "GitHub Pages": {
    provider: "GitHub Pages",
    category: "Static Site Hosting",
    fingerprintError: "There isn't a GitHub Pages site here (404)",
    verificationCommand: "curl -s https://<subdomain> | grep -i 'There isn\\'t a GitHub Pages site here'",
    claimCommand: "Create a GitHub repository with CNAME file containing '<subdomain>'",
    cvssScore: 8.5,
    cwe: "CWE-350",
    remediationStep: "Remove the orphaned CNAME pointing to <username>.github.io or bind the domain to your official repository.",
  },
  "Heroku": {
    provider: "Heroku",
    category: "PaaS Application",
    fingerprintError: "Heroku | No such app",
    verificationCommand: "curl -s https://<subdomain> | grep -i 'No such app'",
    claimCommand: "heroku domains:add <subdomain> -a <your-app-name>",
    cvssScore: 8.6,
    cwe: "CWE-350",
    remediationStep: "Delete the CNAME pointing to *.herokudns.com or re-assign the custom domain in your Heroku Dashboard.",
  },
  "Microsoft Azure": {
    provider: "Microsoft Azure",
    category: "Enterprise Cloud App",
    fingerprintError: "Error 404 - Web app not found",
    verificationCommand: "curl -sI https://<subdomain> | grep -i 'Microsoft-Azure-Application-Gateway'",
    claimCommand: "az webapp config hostname add --webapp-name <app> --resource-group <rg> --hostname <subdomain>",
    cvssScore: 8.8,
    cwe: "CWE-350",
    remediationStep: "Purge the orphaned CNAME alias from Azure DNS or update the target App Service custom domain bindings.",
  },
  "Fastly": {
    provider: "Fastly",
    category: "Edge Cloud CDN",
    fingerprintError: "Fastly error: unknown domain",
    verificationCommand: "curl -sI https://<subdomain> | grep -i 'fastly'",
    claimCommand: "Claim domain alias within Fastly Service Configuration dashboard",
    cvssScore: 8.4,
    cwe: "CWE-350",
    remediationStep: "Remove the CNAME alias pointing to *.fastly.net or register the hostname in your active Fastly service.",
  },
  "Shopify": {
    provider: "Shopify",
    category: "E-Commerce",
    fingerprintError: "Sorry, this shop is currently unavailable",
    verificationCommand: "curl -s https://<subdomain> | grep -i 'Sorry, this shop is currently unavailable'",
    claimCommand: "Add custom domain in Shopify Admin -> Settings -> Domains",
    cvssScore: 8.2,
    cwe: "CWE-350",
    remediationStep: "Disconnect the domain from Shopify DNS settings or remove the shops.myshopify.com CNAME pointer.",
  },
  "Netlify": {
    provider: "Netlify",
    category: "Jamstack CDN",
    fingerprintError: "Not Found - Request ID",
    verificationCommand: "curl -sI https://<subdomain> | grep -i 'x-nf-request-id'",
    claimCommand: "netlify domains:add <subdomain>",
    cvssScore: 8.5,
    cwe: "CWE-350",
    remediationStep: "Remove the .netlify.app CNAME pointer or assign the domain to a verified team project.",
  },
  "Vercel": {
    provider: "Vercel",
    category: "Serverless Edge",
    fingerprintError: "404: NOT_FOUND (Deployment not found)",
    verificationCommand: "curl -sI https://<subdomain> | grep -i 'x-vercel-id'",
    claimCommand: "vercel domains add <subdomain>",
    cvssScore: 8.5,
    cwe: "CWE-350",
    remediationStep: "Verify project ownership in Vercel project settings or remove the cname.vercel-dns.com CNAME.",
  },
};

const DEFAULT_FINGERPRINT: FingerprintDef = {
  provider: "Unclaimed Cloud Resource",
  category: "Generic Cloud Service",
  fingerprintError: "NXDOMAIN / 404 Unresolved Cloud Resource",
  verificationCommand: "dig CNAME <subdomain> +trace && curl -sI https://<subdomain>",
  claimCommand: "Identify authoritative cloud tenant and register target hostname",
  cvssScore: 8.5,
  cwe: "CWE-350: Reliance on Reverse DNS Resolution",
  remediationStep: "Remove the orphaned DNS record from your authoritative DNS provider zone file.",
};

export function CloudTakeoverStudio({
  isOpen,
  onClose,
  subdomain,
  scan,
}: CloudTakeoverStudioProps) {
  const { playClick, playDownload } = useTacticalAudio();
  const [activeTab, setActiveTab] = useState<"poc" | "report" | "remediation">("poc");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const targetDomain = subdomain ? subdomain.domain : scan.targetDomain;
  const cnameTarget = subdomain?.cname || "unresolved-dangling-cname.cloudprovider.net";
  const providerKey = subdomain?.takeoverProvider || "AWS S3 / CloudFront";
  const fingerprint = PROVIDER_FINGERPRINTS[providerKey] || DEFAULT_FINGERPRINT;

  const digCommand = `dig CNAME ${targetDomain} +short`;
  const curlCommand = `curl -sI https://${targetDomain}`;
  const customVerifyCommand = fingerprint.verificationCommand.replace(/<subdomain>/g, targetDomain);
  const customClaimCommand = fingerprint.claimCommand
    .replace(/<subdomain>/g, targetDomain)
    .replace(/<bucket-name>/g, targetDomain.replace(/\./g, "-"));

  const generateTakeoverMarkdown = () => {
    return `# Subdomain Takeover Vulnerability Report: ${targetDomain}

## Vulnerability Summary
A high-severity **Subdomain Takeover** vulnerability was identified on \`${targetDomain}\`. The domain possesses a canonical name (\`CNAME\`) record pointing to an orphaned, unclaimed cloud resource hosted on **${fingerprint.provider}**. 

Because the target cloud resource has been decommissioned or was never claimed, an external adversary can register the resource and achieve complete control over the subdomain's content, cookies, and TLS certificate.

- **Vulnerable Subdomain**: \`${targetDomain}\`
- **Canonical Name (CNAME)**: \`${cnameTarget}\`
- **Cloud Provider**: ${fingerprint.provider} (${fingerprint.category})
- **CVSS v3.1 Score**: ${fingerprint.cvssScore} (High) — \`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H\`
- **CWE Classification**: ${fingerprint.cwe}

---

## Technical Proof of Concept (PoC)

### 1. DNS CNAME Resolution
Running a DNS inspection reveals the dangling pointer:
\`\`\`bash
$ dig CNAME ${targetDomain} +short
${cnameTarget}
\`\`\`

### 2. HTTP Fingerprint Verification
The remote cloud provider returns the signature error page:
\`\`\`bash
$ ${customVerifyCommand}
HTTP/1.1 404 Not Found
X-Cache: Error from cloudfront
Error: ${fingerprint.fingerprintError}
\`\`\`

### 3. Exploitation Walkthrough
1. An adversary creates an account or service instance on **${fingerprint.provider}**.
2. The adversary claims the unallocated resource via:
   \`\`\`bash
   $ ${customClaimCommand}
   \`\`\`
3. Because \`${targetDomain}\` continues to resolve to this cloud resource, all web traffic to \`${targetDomain}\` is now directed to the attacker-controlled asset.

---

## Business & Security Impact
- **Session Hijacking & Cookie Theft**: If cookies are scoped with \`Domain=.${scan.targetDomain}\`, the attacker can intercept authentication sessions.
- **Brand Reputation & Phishing**: Phishing attacks hosted on the legitimate corporate domain possess 100% domain trust.
- **Stored XSS**: Seamless bypass of Content Security Policies that trust corporate subdomains.

---

## Remediation Guidance
1. **Immediate Action**: Delete the orphaned CNAME record for \`${targetDomain}\` from the authoritative DNS zone file immediately.
2. **Defensive Hardening**: ${fingerprint.remediationStep}

*Report autonomously formatted by SHADOR Bug Bounty Submission Studio.*`;
  };

  const handleCopyCommand = (cmd: string, id: string) => {
    playDownload();
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleCopyReport = () => {
    playDownload();
    navigator.clipboard.writeText(generateTakeoverMarkdown());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 pointer-events-none animate-in fade-in duration-150">
      {/* Semi-transparent dark tactical backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Container */}
      <div
        className="relative pointer-events-auto w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/[0.14] shadow-2xl flex flex-col overflow-hidden z-10 select-none animate-in fade-in zoom-in-95 duration-150"
        style={{ backgroundColor: "#060914" }}
        role="dialog"
        aria-label="Cloud Takeover PoC Studio"
      >
        {/* Top subtle glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/80 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-[#080d1e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-500/15 border border-rose-500/35 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold font-mono text-white">
                  Cloud Takeover & Fingerprint Studio
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/40 bg-rose-500/15 text-rose-300 font-bold">
                  CVSS {fingerprint.cvssScore}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[280px] sm:max-w-md">
                Target: <span className="text-cyan-300 font-bold">{targetDomain}</span> → {cnameTarget}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-slate-400 hover:text-white hover:border-rose-400/50 hover:bg-rose-500/10 transition-colors"
            title="Close modal (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-white/[0.08] bg-[#070b18] shrink-0">
          <button
            onClick={() => {
              playClick();
              setActiveTab("poc");
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition-all ${
              activeTab === "poc"
                ? "border-rose-400 text-rose-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Interactive Verification PoC</span>
          </button>
          <button
            onClick={() => {
              playClick();
              setActiveTab("report");
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition-all ${
              activeTab === "report"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>HackerOne Advisory</span>
          </button>
          <button
            onClick={() => {
              playClick();
              setActiveTab("remediation");
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition-all ${
              activeTab === "remediation"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Remediation Playbook</span>
          </button>
        </div>

        {/* Scrollable Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-none">
          {activeTab === "poc" && (
            <div className="space-y-4">
              {/* Cloud Fingerprint Match Card */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    Cloud Fingerprint Match: {fingerprint.provider}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{fingerprint.category}</span>
                </div>
                <div className="text-xs font-mono text-slate-200">
                  <span className="text-slate-400">Signature Error String: </span>
                  <span className="text-rose-200 font-bold">&quot;{fingerprint.fingerprintError}&quot;</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The authoritative DNS record for <code className="text-rose-300">{targetDomain}</code> delegates traffic to an orphaned cloud endpoint (<code className="text-cyan-300">{cnameTarget}</code>). An attacker can claim this resource to fully hijack the subdomain.
                </p>
              </div>

              {/* Copyable Terminal Commands */}
              <div className="space-y-2.5">
                <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                  Proof-of-Concept Terminal Verification Commands:
                </span>

                {/* Command 1: Dig CNAME */}
                <div className="p-3 rounded-xl border border-white/[0.08] bg-[#0b0f1d] flex items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-slate-300 truncate select-all">{digCommand}</span>
                  <button
                    onClick={() => handleCopyCommand(digCommand, "dig")}
                    className="p-1.5 rounded-lg border border-white/[0.08] hover:border-cyan-400/50 text-slate-300 hover:text-white transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedCmd === "dig" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Command 2: HTTP Probe */}
                <div className="p-3 rounded-xl border border-white/[0.08] bg-[#0b0f1d] flex items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-slate-300 truncate select-all">{customVerifyCommand}</span>
                  <button
                    onClick={() => handleCopyCommand(customVerifyCommand, "verify")}
                    className="p-1.5 rounded-lg border border-white/[0.08] hover:border-cyan-400/50 text-slate-300 hover:text-white transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedCmd === "verify" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Command 3: Claim Simulation */}
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-amber-200 truncate select-all">{customClaimCommand}</span>
                  <button
                    onClick={() => handleCopyCommand(customClaimCommand, "claim")}
                    className="p-1.5 rounded-lg border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white transition-colors shrink-0"
                    title="Copy claim command"
                  >
                    {copiedCmd === "claim" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "report" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">
                  Formatted for HackerOne, Bugcrowd, and Intigriti Bug Bounties:
                </span>
                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-xs font-mono font-bold transition-all"
                >
                  {copiedReport ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedReport ? "Copied Markdown" : "Copy Report Markdown"}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.08] bg-[#02040a] font-mono text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto scrollbar-none select-all whitespace-pre-wrap">
                {generateTakeoverMarkdown()}
              </div>
            </div>
          )}

          {activeTab === "remediation" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs font-mono">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Immediate De-Registration Playbook:</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {fingerprint.remediationStep}
                </p>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <span className="text-slate-300 font-bold">1-Click DNS Deletion Snippets:</span>
                <div className="p-3 rounded-xl border border-white/[0.08] bg-[#0b0f1d] space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">AWS Route 53 CLI:</div>
                  <pre className="text-emerald-300 overflow-x-auto text-[11px]">
                    {`aws route53 change-resource-record-sets --hosted-zone-id <ZONE_ID> --change-batch '{"Changes":[{"Action":"DELETE","ResourceRecordSet":{"Name":"${targetDomain}","Type":"CNAME","TTL":300,"ResourceRecords":[{"Value":"${cnameTarget}"}]}}]}'`}
                  </pre>
                </div>

                <div className="p-3 rounded-xl border border-white/[0.08] bg-[#0b0f1d] space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cloudflare API Curl:</div>
                  <pre className="text-cyan-300 overflow-x-auto text-[11px]">
                    {`curl -X DELETE "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records/<RECORD_ID>" -H "Authorization: Bearer <API_TOKEN>"`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#080d1e] flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>CVSS v3.1 Base Score: {fingerprint.cvssScore} / 10.0</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
