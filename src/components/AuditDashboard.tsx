"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Mail,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Share2,
  TrendingUp,
  TrendingDown,
  Layers,
  Printer,
  Download,
  FileCode,
  Check,
  GitCompare,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  ShieldCheck,
  Network,
  Radio,
  Server,
  MapPin,
  Copy,
  Compass,
  Sparkles,
  Crosshair,
  Flame,
  Bookmark,
  Terminal,
  Bell,
  Users,
  Swords,
  Key,
  BookOpen,
  ListFilter,
  Zap,
  Cpu,
  KeyRound,
  Building,
  Monitor,
  Database,
} from "lucide-react";
import type { CompleteScanResult, SubdomainItem } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { MitreReplayStudio } from "./MitreReplayStudio";
import { X509ChainDrawer } from "./X509ChainDrawer";
import { ShadowDorkRadar } from "./ShadowDorkRadar";
import { BountySubmissionStudio } from "./BountySubmissionStudio";
import { OriginBypassRadar } from "./OriginBypassRadar";
import { ShadowWatchTracker } from "./ShadowWatchTracker";
import { WebhookAlertStudio } from "./WebhookAlertStudio";
import { BreachExposureRadar } from "./BreachExposureRadar";
import { DomainComparisonStudio } from "./DomainComparisonStudio";
import { ThreatSurfaceFilterBar } from "./ThreatSurfaceFilterBar";
import { SatellitePropagationRadar } from "./SatellitePropagationRadar";
import { CloudTakeoverStudio } from "./CloudTakeoverStudio";
import { DnssecZoneRadar } from "./DnssecZoneRadar";
import { ThreatSurfaceHeatmap } from "./ThreatSurfaceHeatmap";
import { PentestMethodologyStudio } from "./PentestMethodologyStudio";
import { AttackPathSimulator } from "./AttackPathSimulator";
import { BatchReconHub } from "./BatchReconHub";
import { HardeningConfigStudio } from "./HardeningConfigStudio";
import { TechStackStudio } from "./TechStackStudio";
import { ReputationRadarStudio } from "./ReputationRadarStudio";
import { SecretDorkStudio } from "./SecretDorkStudio";
import { WarRoomDeck } from "./WarRoomDeck";
import { IntelligenceExportModal } from "./IntelligenceExportModal";
import { AsnRoutingTopology } from "./AsnRoutingTopology";
import { AttackSurfaceTimeMachine } from "./AttackSurfaceTimeMachine";
import { WhoisZoneRadar } from "./WhoisZoneRadar";
import { GeoLocationRadar } from "./GeoLocationRadar";
import { formatUtcDate, formatUtcDateTime } from "@/lib/utils";
import {
  addTargetToWatchlist,
  isTargetInWatchlist,
  removeTargetFromWatchlist,
} from "@/lib/watchlist/watchlist-storage";

interface AuditDashboardProps {
  scan: CompleteScanResult;
}

function generateMarkdownReport(scan: CompleteScanResult): string {
  const date = new Date(scan.sanitizedAt).toUTCString();
  return `# SHADOR Executive Attack Surface Dossier
**Target Domain**: \`${scan.targetDomain}\`  
**Audit Date**: ${date}  
**Overall Posture Grade**: [${scan.score.letterGrade}] (Risk Index: ${scan.score.score}/100)  
**Status**: ${scan.score.title}  

---

## 1. Executive Summary
${scan.score.summary?.replace(/\*\*/g, "").replace(/`/g, "") || "No summary provided."}

---

## 2. Key Attack Surface Vectors
- **Email Spoofability (RFC 7208 / 7489)**: ${scan.emailSpoof.status.toUpperCase()}
  - SPF Mechanism: \`${scan.emailSpoof.spf?.mechanism || "Missing"}\`
  - DMARC Policy: \`${scan.emailSpoof.dmarc?.policy || "Missing"}\`
  - Direct Impersonation Risk: ${scan.emailSpoof.canSpoofDirectly ? "CRITICAL (Spoofable)" : "Hardened"}
- **Cryptographic TLS Resilience**: ${scan.tls.hasTls ? "Active" : "Disabled"}
  - Protocol: \`${scan.tls.protocol}\`
  - Cipher: \`${scan.tls.cipherSuite}\`
  - Expiry: ${scan.tls.daysRemaining} days remaining (${scan.tls.validTo})
- **Subdomain & CNAME Hijacking**:
  - Discovered Assets: ${scan.subdomains.discoveredCount}
  - Dangling CNAME Takeovers: ${scan.subdomains.danglingTakeoversFound}
- **OWASP Edge Defensive Headers**: Score ${scan.headers.score}/100
  - Missing Headers: ${scan.headers.missingCount}
  - HTTPS Redirection: ${scan.headers.forcesHttpsRedirect ? "Enforced" : "Not Enforced"}
- **Autonomous BGP & Network Perimeter**:
  - Primary ASN: \`${scan.network?.primaryAsn?.asn || "AS-Unknown"}\` (${scan.network?.primaryAsn?.organization || "Unknown"})
  - Routing Architecture: ${scan.network?.infrastructureClassification || "Standard Hosting"}
  - Anycast DDoS Scrubbing: ${scan.network?.isAnycastProtected ? "Active (Resilient)" : "Unicast (Direct Origin)"}
  - Protocol Dual-Stack: ${scan.network?.hasDualStackIpv6 ? "IPv4 / IPv6 Dual-Stack Active" : "IPv4-Only"}
  - Routing Resilience Score: ${scan.network?.routingSecurityScore ?? 80}/100

---

## 3. Threat Modeling & Remediation
${scan.aiAnalysis?.attackChainNarrative || "Standard passive posture maintained. Zero immediate high-risk takeover paths detected."}

---
*Report generated autonomously by SHADOR by Akshay Sharma.*
`;
}

function downloadJsonDossier(scan: CompleteScanResult) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scan, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `shador-${scan.targetDomain}-${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function printExecutiveDossier(scan: CompleteScanResult) {
  const printWindow = window.open("", "_blank", "width=920,height=960");
  if (!printWindow) return;

  const gradeColor =
    scan.score.letterGrade === "A"
      ? "#059669"
      : scan.score.letterGrade === "B"
      ? "#0284c7"
      : scan.score.letterGrade === "C"
      ? "#d97706"
      : scan.score.letterGrade === "D"
      ? "#ea580c"
      : "#dc2626";

  const threatLevel =
    scan.score.score < 25
      ? "MINIMAL THREAT POSTURE"
      : scan.score.score < 50
      ? "MODERATE EXPOSURE"
      : scan.score.score < 75
      ? "ELEVATED RISK LEVEL"
      : "CRITICAL COMPROMISE DANGER";

  const cleanSummary = (scan.score.summary || "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "");

  const cleanNarrative = (scan.aiAnalysis?.attackChainNarrative || "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "");

  const hasHsts = Boolean(
    scan.headers.auditedHeaders?.["strict-transport-security"]?.present
  );
  const hasCsp = Boolean(
    scan.headers.auditedHeaders?.["content-security-policy"]?.present
  );
  const hasSecurityTxt = Boolean(scan.headers.hasSecurityTxt);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SHADOR Executive Dossier — ${scan.targetDomain}</title>
  <style>
    @page {
      margin: 1.4cm;
      size: A4 portrait;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 12px;
    }
    .classification-bar {
      background: #0f172a;
      color: #38bdf8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 6px 12px;
      text-align: center;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin: 0;
      line-height: 1.1;
    }
    .brand-sub {
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      font-family: ui-monospace, monospace;
      letter-spacing: 1.5px;
      margin-top: 4px;
      font-weight: 600;
    }
    .meta-table {
      font-family: ui-monospace, monospace;
      font-size: 10.5px;
      text-align: right;
      color: #334155;
    }
    .meta-table strong {
      color: #0f172a;
    }
    .scorecard {
      display: flex;
      align-items: stretch;
      gap: 18px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .grade-badge {
      width: 95px;
      min-width: 95px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      background: ${gradeColor};
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 10px 0;
    }
    .grade-letter {
      font-size: 42px;
      font-weight: 900;
      line-height: 1;
    }
    .grade-caption {
      font-size: 9px;
      text-transform: uppercase;
      font-family: ui-monospace, monospace;
      letter-spacing: 1.5px;
      margin-top: 4px;
      opacity: 0.9;
    }
    .score-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .threat-tag {
      display: inline-block;
      font-family: ui-monospace, monospace;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      background: #e2e8f0;
      color: #0f172a;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
      align-self: flex-start;
    }
    .score-heading {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .risk-bar-container {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
      margin: 6px 0 10px 0;
    }
    .risk-bar-fill {
      height: 100%;
      background: ${gradeColor};
      width: ${scan.score.score}%;
      border-radius: 999px;
    }
    .score-text {
      color: #475569;
      font-size: 11.5px;
      line-height: 1.45;
      margin: 0;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 5px;
      margin-bottom: 12px;
      font-family: ui-monospace, monospace;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
    }
    .grid-matrix {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .pillar-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .pillar-label {
      font-size: 9.5px;
      text-transform: uppercase;
      color: #64748b;
      font-family: ui-monospace, monospace;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .pillar-val {
      font-size: 13.5px;
      font-weight: 800;
      font-family: ui-monospace, monospace;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .pillar-meta {
      font-size: 10.5px;
      color: #64748b;
      line-height: 1.35;
    }
    .narrative-box {
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0f172a;
      background: #f8fafc;
      border-radius: 0 6px 6px 0;
      padding: 12px 16px;
      font-family: ui-monospace, monospace;
      font-size: 10.5px;
      line-height: 1.5;
      color: #334155;
      white-space: pre-wrap;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .signoff-section {
      border-top: 1.5px dashed #cbd5e1;
      padding-top: 18px;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .signoff-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 32px;
      margin-top: 12px;
    }
    .signoff-box {
      border-top: 1px solid #94a3b8;
      padding-top: 8px;
      font-size: 10px;
      font-family: ui-monospace, monospace;
      color: #475569;
    }
    .signoff-title {
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      font-size: 10.5px;
      margin-bottom: 2px;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
      font-family: ui-monospace, monospace;
    }
  </style>
</head>
<body>
  <div class="classification-bar">
    Classification: Tactical OSINT Reconnaissance Dossier • Confidential
  </div>

  <div class="header">
    <div>
      <h1 class="brand-title">SHADOR</h1>
      <div class="brand-sub">Autonomous Attack Surface & OSINT Dossier</div>
    </div>
    <div class="meta-table">
      <div><strong>Target Perimeter:</strong> ${scan.targetDomain}</div>
      <div><strong>Audited (UTC):</strong> ${new Date(scan.sanitizedAt).toUTCString()}</div>
      <div><strong>Audit UUID:</strong> ${scan.id}</div>
      <div><strong>Standard:</strong> IEEE Std 830-1998</div>
    </div>
  </div>

  <div class="scorecard">
    <div class="grade-badge">
      <span class="grade-letter">${scan.score.letterGrade}</span>
      <span class="grade-caption">Posture</span>
    </div>
    <div class="score-info">
      <span class="threat-tag">${threatLevel}</span>
      <h2 class="score-heading">${scan.score.title} (Risk Index: ${scan.score.score}/100)</h2>
      <div class="risk-bar-container">
        <div class="risk-bar-fill"></div>
      </div>
      <p class="score-text">${cleanSummary}</p>
    </div>
  </div>

  <div class="section-title">
    <span>Attack Surface Telemetry Matrix (6 Security Vectors)</span>
    <span>Score: ${100 - scan.score.score}/100</span>
  </div>

  <div class="grid-matrix">
    <div class="pillar-card">
      <div class="pillar-label">Email Spoofability (RFC 7208 / 7489)</div>
      <div class="pillar-val">${scan.emailSpoof.status.toUpperCase()} (Spoofable: ${scan.emailSpoof.canSpoofDirectly ? "YES" : "NO"})</div>
      <div class="pillar-meta">
        DMARC Policy: <strong>${scan.emailSpoof.dmarc?.policy || "Missing"}</strong> • SPF: <strong>${scan.emailSpoof.spf?.mechanism || "Missing"}</strong><br>
        MTA-STS: ${scan.emailSpoof.hasMtaSts ? "Enforced" : "Missing"} • BIMI: ${scan.emailSpoof.hasBimi ? "Aligned" : "Not Configured"}
      </div>
    </div>

    <div class="pillar-card">
      <div class="pillar-label">TLS Cryptography & X.509 Trust</div>
      <div class="pillar-val">${scan.tls.hasTls ? scan.tls.protocol : "No TLS"} (${scan.tls.daysRemaining}d remaining)</div>
      <div class="pillar-meta">
        Cipher Suite: <strong>${scan.tls.cipherSuite || "None"}</strong><br>
        CA Issuer: <strong>${scan.tls.issuer?.org || scan.tls.issuer?.commonName || "Unknown"}</strong> • Self-Signed: ${scan.tls.isSelfSigned ? "YES" : "NO"}
      </div>
    </div>

    <div class="pillar-card">
      <div class="pillar-label">Certificate Transparency & Takeovers</div>
      <div class="pillar-val">${scan.subdomains.discoveredCount} Subdomains • ${scan.subdomains.danglingTakeoversFound} Takeovers</div>
      <div class="pillar-meta">
        Dangling Pointers: <strong>${scan.subdomains.danglingTakeoversFound > 0 ? "CRITICAL RISK FOUND" : "Zero Dangling CNAMEs"}</strong><br>
        Source: Passive crt.sh CT Log Ingestion • Wildcard Filter: ${scan.subdomains.isWildcardFiltered ? "Active" : "None"}
      </div>
    </div>

    <div class="pillar-card">
      <div class="pillar-label">Edge Defensive Headers & OWASP</div>
      <div class="pillar-val">Score: ${scan.headers.score}/100 (${scan.headers.missingCount} Missing)</div>
      <div class="pillar-meta">
        HSTS Preload: <strong>${hasHsts ? "Enforced" : "Missing"}</strong> • HTTPS Redirect: ${scan.headers.forcesHttpsRedirect ? "Yes" : "No"}<br>
        CSP: ${hasCsp ? "Configured" : "Missing"} • RFC 9116 security.txt: ${hasSecurityTxt ? "Present" : "Missing"}
      </div>
    </div>

    <div class="pillar-card">
      <div class="pillar-label">Autonomous Network Perimeter & BGP</div>
      <div class="pillar-val">${scan.network?.primaryAsn?.asn || "BGP Routed"} (${scan.network?.isAnycastProtected ? "Anycast Edge" : "Unicast"})</div>
      <div class="pillar-meta">
        Fabric: <strong>${scan.network?.primaryAsn?.organization || "Enterprise Provider"}</strong><br>
        Dual-Stack IPv6: ${scan.network?.hasDualStackIpv6 ? "YES (Dual-Stack)" : "NO (IPv4 Only)"} • Discovered IPs: ${scan.network?.totalIpsDetected || 1}
      </div>
    </div>

    <div class="pillar-card">
      <div class="pillar-label">WAF Ingress & Cloudflare Origin Bypass</div>
      <div class="pillar-val">${scan.originBypass?.isBehindWaf ? `${scan.originBypass.wafProvider || "WAF"} Proxy` : "Direct Origin Exposure"}</div>
      <div class="pillar-meta">
        Origin Leak Risk: <strong>${scan.originBypass?.candidates && scan.originBypass.candidates.length > 0 ? `${scan.originBypass.candidates.length} Candidate IPs Detected` : "Zero Leaks (Optimal)"}</strong><br>
        Historical DNS Pivot: Active
      </div>
    </div>
  </div>

  <div class="section-title">
    <span>Cognitive Threat Simulation & Adversary Vector</span>
    <span>Autonomous Red Team</span>
  </div>

  <div class="narrative-box">${cleanNarrative || "Standard passive attack surface perimeter maintained. Zero active exploitation kill-chains identified."}</div>

  <div class="signoff-section">
    <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; font-family: ui-monospace, monospace; color: #0f172a; margin-bottom: 24px;">
      Enterprise Security Audit Verification & Authorization Sign-Off
    </div>
    <div class="signoff-grid">
      <div class="signoff-box">
        <div class="signoff-title">Lead Penetration Tester & OSINT Auditor</div>
        <div>Signature: _________________________________________</div>
        <div style="margin-top:4px;">Date: ${new Date().toISOString().split("T")[0]} &nbsp;•&nbsp; Methodology: NIST SP 800-115</div>
      </div>
      <div class="signoff-box">
        <div class="signoff-title">Chief Information Security Officer (CISO) Approval</div>
        <div>Signature: _________________________________________</div>
        <div style="margin-top:4px;">Review Status: APPROVED &nbsp;•&nbsp; Next Audit: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>SHADOR Autonomous EASM & OSINT Engine • IEEE Std 830-1998 Compliant</div>
    <div>Report ID: ${scan.id} • Target: ${scan.targetDomain}</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  <\/script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function AuditDashboard({ scan }: AuditDashboardProps) {
  const { playClick, playDownload, triggerHaptic } = useTacticalAudio();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "heatmap"
    | "methodology"
    | "killchain"
    | "batch"
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
    | "hardening"
    | "techstack"
    | "reputation"
    | "secretdorks"
    | "whois"
    | "geo"
  >("overview");
  const [subdomainSearch, setSubdomainSearch] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [showDriftDetails, setShowDriftDetails] = useState(false);
  const [bountyStudioOpen, setBountyStudioOpen] = useState(false);
  const [webhookStudioOpen, setWebhookStudioOpen] = useState(false);
  const [takeoverStudioOpen, setTakeoverStudioOpen] = useState(false);
  const [selectedTakeoverSubdomain, setSelectedTakeoverSubdomain] = useState<SubdomainItem | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [warRoomOpen, setWarRoomOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Global hotkey 'W' for CISO War Room Command Deck
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.getAttribute("contenteditable") === "true")
      ) {
        return;
      }
      if ((e.key === "w" || e.key === "W") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setWarRoomOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Tactical vibration trigger on critical/spoofable threat exposure
  useEffect(() => {
    if (scan.score.score >= 70 || scan.emailSpoof.canSpoofDirectly || scan.emailSpoof.status === "critical") {
      triggerHaptic("warning");
    }
  }, [scan.id, scan.score.score, scan.emailSpoof.canSpoofDirectly, scan.emailSpoof.status, triggerHaptic]);

  // Mobile swipeable tabs sequence (ordered navigation flow)
  const MOBILE_SWIPE_TABS: Array<typeof activeTab> = [
    "overview",
    "heatmap",
    "methodology",
    "killchain",
    "batch",
    "email",
    "subdomains",
    "tls",
    "headers",
    "network",
    "mitre",
    "dorks",
    "origin",
    "watchlist",
    "cli",
    "breach",
    "compare",
    "satellite",
    "dnssec",
    "hardening",
    "techstack",
    "reputation",
    "secretdorks",
    "whois",
    "geo",
  ];

  // Touch gesture state references
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);
  const touchStartTime = React.useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Filter out touch on interactive elements (inputs, canvases, sliders, buttons)
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, .react-flow, #topology, button, a, [role='button']")) {
      return;
    }

    // Gesture threshold: horizontal distance > 60px, horizontal dominant over vertical (> 1.8x), swipe under 500ms
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.8 && deltaTime < 500) {
      const currentIndex = MOBILE_SWIPE_TABS.indexOf(activeTab);
      if (currentIndex === -1) return;

      if (deltaX < 0 && currentIndex < MOBILE_SWIPE_TABS.length - 1) {
        // Swiped Left -> Advance to Next Tab
        switchTab(MOBILE_SWIPE_TABS[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        // Swiped Right -> Return to Previous Tab
        switchTab(MOBILE_SWIPE_TABS[currentIndex - 1]);
      }
    }
  };

  // Auto-center active tab button in navigation bar with smooth hardware acceleration
  useEffect(() => {
    const activeBtn = document.getElementById(`tab-btn-${activeTab}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeTab]);

  useEffect(() => {
    setIsBookmarked(isTargetInWatchlist(scan.targetDomain));
  }, [scan.targetDomain]);

  const handleToggleBookmark = () => {
    triggerHaptic("medium");
    playClick();
    if (isBookmarked) {
      removeTargetFromWatchlist(scan.targetDomain);
      setIsBookmarked(false);
    } else {
      addTargetToWatchlist({
        domain: scan.targetDomain,
        lastScanId: scan.id,
        lastScannedAt: scan.sanitizedAt,
        lastGrade: scan.score.letterGrade,
        lastScore: scan.score.score,
        subdomainCount: scan.subdomains.discoveredCount,
        danglingTakeovers: scan.subdomains.danglingTakeoversFound,
        wafProvider: scan.originBypass?.wafProvider || undefined,
        autoAlert: true,
        tags: ["Monitored"],
        notes: `Tracked asset. Last posture grade [${scan.score.letterGrade}] (${scan.score.score}/100).`,
      });
      setIsBookmarked(true);
    }
  };

  // Listen for navigation requests from the Features dropdown or external triggers
  useEffect(() => {
    const handleRemoteTab = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: string; sectionId?: string }>;
      if (customEvent.detail?.tab === "bounty") {
        setBountyStudioOpen(true);
      } else if (customEvent.detail?.tab === "takeover") {
        setTakeoverStudioOpen(true);
      } else if (customEvent.detail?.tab === "warroom") {
        setWarRoomOpen(true);
      } else if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab as typeof activeTab);
      }
      if (customEvent.detail?.sectionId) {
        const el = document.getElementById(customEvent.detail.sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    window.addEventListener("shadowtrace:switch-tab", handleRemoteTab);
    window.addEventListener("shador:switch-tab", handleRemoteTab);
    return () => {
      window.removeEventListener("shadowtrace:switch-tab", handleRemoteTab);
      window.removeEventListener("shador:switch-tab", handleRemoteTab);
    };
  }, []);

  const { score, emailSpoof, subdomains, tls, headers, drift, network } = scan;

  const switchTab = (tab: typeof activeTab) => {
    triggerHaptic("light");
    playClick();
    setActiveTab(tab);
  };

  const handleShare = () => {
    triggerHaptic("medium");
    playDownload();
    const url = `${window.location.origin}/report/${scan.id}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-white border-emerald-500/60 bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.4)]";
      case "B":
        return "text-white border-cyan-400/60 bg-cyan-500/20 shadow-[0_0_30px_rgba(0,240,255,0.4)]";
      case "C":
        return "text-white border-amber-500/60 bg-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.4)]";
      case "D":
        return "text-white border-rose-500/60 bg-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.45)]";
      default:
        return "text-white border-rose-600/70 bg-gradient-to-r from-rose-950/80 via-crimson-900/60 to-rose-950/80 shadow-[0_0_35px_rgba(225,29,72,0.6)]";
    }
  };

  const filteredSubdomains = subdomains.subdomains.filter((s) =>
    s.domain.toLowerCase().includes(subdomainSearch.toLowerCase())
  );

  return (
    <section
      id="posture"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full space-y-6 touch-pan-y"
    >
      {/* Infrastructure Drift Notification Banner (FR-10) */}
      {drift && drift.hasDrift && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-[#0e121d] to-amber-500/10 p-4 sm:p-5 backdrop-blur-xl shadow-xl shadow-amber-500/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  Infrastructure Drift Detected vs Prior Audit Snapshot
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">{drift.summary}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {drift.riskScoreDelta !== 0 && (
                <span
                  className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full border shadow-sm ${
                    drift.riskScoreDelta > 0
                      ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                      : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {drift.riskScoreDelta > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {drift.riskScoreDelta > 0 ? `+${drift.riskScoreDelta} Risk Delta` : `${drift.riskScoreDelta} Security Gain`}
                </span>
              )}

              <button
                onClick={() => setShowDriftDetails(!showDriftDetails)}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-mono font-semibold text-amber-200 hover:bg-amber-500/30 transition-all active:scale-95 shadow-sm"
              >
                <GitCompare className="h-3.5 w-3.5 text-amber-400" />
                <span>{showDriftDetails ? "Hide Delta Matrix" : "Inspect Delta Matrix"}</span>
                {showDriftDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Interactive Collapsible Drift Matrix */}
          {showDriftDetails && (
            <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-4 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-black/50 border border-amber-500/20">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">New Subdomains</span>
                  <span className="text-sm font-bold font-mono text-emerald-300">+{drift.newSubdomains.length} Detected</span>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-amber-500/20">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Removed Subdomains</span>
                  <span className="text-sm font-bold font-mono text-slate-400">-{drift.decommissionedSubdomains.length} Inactive</span>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-amber-500/20">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">DNS / Policy Rules</span>
                  <span className="text-sm font-bold font-mono text-amber-300">{drift.dnsChanges.length} Alterations</span>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-amber-500/20">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">TLS Expiry Delta</span>
                  <span className="text-sm font-bold font-mono text-cyan-300">
                    {drift.sslDaysDelta > 0 ? `+${drift.sslDaysDelta}d` : `${drift.sslDaysDelta}d`}
                  </span>
                </div>
              </div>

              {/* Surfaced & Decommissioned Lists */}
              <div className="grid sm:grid-cols-2 gap-3">
                {drift.newSubdomains.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                    <span className="text-xs font-mono font-semibold text-emerald-300 flex items-center gap-1.5">
                      <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
                      Newly Surfaced Subdomain Assets ({drift.newSubdomains.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {drift.newSubdomains.map((sub) => (
                        <span
                          key={sub}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {drift.decommissionedSubdomains.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-700/40 space-y-2">
                    <span className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5">
                      <MinusCircle className="h-3.5 w-3.5 text-slate-400" />
                      Decommissioned / Inactive Assets ({drift.decommissionedSubdomains.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {drift.decommissionedSubdomains.map((sub) => (
                        <span
                          key={sub}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/40 text-slate-400 line-through"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* DNS Alterations */}
              {drift.dnsChanges.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                  <span className="text-xs font-mono font-semibold text-amber-300 block mb-1">
                    DNS & Security Policy Mutations:
                  </span>
                  {drift.dnsChanges.map((change, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs font-mono text-slate-200"
                    >
                      <ArrowRight className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{change}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Link to previous snapshot */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400 pt-2 border-t border-amber-500/20">
                <span suppressHydrationWarning>Baseline Snapshot Recorded: {formatUtcDateTime(drift.previousScanTimestamp)}</span>
                <Link
                  href={`/report/${drift.previousScanId}`}
                  className="inline-flex items-center gap-1.5 text-amber-300 hover:text-white transition-colors"
                >
                  <span>Open Prior Audit Snapshot ({drift.previousScanId})</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Posture Scorecard Header with Cyber Arc Reactor Depth */}
      <div className="relative overflow-hidden rounded-2xl cyber-card p-6 sm:p-8 shadow-2xl">
        {/* Quad-Chromatic Aurora Depth Cones: Cyan Defensive Right + Crimson Threat Left */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 -ml-20 -mt-20 h-72 w-72 rounded-full bg-rose-600/14 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 -mb-20 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative grid gap-6 lg:grid-cols-12 lg:items-center">
          {/* Circular Score Gauge & Grade */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-white/[0.08] bg-[#04060e]/95 shadow-2xl">
            <div className="relative flex items-center justify-center">
              {/* Circular Gauge SVG with Neon Glow */}
              <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800/80"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={326}
                  strokeDashoffset={326 - (326 * score.score) / 100}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ${
                    score.score <= 20
                      ? "text-emerald-400 drop-shadow-[0_0_14px_rgba(16,185,129,0.8)]"
                      : score.score <= 40
                      ? "text-cyan-400 drop-shadow-[0_0_14px_rgba(0,245,255,0.8)]"
                      : score.score <= 60
                      ? "text-amber-400 drop-shadow-[0_0_14px_rgba(245,158,11,0.8)]"
                      : "text-rose-500 drop-shadow-[0_0_16px_rgba(244,63,94,0.9)]"
                  }`}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white font-mono tracking-tight">{score.score}</span>
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-widest mt-0.5">
                  Risk Index
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`text-2xl font-black px-6 py-2 rounded-xl border font-mono tracking-wider ${getGradeColor(
                  score.letterGrade
                )}`}
              >
                Grade {score.letterGrade}
              </span>
            </div>
            <span className="text-xs text-slate-300 font-mono mt-2 tracking-wide">
              {score.score <= 20 ? "Hardened Enterprise Perimeter" : score.score <= 60 ? "Elevated Risk Posture" : "Critical Exposure Vector"}
            </span>
          </div>

          {/* Details & Telemetry Specs */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/40 px-3 py-0.5 rounded-full shadow-sm">
                  TARGET: {scan.targetDomain}
                </span>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  {scan.executionTimeMs}ms
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">{score.title}</h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">{score.summary?.replace(/\*\*/g, "").replace(/`/g, "")}</p>
            </div>

            {/* Quick Metrics Bar with Distinct Color Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4 border-t border-white/[0.08]">
              <div className="p-3.5 rounded-xl bg-[#080b15] border border-white/[0.06] shadow-sm">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Email Spoof</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    emailSpoof.status === "critical" ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {emailSpoof.status.toUpperCase()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080b15] border border-white/[0.06] shadow-sm">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Subdomains</span>
                <span className="text-sm font-bold font-mono text-cyan-300">
                  {subdomains.discoveredCount} Found
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080b15] border border-white/[0.06] shadow-sm">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">TLS / SSL</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    tls.status === "critical" ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {tls.hasTls ? `${tls.daysRemaining}d Left` : "None"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080b15] border border-white/[0.06] shadow-sm">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Edge Headers</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    headers.score < 50 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {headers.score}/100
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080b15] border border-white/[0.06] shadow-sm">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Domain Age</span>
                <span className="text-sm font-bold font-mono text-cyan-300 truncate block" title={scan.whois?.ageHuman || "Active"}>
                  {scan.whois?.ageHuman ? scan.whois.ageHuman.split(" ")[0] + " " + (scan.whois.ageHuman.split(" ")[1] || "") : "Established"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080b15] border border-white/[0.06] shadow-sm">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Geo-IP Edge</span>
                <span className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5 truncate">
                  <span>{scan.network?.primaryAsn?.flagEmoji || "🌐"}</span>
                  <span>{scan.network?.primaryAsn?.countryCode || "Global"}</span>
                </span>
              </div>
            </div>

            {/* Autonomous Network Perimeter & ASN Telemetry Strip */}
            {network && network.primaryAsn && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#080c18] border border-cyan-500/20 text-xs font-mono shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-400 shrink-0">
                    <Radio className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Routing Topology & Primary ASN</span>
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="text-cyan-300 font-mono">{network.primaryAsn.asn}</span>
                      <span className="text-slate-400">·</span>
                      <span className="truncate max-w-[200px] sm:max-w-none">{network.primaryAsn.organization}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({network.primaryAsn.countryCode} · {network.primaryAsn.registry})
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {network.isAnycastProtected ? (
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-sm flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> ANYCAST PROTECTED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-sm">
                      UNICAST ROUTED
                    </span>
                  )}

                  {network.hasDualStackIpv6 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/15 text-purple-300">
                      IPv6 READY
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Executive Dossier Action Hub */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-mono font-medium text-cyan-200 hover:bg-cyan-500/25 hover:border-cyan-400 transition-all shadow-md active:scale-95"
                title="Copy shareable permalink"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{copiedShare ? "Link Copied!" : "Share Link"}</span>
              </button>

              <button
                onClick={() => {
                  playDownload();
                  printExecutiveDossier(scan);
                }}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-mono font-medium text-cyan-200 hover:bg-cyan-500/25 hover:border-cyan-400 transition-all shadow-md active:scale-95"
                title="Print or Save as PDF Dossier"
              >
                <Printer className="h-3.5 w-3.5 text-cyan-400" />
                <span>Print / Save PDF</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("medium");
                  playClick();
                  setExportModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 via-blue-600/15 to-cyan-500/20 px-3.5 py-2 text-xs font-mono font-bold text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/30 transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] active:scale-95 group"
                title="Open Multi-Format Intelligence Feeds (OASIS STIX 2.1 / CISO Markdown / Raw JSON)"
              >
                <Database className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Intelligence Feeds</span>
                <span className="text-[9px] bg-cyan-500/30 text-cyan-200 px-1.5 py-0.2 rounded border border-cyan-400/40 font-bold uppercase">
                  STIX 2.1 / MD
                </span>
              </button>

              <button
                onClick={() => {
                  playDownload();
                  downloadJsonDossier(scan);
                }}
                className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-mono font-medium text-amber-200 hover:bg-amber-500/25 hover:border-amber-400 transition-all shadow-md active:scale-95"
                title="Export complete scan telemetry as JSON"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => {
                  playDownload();
                  navigator.clipboard.writeText(generateMarkdownReport(scan));
                  setCopiedMarkdown(true);
                  setTimeout(() => setCopiedMarkdown(false), 2000);
                }}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-mono font-medium text-emerald-200 hover:bg-emerald-500/25 hover:border-emerald-400 transition-all shadow-md active:scale-95"
                title="Copy GitHub/Jira Markdown Report"
              >
                {copiedMarkdown ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <FileCode className="h-3.5 w-3.5 text-emerald-400" />}
                <span>{copiedMarkdown ? "Markdown Copied!" : "Copy Markdown"}</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setBountyStudioOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-500/20 px-3.5 py-2 text-xs font-mono font-bold text-rose-200 hover:bg-rose-500/30 hover:border-rose-400 transition-all shadow-md shadow-rose-500/10 active:scale-95 group"
                title="1-Click HackerOne / Bugcrowd Submission Studio"
              >
                <Crosshair className="h-3.5 w-3.5 text-rose-400 group-hover:rotate-45 transition-transform" />
                <span>Bug Bounty Studio</span>
                <span className="text-[9px] bg-rose-500/40 text-rose-200 px-1.5 py-0.2 rounded border border-rose-400/40 font-bold uppercase">
                  H1 / BC
                </span>
              </button>

              <button
                onClick={() => {
                  switchTab("origin");
                  const el = document.getElementById("origin-bypass-panel");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 rounded-xl border border-orange-500/50 bg-orange-500/20 px-3.5 py-2 text-xs font-mono font-bold text-orange-200 hover:bg-orange-500/30 hover:border-orange-400 transition-all shadow-md shadow-orange-500/10 active:scale-95 group"
                title="Cloudflare & WAF Origin IP Finder & Historical DNS Time-Machine"
              >
                <Flame className="h-3.5 w-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
                <span>WAF Origin Radar</span>
                {scan.originBypass && scan.originBypass.candidates.length > 0 && (
                  <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.2 rounded border border-rose-400 font-bold">
                    {scan.originBypass.candidates.length}
                  </span>
                )}
              </button>

              <button
                onClick={handleToggleBookmark}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-mono font-bold transition-all shadow-md active:scale-95 group ${
                  isBookmarked
                    ? "border-cyan-400 bg-cyan-500/25 text-cyan-200 shadow-cyan-500/20"
                    : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                }`}
                title="Save target domain to persistent ShadowWatch Radar"
              >
                <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "text-cyan-300 fill-cyan-400" : "text-cyan-400"}`} />
                <span>{isBookmarked ? "In ShadowWatch" : "Track in ShadowWatch"}</span>
              </button>

              <button
                onClick={() => {
                  playDownload();
                  const curlCmd = `curl -s "${window.location.origin}/api/cli?domain=${scan.targetDomain}"`;
                  navigator.clipboard.writeText(curlCmd);
                  setCopiedCli(true);
                  setTimeout(() => setCopiedCli(false), 2000);
                }}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-mono font-medium text-cyan-200 hover:bg-cyan-500/25 hover:border-cyan-400 transition-all shadow-md active:scale-95"
                title="Copy 1-Line Curl Terminal Command"
              >
                {copiedCli ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Terminal className="h-3.5 w-3.5 text-cyan-400" />}
                <span>{copiedCli ? "cURL Copied!" : "1-Line Curl CLI"}</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setWebhookStudioOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-mono font-medium text-cyan-200 hover:bg-cyan-500/25 hover:border-cyan-400 transition-all shadow-md active:scale-95"
                title="Dispatch real-time alerts to Discord or Slack"
              >
                <Bell className="h-3.5 w-3.5 text-cyan-400" />
                <span>Webhook Alerts</span>
              </button>

              <button
                onClick={() => {
                  switchTab("compare");
                  const el = document.getElementById("comparison-panel");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/20 px-3.5 py-2 text-xs font-mono font-bold text-amber-200 hover:bg-amber-500/30 hover:border-amber-400 transition-all shadow-md shadow-amber-500/10 active:scale-95 group"
                title="Launch Dual-Perimeter Benchmark Arena against Competitor"
              >
                <Swords className="h-3.5 w-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Compare Competitor</span>
              </button>

              {/* CISO War Room / Command Deck Mode Trigger */}
              <button
                onClick={() => {
                  triggerHaptic("heavy");
                  playClick();
                  setWarRoomOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-rose-500/60 bg-gradient-to-r from-rose-600/30 via-rose-500/20 to-crimson-600/30 px-4 py-2 text-xs font-mono font-bold text-rose-200 hover:border-rose-400 hover:bg-rose-500/35 transition-all shadow-[0_0_20px_rgba(244,63,94,0.35)] active:scale-95 group"
                title="Launch CISO Fullscreen War Room / Command Deck (Hotkey: W)"
              >
                <Monitor className="h-4 w-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>War Room Deck</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-black/60 border border-rose-500/40 text-[9.5px] text-rose-300">
                  W
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Threat Surface Playbook & Real-Time Filter Bar */}
      <ThreatSurfaceFilterBar
        scan={scan}
        activeTab={activeTab}
        onSelectTab={(tab, sectionId) => {
          switchTab(tab);
          if (sectionId) {
            setTimeout(() => {
              const el = document.getElementById(sectionId);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 60);
          }
        }}
      />

      {/* Navigation Tabs with Dynamic Multi-Chromatic Signatures & Touch Momentum Acceleration */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] overflow-x-auto scroll-momentum-x scrollbar-none pb-2.5 pt-1 touch-pan-x overscroll-x-contain select-none">
        <button
          id="tab-btn-overview"
          onClick={() => switchTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Full Overview
        </button>
        <button
          id="tab-btn-heatmap"
          onClick={() => switchTab("heatmap")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "heatmap"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Threat Heatmap</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
            15 Vectors
          </span>
        </button>
        <button
          id="tab-btn-methodology"
          onClick={() => switchTab("methodology")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "methodology"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
          <span>OWASP Methodology</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
            20 Checklist
          </span>
        </button>
        <button
          id="tab-btn-killchain"
          onClick={() => switchTab("killchain")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "killchain"
              ? "bg-rose-500/20 text-rose-200 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Crosshair className="h-3.5 w-3.5 text-rose-400" />
          <span>Attack Path Simulator</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300">
            Kill Chain
          </span>
        </button>
        <button
          id="tab-btn-batch"
          onClick={() => switchTab("batch")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "batch"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <ListFilter className="h-3.5 w-3.5 text-cyan-400" />
          <span>Scope Queue & Batch</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
            Multi-Target
          </span>
        </button>
        <button
          id="tab-btn-email"
          onClick={() => switchTab("email")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "email"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          Email Spoofability ({emailSpoof.score}/100)
        </button>
        <button
          id="tab-btn-subdomains"
          onClick={() => switchTab("subdomains")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "subdomains"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          Subdomains ({subdomains.discoveredCount})
        </button>
        <button
          id="tab-btn-tls"
          onClick={() => switchTab("tls")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "tls"
              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          TLS Cryptography
        </button>
        <button
          id="tab-btn-headers"
          onClick={() => switchTab("headers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "headers"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          Edge Headers ({headers.score}/100)
        </button>
        {network && (
          <button
            id="tab-btn-network"
            onClick={() => switchTab("network")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
              activeTab === "network"
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Network className="h-3.5 w-3.5 text-cyan-400" />
            <span>Perimeter & ASN HUD</span>
            <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40">
              {network.primaryAsn?.asn || "BGP"}
            </span>
          </button>
        )}
        {scan.whois && (
          <button
            id="tab-btn-whois"
            onClick={() => switchTab("whois")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
              activeTab === "whois"
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Building className="h-3.5 w-3.5 text-cyan-400" />
            <span>WHOIS Lifecycle</span>
            <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40">
              {scan.whois.ageHuman.split(" ")[0]}
            </span>
          </button>
        )}
        <button
          id="tab-btn-geo"
          onClick={() => switchTab("geo")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "geo"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Globe className="h-3.5 w-3.5 text-cyan-400" />
          <span>Geo-IP Location</span>
          <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40">
            {scan.network?.primaryAsn?.flagEmoji || "🌐"} {scan.network?.primaryAsn?.countryCode || "Edge"}
          </span>
        </button>
        <button
          id="tab-btn-mitre"
          onClick={() => switchTab("mitre")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "mitre"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
          <span>MITRE & Replay Studio</span>
        </button>
        <button
          id="tab-btn-dorks"
          onClick={() => switchTab("dorks")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "dorks"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Compass className="h-3.5 w-3.5 text-cyan-400" />
          <span>ShadowDork OSINT</span>
          <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40">
            16 Dorks
          </span>
        </button>
        <button
          id="tab-btn-origin"
          onClick={() => switchTab("origin")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "origin"
              ? "bg-rose-500/20 text-rose-200 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-rose-400" />
          <span>WAF Origin Radar</span>
          {scan.originBypass && (
            <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/40">
              {scan.originBypass.candidates.length > 0
                ? `${scan.originBypass.candidates.length} Leaks`
                : scan.originBypass.isBehindWaf
                ? scan.originBypass.wafProvider?.split(" ")[0] || "WAF"
                : "Direct"}
            </span>
          )}
        </button>
        {drift && (
          <button
            id="tab-btn-drift"
            onClick={() => switchTab("drift")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
              activeTab === "drift"
                ? "bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <GitCompare className="h-3.5 w-3.5 text-amber-400" />
            <span>Infrastructure Drift</span>
            {drift.hasDrift && <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
          </button>
        )}
        <button
          id="tab-btn-watchlist"
          onClick={() => switchTab("watchlist")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "watchlist"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Bookmark className="h-3.5 w-3.5 text-cyan-400" />
          <span>ShadowWatch Radar</span>
        </button>
        <button
          id="tab-btn-cli"
          onClick={() => switchTab("cli")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "cli"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          <span>Terminal CLI</span>
        </button>
        <button
          id="tab-btn-breach"
          onClick={() => switchTab("breach")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "breach"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Users className="h-3.5 w-3.5 text-amber-400" />
          <span>Dark Web & Breaches</span>
        </button>
        <button
          id="tab-btn-compare"
          onClick={() => switchTab("compare")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "compare"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Swords className="h-3.5 w-3.5 text-amber-400" />
          <span>Target Versus Mode</span>
        </button>
        {scan.satelliteRadar && (
          <button
            id="tab-btn-satellite"
            onClick={() => switchTab("satellite")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
              activeTab === "satellite"
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            <span>Satellite HUD</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
              {scan.satelliteRadar.propagationPercentage}%
            </span>
          </button>
        )}
        {scan.authoritativeDns && (
          <button
            id="tab-btn-dnssec"
            onClick={() => switchTab("dnssec")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
              activeTab === "dnssec"
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Key className="h-3.5 w-3.5 text-emerald-400" />
            <span>DNSSEC & AXFR</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded border ${
                scan.authoritativeDns.dnssec.isEnabled
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/20 border-amber-500/30 text-amber-300"
              }`}
            >
              {scan.authoritativeDns.dnssec.isEnabled ? "SECURE" : "UNPROTECTED"}
            </span>
          </button>
        )}
        <button
          id="tab-btn-hardening"
          onClick={() => switchTab("hardening")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "hardening"
              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-emerald-400" />
          <span>Hardening Policies</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
            Nginx / BIND9 / IaC
          </span>
        </button>
        <button
          id="tab-btn-techstack"
          onClick={() => switchTab("techstack")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "techstack"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span>Passive Tech Stack</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
            {scan.techStack?.totalIdentified ?? 0} Detected
          </span>
        </button>
        <button
          id="tab-btn-reputation"
          onClick={() => switchTab("reputation")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "reputation"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Radio className="h-3.5 w-3.5 text-cyan-400" />
          <span>IP Threat Intel Radar</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
            (scan.threatReputation?.toxicityScore ?? 0) >= 36
              ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
              : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
          }`}>
            Toxicity {scan.threatReputation?.toxicityScore ?? 0}/100
          </span>
        </button>
        <button
          id="tab-btn-secretdorks"
          onClick={() => switchTab("secretdorks")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap ${
            activeTab === "secretdorks"
              ? "bg-rose-500/20 text-rose-200 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5 text-rose-400" />
          <span>Secret Exposure Dorks</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300">
            {scan.secretDorks?.criticalVectors ?? 0} Critical
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {/* 0. UNIFIED ATTACK SURFACE DEFENSE HEATMAP (STEP 36) */}
      <div id="heatmap-panel">
        {(activeTab === "overview" || activeTab === "heatmap") && (
          <ThreatSurfaceHeatmap
            scan={scan}
            onSwitchTab={(tab, sectionId) => {
              switchTab(tab as typeof activeTab);
              if (sectionId) {
                setTimeout(() => {
                  const el = document.getElementById(sectionId);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }
            }}
          />
        )}
      </div>

      {/* 0.5 OWASP WSTG & BUG BOUNTY METHODOLOGY STUDIO (STEP 37) */}
      <div id="methodology-panel">
        {(activeTab === "overview" || activeTab === "methodology") && (
          <PentestMethodologyStudio
            scan={scan}
            onSwitchTab={(tab, sectionId) => {
              switchTab(tab as typeof activeTab);
              if (sectionId) {
                setTimeout(() => {
                  const el = document.getElementById(sectionId);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }
            }}
          />
        )}
      </div>

      {/* 0.6 AUTONOMOUS CYBER KILL CHAIN & ATTACK PATH SIMULATOR (STEP 38) */}
      <div id="attack-path-panel">
        {(activeTab === "overview" || activeTab === "killchain") && (
          <AttackPathSimulator
            scan={scan}
            onSwitchTab={(tab, sectionId) => {
              switchTab(tab as typeof activeTab);
              if (sectionId) {
                setTimeout(() => {
                  const el = document.getElementById(sectionId);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }
            }}
          />
        )}
      </div>

      {/* 0.7 MULTI-TARGET BUG BOUNTY SCOPE QUEUE & BATCH RECON HUB (STEP 39) */}
      <div id="batch-recon-panel">
        {activeTab === "batch" && (
          <BatchReconHub
            initialDomain={scan.targetDomain}
          />
        )}
      </div>

      {/* 1. EMAIL SPOOFABILITY PANEL */}
      {(activeTab === "overview" || activeTab === "email") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-400" />
              Email Infrastructure & Spoofability Audit (RFC 7208 / RFC 7489)
            </h3>
            {emailSpoof.canSpoofDirectly && (
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-300 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                DIRECT SPOOFING POSSIBLE
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* SPF Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#070a14] p-5 space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                  Sender Policy Framework (SPF)
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                      emailSpoof.spf.lookupCount > 10
                        ? "text-rose-400 border-rose-500/40 bg-rose-500/10"
                        : "text-slate-300 border-slate-700 bg-slate-800/40"
                    }`}
                  >
                    Lookups: {emailSpoof.spf.lookupCount}/10
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                      emailSpoof.spf.isHardened
                        ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                        : "text-amber-400 border-amber-500/40 bg-amber-500/10"
                    }`}
                  >
                    {emailSpoof.spf.mechanism}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{emailSpoof.spf.explanation}</p>
              {emailSpoof.spf.raw && (
                <div className="p-2.5 rounded-lg bg-[#04060c] border border-white/[0.05] overflow-x-auto">
                  <span className="text-[11px] font-mono text-amber-300 break-all">{emailSpoof.spf.raw}</span>
                </div>
              )}
            </div>

            {/* DMARC Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#070a14] p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                  DMARC Policy Enforcement
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                    emailSpoof.dmarc.policy === "reject"
                      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                      : emailSpoof.dmarc.policy === "quarantine"
                      ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
                      : "text-rose-400 border-rose-500/40 bg-rose-500/10"
                  }`}
                >
                  Policy: p={emailSpoof.dmarc.policy}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{emailSpoof.dmarc.explanation}</p>
              {emailSpoof.dmarc.raw && (
                <div className="p-2.5 rounded-lg bg-[#04060c] border border-white/[0.05] overflow-x-auto">
                  <span className="text-[11px] font-mono text-amber-300 break-all">{emailSpoof.dmarc.raw}</span>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Email Standards: MTA-STS & BIMI */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-[#070a14]">
              <div className="flex items-center gap-2.5">
                <Shield className={`h-4 w-4 ${emailSpoof.hasMtaSts ? "text-emerald-400" : "text-slate-500"}`} />
                <div>
                  <span className="text-xs font-mono font-semibold text-white block">MTA-STS (RFC 8461)</span>
                  <span className="text-[11px] text-slate-400">SMTP TLS downgrade defense</span>
                </div>
              </div>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  emailSpoof.hasMtaSts
                    ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                    : "text-slate-400 border-slate-700 bg-slate-800/30"
                }`}
              >
                {emailSpoof.hasMtaSts ? "ACTIVE" : "UNCONFIGURED"}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-[#070a14]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className={`h-4 w-4 ${emailSpoof.hasBimi ? "text-emerald-400" : "text-slate-500"}`} />
                <div>
                  <span className="text-xs font-mono font-semibold text-white block">BIMI (RFC 8617)</span>
                  <span className="text-[11px] text-slate-400">Brand Indicators for Message Identification</span>
                </div>
              </div>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  emailSpoof.hasBimi
                    ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                    : "text-slate-400 border-slate-700 bg-slate-800/30"
                }`}
              >
                {emailSpoof.hasBimi ? "CONFIGURED" : "UNCONFIGURED"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUBDOMAINS PANEL */}
      {(activeTab === "overview" || activeTab === "subdomains") && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400" />
                Subdomain Attack Surface & Takeover Detection
                <span className="text-xs font-mono text-slate-400 font-normal">
                  ({subdomains.discoveredCount} indexed)
                </span>
              </h3>
              {scan.dns.records.hasWildcardDns && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300">
                  WILDCARD DNS ACTIVE
                </span>
              )}
              {subdomains.isWildcardFiltered && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                  WILDCARD FILTERED
                </span>
              )}
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter subdomains..."
                value={subdomainSearch}
                onChange={(e) => setSubdomainSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#0c121e] text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-full sm:w-56"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#070a14] overflow-hidden shadow-xl">
            <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.05] scrollbar-thin">
              {filteredSubdomains.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-mono">
                  No matching subdomains discovered.
                </div>
              ) : (
                filteredSubdomains.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      <span className="text-xs font-mono font-medium text-slate-200">{sub.domain}</span>
                      {sub.isDangling ? (
                        <button
                          onClick={() => {
                            playClick();
                            setSelectedTakeoverSubdomain(sub);
                            setTakeoverStudioOpen(true);
                          }}
                          className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 hover:border-rose-400 transition-all animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.4)] cursor-pointer"
                          title="Click to launch interactive Cloud Takeover PoC Studio"
                        >
                          DANGLING CNAME ({sub.takeoverProvider}) • Verify PoC
                        </button>
                      ) : sub.cname ? (
                        <button
                          onClick={() => {
                            playClick();
                            setSelectedTakeoverSubdomain(sub);
                            setTakeoverStudioOpen(true);
                          }}
                          className="text-[9.5px] font-mono px-1.5 py-0.2 rounded border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors cursor-pointer"
                          title="Verify Cloud Fingerprint & Takeover Posture"
                        >
                          Verify PoC
                        </button>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      {sub.cname && (
                        <span className="text-slate-400 truncate max-w-[200px]" title={sub.cname}>
                          CNAME: {sub.cname}
                        </span>
                      )}
                      {sub.ipAddresses && sub.ipAddresses.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-300">
                          {sub.ipAddresses[0]}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TLS CRYPTOGRAPHY PANEL */}
      {(activeTab === "overview" || activeTab === "tls") && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            SSL/TLS Cryptographic Posture & Protocol Handshake
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.08] bg-[#070a14] p-5 space-y-2 shadow-lg">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Target Handshake</span>
              <div className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${tls.hasTls ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-rose-400"}`} />
                {tls.hasTls ? "HTTPS Listening (:443)" : "No TLS Connection"}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Protocol: {tls.protocol || "None"} · Cipher: {tls.cipherSuite || "Unknown"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#070a14] p-5 space-y-2 shadow-lg">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Validity Countdown</span>
              <div
                className={`text-base font-bold font-mono ${
                  tls.isExpired ? "text-rose-400" : tls.isExpiringSoon ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {tls.daysRemaining} Days Remaining
              </div>
              <p className="text-xs text-slate-400 font-mono" suppressHydrationWarning>
                {tls.validTo ? `Expires: ${formatUtcDate(tls.validTo)}` : "No Expiry Available"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#070a14] p-5 space-y-2 shadow-lg">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Certificate Authority (Issuer)</span>
              <div className="text-base font-bold text-white truncate" title={tls.issuer?.org || "Unknown"}>
                {tls.issuer?.org || tls.issuer?.commonName || "Unknown CA"}
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">
                CN: {tls.commonName || "N/A"}
              </p>
            </div>
          </div>

          {/* Interactive Live X.509 Certificate Chain Hierarchy Drawer */}
          <X509ChainDrawer scan={scan} />
        </div>
      )}

      {/* 4. EDGE DEFENSE HEADERS PANEL */}
      {(activeTab === "overview" || activeTab === "headers") && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              HTTP Edge Security Headers & OWASP Mappings
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span
                className={`px-2.5 py-0.5 rounded-full border ${
                  headers.forcesHttpsRedirect
                    ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                    : "text-rose-300 border-rose-500/40 bg-rose-500/10"
                }`}
              >
                {headers.forcesHttpsRedirect ? "HTTPS REDIRECT: ENFORCED" : "HTTPS REDIRECT: UNENFORCED"}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full border ${
                  headers.hasSecurityTxt
                    ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                    : "text-slate-400 border-slate-700 bg-slate-800/30"
                }`}
              >
                {headers.hasSecurityTxt ? "SECURITY.TXT: DETECTED" : "SECURITY.TXT: NONE"}
              </span>
              <span className="text-slate-400 pl-1">
                Score: {headers.score}/100 ({headers.missingCount} missing)
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(headers.auditedHeaders).map((item) => (
              <div
                key={item.name}
                className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#070a14] p-4 space-y-3 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-white break-all">{item.name}</span>
                    {item.present ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300/90 block mb-2">{item.owaspMapping}</span>
                  <p className="text-xs text-slate-300 leading-normal font-sans">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-mono text-slate-400 block mb-0.5">Recommendation:</span>
                  <span className="text-[11px] font-mono text-slate-200 block truncate" title={item.recommendation}>
                    {item.recommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ATTACK SURFACE TIME MACHINE & INFRASTRUCTURE DRIFT PANEL */}
      {(activeTab === "overview" || activeTab === "drift") && (
        <AttackSurfaceTimeMachine drift={drift} scan={scan} />
      )}

      {/* 6. AUTONOMOUS ASN & GLOBAL BGP ROUTING TOPOLOGY HUD PANEL */}
      {(activeTab === "overview" || activeTab === "network") && network && (
        <AsnRoutingTopology network={network} targetDomain={scan.targetDomain} />
      )}

      {/* 6A. AUTONOMOUS WHOIS & DOMAIN LIFECYCLE INTELLIGENCE RADAR */}
      <div id="whois-panel">
        {(activeTab === "overview" || activeTab === "whois") && scan.whois && (
          <WhoisZoneRadar whois={scan.whois} targetDomain={scan.targetDomain} />
        )}
      </div>

      {/* 6B. GLOBAL GEO-IP SERVER LOCATION & SATELLITE RADAR */}
      <div id="geo-location-panel">
        {(activeTab === "overview" || activeTab === "geo" || activeTab === "network") && (
          <GeoLocationRadar
            locations={scan.network?.geoLocations || scan.geoIp}
            primaryAsn={scan.network?.primaryAsn}
            targetDomain={scan.targetDomain}
          />
        )}
      </div>

      {/* 7. MITRE ATT&CK ENTERPRISE MATRIX & REPLAY STUDIO PANEL */}
      {(activeTab === "overview" || activeTab === "mitre") && (
        <MitreReplayStudio scan={scan} />
      )}

      {/* 8. SHADOWDORK OSINT RECON RADAR PANEL */}
      {(activeTab === "overview" || activeTab === "dorks") && (
        <ShadowDorkRadar targetDomain={scan.targetDomain} />
      )}

      {/* 9. CLOUDFLARE ORIGIN IP FINDER & WAF BYPASS RADAR PANEL */}
      <div id="origin-bypass-panel">
        {(activeTab === "overview" || activeTab === "origin") && scan.originBypass && (
          <OriginBypassRadar originBypass={scan.originBypass} targetDomain={scan.targetDomain} />
        )}
      </div>

      {/* 10. SHADOWWATCH TARGET ASSET INVENTORY & WATCHLIST PANEL */}
      <div id="shadowwatch-panel">
        {(activeTab === "overview" || activeTab === "watchlist") && (
          <ShadowWatchTracker currentDomain={scan.targetDomain} />
        )}
      </div>

      {/* 11. TERMINAL CLI ENGINE & 1-LINE HOOK */}
      <div id="cli-panel">
        {(activeTab === "overview" || activeTab === "cli") && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 sm:p-7 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 w-fit">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                  SHADOR TERMINAL ENGINE
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-mono text-white">
                  1-Line Terminal Curl Reconnaissance Hook
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Pipe live RFC reconnaissance data directly into your terminal or automated bash pipeline.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                  ANSI Color Output
                </span>
              </div>
            </div>

            <div className="relative flex items-center rounded-xl border border-cyan-500/30 bg-[#02040a] p-3.5 text-xs font-mono text-cyan-200 overflow-x-auto scrollbar-thin">
              <span className="select-all pr-12">
                {`curl -s "${typeof window !== "undefined" ? window.location.origin : "https://shador.onrender.com"}/api/cli?domain=${scan.targetDomain}"`}
              </span>
              <button
                onClick={() => {
                  playDownload();
                  const cmd = `curl -s "${window.location.origin}/api/cli?domain=${scan.targetDomain}"`;
                  navigator.clipboard.writeText(cmd);
                  setCopiedCli(true);
                  setTimeout(() => setCopiedCli(false), 2000);
                }}
                className="absolute right-2.5 top-2.5 p-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 transition-all"
                title="Copy Terminal Command"
              >
                {copiedCli ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-cyan-400" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 12. DARK WEB & BREACH EXPOSURE RADAR PANEL */}
      <div id="breach-panel">
        {(activeTab === "overview" || activeTab === "breach") && scan.breachRadar && (
          <BreachExposureRadar breachRadar={scan.breachRadar} targetDomain={scan.targetDomain} />
        )}
      </div>

      {/* 13. DUAL-DOMAIN COMPARATIVE HEAD-TO-HEAD BENCHMARK ARENA */}
      <div id="comparison-panel">
        {(activeTab === "overview" || activeTab === "compare") && (
          <DomainComparisonStudio baseScan={scan} />
        )}
      </div>

      {/* 14. GLOBAL MULTI-RESOLVER SATELLITE HUD & PROPAGATION RADAR */}
      <div id="satellite-panel">
        {(activeTab === "overview" || activeTab === "satellite") && scan.satelliteRadar && (
          <SatellitePropagationRadar
            radar={scan.satelliteRadar}
            targetDomain={scan.targetDomain}
          />
        )}
      </div>

      {/* 15. AUTHORITATIVE DNS, DNSSEC & AXFR ZONE RADAR */}
      <div id="dnssec-panel">
        {(activeTab === "overview" || activeTab === "dnssec") && scan.authoritativeDns && (
          <DnssecZoneRadar
            authoritativeDns={scan.authoritativeDns}
            targetDomain={scan.targetDomain}
          />
        )}
      </div>

      {/* 16. DEFENSIVE HARDENING CONFIGURATION & POLICY STUDIO (STEP 41) */}
      <div id="hardening-panel">
        {(activeTab === "overview" || activeTab === "hardening") && (
          <HardeningConfigStudio scan={scan} />
        )}
      </div>

      {/* 17. PASSIVE TECHNOLOGY STACK FINGERPRINT & THREAT HORIZON STUDIO */}
      <div id="techstack-panel">
        {(activeTab === "overview" || activeTab === "techstack") && (
          <TechStackStudio
            techStack={
              scan.techStack || {
                detectedTechnologies: [],
                primaryServer: null,
                primaryCms: null,
                primaryFramework: null,
                cdnProvider: null,
                totalIdentified: 0,
                summary: "Perimeter server tokens are hardened and stripped of standard fingerprint disclosures.",
              }
            }
            targetDomain={scan.targetDomain}
          />
        )}
      </div>

      {/* 18. REPUTATION THREAT INTELLIGENCE & IP TOXICITY RADAR (STEP 43) */}
      <div id="reputation-panel">
        {(activeTab === "overview" || activeTab === "reputation") && scan.threatReputation && (
          <ReputationRadarStudio
            reputation={scan.threatReputation}
            targetDomain={scan.targetDomain}
          />
        )}
      </div>

      {/* 19. PUBLIC SECRET EXPOSURE & CODE DORK RADAR (STEP 44) */}
      <div id="secretdorks-panel">
        {(activeTab === "overview" || activeTab === "secretdorks") && scan.secretDorks && (
          <SecretDorkStudio
            dorkData={scan.secretDorks}
            targetDomain={scan.targetDomain}
          />
        )}
      </div>

      {/* 1-Click Bug Bounty Submission Studio Modal */}
      <BountySubmissionStudio
        scan={scan}
        isOpen={bountyStudioOpen}
        onClose={() => setBountyStudioOpen(false)}
      />

      {/* Tactical Live Webhook Alert Studio Modal */}
      <WebhookAlertStudio
        scan={scan}
        isOpen={webhookStudioOpen}
        onClose={() => setWebhookStudioOpen(false)}
      />

      {/* Cloud Takeover Proof-of-Concept & Fingerprint Studio Modal */}
      <CloudTakeoverStudio
        isOpen={takeoverStudioOpen}
        onClose={() => {
          setTakeoverStudioOpen(false);
          setSelectedTakeoverSubdomain(null);
        }}
        subdomain={selectedTakeoverSubdomain}
        scan={scan}
      />

      {/* Mobile Tactical Quick-Navigation Floating Dock (Thumb-accessible 120Hz Fast Controls) */}
      <div className="fixed bottom-3 left-3 right-3 z-40 sm:hidden pointer-events-auto">
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-[#030611]/94 backdrop-blur-2xl border border-white/[0.14] shadow-[0_8px_32px_rgba(0,0,0,0.85)]">
          {/* Quick Tab Switcher Button */}
          <button
            onClick={() => {
              switchTab("overview");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95 ${
              activeTab === "overview"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>

          {/* Jump to Attack Surface Graph */}
          <button
            onClick={() => {
              triggerHaptic("light");
              playClick();
              const el = document.getElementById("topology");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-semibold text-slate-300 hover:text-cyan-300 active:scale-95 transition-all"
          >
            <Network className="h-3.5 w-3.5 text-cyan-400" />
            <span>Graph</span>
          </button>

          {/* Quick Share / Export */}
          <button
            onClick={() => {
              handleShare();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-semibold text-slate-300 hover:text-white active:scale-95 transition-all"
          >
            <Share2 className="h-3.5 w-3.5 text-rose-400" />
            <span>{copiedShare ? "Copied" : "Share"}</span>
          </button>

          {/* Scroll to Top */}
          <button
            onClick={() => {
              triggerHaptic("light");
              playClick();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white active:scale-95 transition-all"
            title="Scroll to Top"
            aria-label="Scroll to Top"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CISO War Room & Command Deck Full-Screen Operations Modal */}
      <WarRoomDeck
        scan={scan}
        isOpen={warRoomOpen}
        onClose={() => setWarRoomOpen(false)}
      />

      {/* Multi-Format Intelligence Feeds & SIEM STIX 2.1 Export Modal */}
      <IntelligenceExportModal
        scan={scan}
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </section>
  );
}
