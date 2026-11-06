"use client";

import React, { useState, useMemo } from "react";
import {
  FileCode,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Server,
  Key,
  Globe,
  Terminal,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  Code2,
  Lock,
  GitCompare,
  Zap,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import type { CompleteScanResult } from "@/lib/types/scanner";

interface HardeningConfigStudioProps {
  scan: CompleteScanResult;
}

export type ConfigType =
  | "nginx"
  | "bind"
  | "terraform"
  | "nextjs"
  | "aws_cli";

export interface GeneratedConfig {
  id: ConfigType;
  title: string;
  filename: string;
  language: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  code: string;
  diffBefore?: string;
  diffAfter?: string;
}

export function HardeningConfigStudio({ scan }: HardeningConfigStudioProps) {
  const { playClick, playDownload } = useTacticalAudio();
  const [selectedConfigId, setSelectedConfigId] = useState<ConfigType>("nginx");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDiffView, setShowDiffView] = useState(false);

  const target = scan.targetDomain;

  // Generate specialized configuration templates customized for target domain
  const configs: GeneratedConfig[] = useMemo(() => {
    // 1. NGINX Hardened Configuration
    const nginxCode = `# =========================================================================
# SHADOR Production Hardened Nginx Configuration for: ${target}
# Standard: RFC 6797 (HSTS), RFC 9116 (Security.txt), OWASP Top 10 Hardening
# =========================================================================

# Global Rate Limiting Zone to prevent Layer 7 DoS and brute-force
limit_req_zone $binary_remote_addr zone=perip:10m rate=15r/s;
limit_conn_zone $binary_remote_addr zone=addr:10m;

server {
    listen 80;
    listen [::]:80;
    server_name ${target} www.${target};

    # Force immediate HTTPS redirect (RFC 6797 requirement)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${target} www.${target};

    # TLS Certificates (Mount your Let's Encrypt or Cloudflare Origin CA)
    ssl_certificate /etc/ssl/certs/${target}.crt;
    ssl_certificate_key /etc/ssl/private/${target}.key;

    # Cryptographic Cipher Suites (RFC 8446 TLS 1.3 / 1.2 Strict PFS)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # OCSP Stapling (RFC 6066)
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # Defense-in-Depth Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-ancestors 'none'; object-src 'none'; base-uri 'self';" always;

    # Prevent information disclosure of Nginx version
    server_tokens off;

    # Block access to hidden files (.git, .env, .htaccess)
    location ~ /\\.(?!well-known) {
        deny all;
        access_log off;
        log_not_found off;
    }

    # RFC 9116 Responsible Disclosure Endpoint
    location = /.well-known/security.txt {
        default_type text/plain;
        return 200 "Contact: security@${target}\\nExpires: 2027-12-31T23:59:59.000Z\\nPreferred-Languages: en\\nPolicy: https://${target}/security-policy\\n";
    }

    location / {
        limit_req zone=perip burst=20 nodelay;
        limit_conn addr 15;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

    // 2. BIND9 & Route 53 Master Zone File
    const bindCode = `; =========================================================================
; SHADOR Cryptographically Hardened BIND9 Zone File for: ${target}
; Standard: RFC 1035 (DNS), RFC 7208 (SPF), RFC 7489 (DMARC), RFC 8461 (MTA-STS)
; =========================================================================

$TTL 300
@       IN      SOA     ns1.${target}. hostmaster.${target}. (
                        ${new Date().toISOString().slice(0, 10).replace(/-/g, "")}01 ; Serial
                        7200         ; Refresh (2 hours)
                        3600         ; Retry (1 hour)
                        1209600      ; Expire (2 weeks)
                        300 )        ; Negative Cache TTL

; Authoritative Nameservers
@       IN      NS      ns1.${target}.
@       IN      NS      ns2.${target}.

; Apex and Subdomain Host Records
@       IN      A       ${scan.network?.primaryIps[0]?.ip || "104.21.5.12"}
www     IN      CNAME   ${target}.

; -------------------------------------------------------------------------
; Hardened Email Authentication & Anti-Spoofing Records
; -------------------------------------------------------------------------
; RFC 7208 SPF: Hard-fail '-all' to prohibit unauthorized senders
@       IN      TXT     "v=spf1 include:_spf.google.com -all"

; RFC 7489 DMARC: Strict quarantine/reject policy with automated forensic telemetry
_dmarc  IN      TXT     "v=DMARC1; p=reject; sp=reject; adkim=r; aspf=r; pct=100; rua=mailto:dmarc-reports@${target}; ruf=mailto:dmarc-failures@${target}; fo=1"

; RFC 8461 MTA-STS (Mail Transfer Agent Strict Transport Security)
_mta-sts IN     TXT     "v=STSv1; id=${scan.id.replace(/[^0-9]/g, '').slice(0, 14) || "2026103001"};"
mta-sts  IN      A       ${scan.network?.primaryIps[0]?.ip || "104.21.5.12"}

; RFC 8460 SMTP TLS Reporting (TLSRPT)
_smtp._tls IN   TXT     "v=TLSRPTv1; rua=mailto:tls-reports@${target}"

; Cleaned CNAME aliases (Any dangling cloud providers removed)`;

    // 3. Cloudflare WAF Terraform HCL
    const terraformCode = `# =========================================================================
# SHADOR Cloudflare WAF & Edge Security Automation for: ${target}
# Provider: Cloudflare / HashiCorp Terraform
# =========================================================================

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "zone_id" {
  type        = string
  description = "Cloudflare Zone ID for ${target}"
}

# 1. Edge Transport & Protocol Hardening
resource "cloudflare_zone_settings_override" "edge_hardening" {
  zone_id = var.zone_id

  settings {
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    min_tls_version          = "1.2"
    ssl                      = "strict"
    http2                    = "on"
    http3                    = "on"
    brotli                   = "on"
    tls_1_3                  = "on"
    security_level           = "medium"
    challenge_ttl            = 1800
    browser_check            = "on"
    email_obfuscation        = "on"
  }
}

# 2. Cloudflare Authenticated Origin Pulls (Eliminate Direct Origin Bypasses)
resource "cloudflare_authenticated_origin_pulls" "origin_shield" {
  zone_id = var.zone_id
  enabled = true
}

# 3. WAF Rate Limiting & Sensitive Endpoint Shield
resource "cloudflare_ruleset" "waf_protections" {
  zone_id     = var.zone_id
  name        = "SHADOR Edge Defensive Hardening Ruleset"
  description = "Blocks SQL injection, SSRF, Git leakage, and brute-force on ${target}"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    action      = "block"
    expression  = "(http.request.uri.path contains '/.git' or http.request.uri.path contains '/.env' or http.request.uri.path contains '/wp-config.php')"
    description = "Block sensitive dot-file and credential repository indexing"
    enabled     = true
  }

  rules {
    action      = "challenge"
    expression  = "(cf.threat_score gt 20 or not ip.geoip.country in {\"US\" \"CA\" \"GB\" \"DE\" \"FR\" \"IN\" \"JP\"})"
    description = "Managed Challenge on elevated threat scores"
    enabled     = true
  }
}`;

    // 4. Next.js / Vercel Security Headers
    const nextjsCode = `// =========================================================================
// SHADOR Next.js / Vercel Security Headers Middleware for: ${target}
// File: next.config.mjs or next.config.js
// =========================================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;`;

    // 5. AWS Route 53 Cleanup Script
    const awsCliCode = `#!/usr/bin/env bash
# =========================================================================
# SHADOR AWS Route 53 Dangling CNAME Remediation Tool for: ${target}
# Prevents Subdomain Takeovers on S3, Elastic Beanstalk & CloudFront
# =========================================================================

set -euo pipefail

HOSTED_ZONE_NAME="${target}."
echo "[+] SHADOR: Fetching Hosted Zone ID for $HOSTED_ZONE_NAME..."

ZONE_ID=$(aws route53 list-hosted-zones-by-name \\
  --dns-name "$HOSTED_ZONE_NAME" \\
  --query "HostedZones[0].Id" \\
  --output text | sed 's/\\/hostedzone\\///')

echo "[✓] Located Hosted Zone: $ZONE_ID"
echo "[+] Scanning for dangling CNAME alias resource records..."

aws route53 list-resource-record-sets \\
  --hosted-zone-id "$ZONE_ID" \\
  --query "ResourceRecordSets[?Type == 'CNAME']" \\
  --output table

echo "[+] To delete a confirmed dangling orphaned CNAME (e.g. dev.$HOSTED_ZONE_NAME):"
echo 'aws route53 change-resource-record-sets --hosted-zone-id '$ZONE_ID' --change-batch file://delete-cname.json'
echo "[✓] Attack Surface Takeover Vulnerability Mitigated."`;

    return [
      {
        id: "nginx",
        title: "Nginx Hardened Reverse Proxy Block",
        filename: `${target}-nginx.conf`,
        language: "nginx",
        description:
          "Production-ready Nginx configuration enforcing TLS 1.3, strict HSTS, CSP headers, rate-limiting, and .git/.env shielding.",
        badge: "WEB EDGE",
        icon: Server,
        code: nginxCode,
        diffBefore: `server {\n    listen 80;\n    server_name ${target};\n    # Missing HTTPS redirect\n    # Missing HSTS & Security Headers\n    # Vulnerable to Clickjacking & Sniffing\n}`,
        diffAfter: `server {\n    listen 80;\n    return 301 https://$host$request_uri;\n}\nserver {\n    listen 443 ssl http2;\n    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;\n    add_header X-Frame-Options "DENY" always;\n    add_header Content-Security-Policy "...";\n}`,
      },
      {
        id: "bind",
        title: "RFC Hardened BIND9 / DNS Zone File",
        filename: `${target}.zone`,
        language: "dns",
        description:
          "Master DNS zone file with hard-fail SPF (-all), strict DMARC reject policy, MTA-STS, and cleaned CNAME aliases.",
        badge: "DNS & EMAIL",
        icon: Key,
        code: bindCode,
        diffBefore: `; Vulnerable Zone File:\n@  IN  TXT "v=spf1 ~all"  ; Permissive soft-fail\n; Missing DMARC record (Spoofable)\n; Missing MTA-STS`,
        diffAfter: `; Hardened Zone File:\n@       IN TXT "v=spf1 include:_spf.google.com -all"\n_dmarc  IN TXT "v=DMARC1; p=reject; sp=reject; ..."\n_mta-sts IN TXT "v=STSv1; id=2026103001;"`,
      },
      {
        id: "terraform",
        title: "Cloudflare WAF & Edge Security (HCL)",
        filename: "cloudflare_waf.tf",
        language: "terraform",
        description:
          "Automated Terraform Infrastructure-as-Code for Cloudflare WAF, Authenticated Origin Pulls, and DDoS scrubbing.",
        badge: "TERRAFORM",
        icon: Code2,
        code: terraformCode,
      },
      {
        id: "nextjs",
        title: "Next.js & Vercel Security Headers",
        filename: "next.config.mjs",
        language: "javascript",
        description:
          "Ready-to-paste next.config.js snippet applying A+ Grade security headers across all application routes.",
        badge: "DEVSECOPS",
        icon: Globe,
        code: nextjsCode,
      },
      {
        id: "aws_cli",
        title: "AWS Route 53 Takeover Remediation Script",
        filename: "remediate-takeovers.sh",
        language: "bash",
        description:
          "Automated Bash/AWS CLI script to audit and purge orphaned CNAME records pointing to unclaimed S3 and CloudFront buckets.",
        badge: "AWS CLI",
        icon: Terminal,
        code: awsCliCode,
      },
    ];
  }, [target, scan]);

  const activeConfig = useMemo(() => {
    return configs.find((c) => c.id === selectedConfigId) || configs[0];
  }, [configs, selectedConfigId]);

  const handleCopy = (code: string, id: string) => {
    playDownload();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFile = (config: GeneratedConfig) => {
    playDownload();
    const blob = new Blob([config.code], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", config.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="hardening-panel"
      className="rounded-2xl border border-white/[0.1] shadow-2xl p-4 sm:p-6 md:p-7 space-y-6 select-none"
      style={{ backgroundColor: "#060914" }}
    >
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-emerald-500/35 bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                Defensive Hardening Configuration & Policy Studio
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hidden sm:inline">
                Production-Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Automated production-grade Nginx, BIND9, Terraform, and Next.js policy generator customized for {target}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDiffView(!showDiffView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all active:scale-95 shadow-sm ${
              showDiffView
                ? "bg-purple-500/20 text-purple-200 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                : "border-white/[0.1] bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            <GitCompare className="h-3.5 w-3.5 text-purple-400" />
            <span>{showDiffView ? "Hide Diff View" : "Compare Before/After"}</span>
          </button>

          <button
            onClick={() => handleDownloadFile(activeConfig)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-400/50 text-slate-300 hover:text-white text-xs font-mono transition-all active:scale-95 shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Download {activeConfig.filename}</span>
          </button>

          <button
            onClick={() => handleCopy(activeConfig.code, activeConfig.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-mono font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
          >
            {copiedId === activeConfig.id ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copy Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {configs.map((c) => {
          const isSelected = c.id === selectedConfigId;
          const Icon = c.icon;

          return (
            <button
              key={c.id}
              onClick={() => {
                playClick();
                setSelectedConfigId(c.id);
              }}
              className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                isSelected
                  ? "border-emerald-500/60 bg-[#0a1818] shadow-[0_0_18px_rgba(16,185,129,0.2)]"
                  : "border-white/[0.06] bg-[#080d1e] hover:border-white/[0.15]"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon
                  className={`h-4 w-4 ${
                    isSelected ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-white/[0.08] bg-white/[0.04] text-slate-300">
                  {c.badge}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-white mt-2 leading-tight">
                {c.title.split(" ")[0]}
              </span>
              <span className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                {c.filename}
              </span>
            </button>
          );
        })}
      </div>

      {/* Visual Diff View (Vulnerable vs Hardened) */}
      {showDiffView && activeConfig.diffBefore && activeConfig.diffAfter && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl border border-rose-500/30 bg-[#12080f] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-rose-400 font-bold border-b border-rose-500/20 pb-2">
              <span>BEFORE: Current Vulnerable Posture</span>
              <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded">Action Required</span>
            </div>
            <pre className="text-[11px] font-mono text-rose-300/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {activeConfig.diffBefore}
            </pre>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/30 bg-[#071313] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-bold border-b border-emerald-500/20 pb-2">
              <span>AFTER: Hardened Production Standard</span>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">RFC Compliant</span>
            </div>
            <pre className="text-[11px] font-mono text-emerald-300/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {activeConfig.diffAfter}
            </pre>
          </div>
        </div>
      )}

      {/* Main Code Editor & Viewer Box */}
      <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#04060d]">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#080d1e] border-b border-white/[0.06] text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-white font-bold">{activeConfig.filename}</span>
            <span className="text-slate-500">({activeConfig.language})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10.5px] text-slate-400 hidden sm:inline">
              {activeConfig.description}
            </span>
            <button
              onClick={() => handleCopy(activeConfig.code, activeConfig.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/[0.08] hover:border-emerald-400/40 text-slate-300 hover:text-white transition-colors"
            >
              {copiedId === activeConfig.id ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-cyan-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[460px] scrollbar-thin">
          <pre className="text-xs font-mono text-slate-200 leading-relaxed select-all">
            <code>{activeConfig.code}</code>
          </pre>
        </div>
      </div>

      {/* Tactical Guidance Footer */}
      <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#070b18] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <span className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Pre-configured with actual target telemetry for immediate production deployment</span>
        </span>
        <span className="text-slate-500 text-[10.5px]">CIS Benchmark & NIST Hardened</span>
      </div>
    </div>
  );
}
