"use client";

import React from "react";
import {
  ShieldCheck,
  MailCheck,
  Globe2,
  LockKeyhole,
  Layers,
  Terminal,
  Activity,
  Flame,
} from "lucide-react";

export function FeatureShowcase() {
  const features = [
    {
      icon: ShieldCheck,
      tag: "RFC 1035 / Anti-SSRF",
      badgeClass: "badge-chroma-cyan",
      iconGlow: "from-cyan-500/20 to-blue-600/10 border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]",
      title: "Hardened SSRF & RFC 1035 Fortress",
      description:
        "Normalizes octal, decimal, and hex IP evasions. Hard-blocks RFC 1918 private subnets, loopbacks, and cloud metadata (169.254.169.254) with dual-stack IPv4/IPv6 resolution.",
      highlight: "Zero Internal Ingestion Risk",
      highlightColor: "text-cyan-300",
    },
    {
      icon: MailCheck,
      tag: "RFC 7208 & RFC 7489",
      badgeClass: "badge-chroma-amber",
      iconGlow: "from-amber-500/20 to-orange-600/10 border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
      title: "SPF PermError & DMARC Enforcer",
      description:
        "Audits SPF mechanisms against the strict 10-DNS lookup limit to catch fatal PermErrors. Evaluates DMARC p=reject/quarantine enforcement, MTA-STS, and BIMI trust.",
      highlight: "Direct Phishing Vulnerability Index",
      highlightColor: "text-amber-300",
    },
    {
      icon: Flame,
      tag: "Passive OSINT & CT Logs",
      badgeClass: "badge-chroma-rose",
      iconGlow: "from-rose-500/20 to-red-600/10 border-rose-400/40 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.25)]",
      title: "Dangling CNAME Takeover Radar",
      description:
        "Streams passive Certificate Transparency logs from crt.sh and tests orphaned DNS pointers across AWS S3/CloudFront, GitHub Pages, Heroku, Azure, Surge, and other providers.",
      highlight: "Subdomain Hijacking Prevention",
      highlightColor: "text-rose-300",
    },
    {
      icon: LockKeyhole,
      tag: "Port 443 Handshake",
      badgeClass: "badge-chroma-emerald",
      iconGlow: "from-emerald-500/20 to-teal-600/10 border-emerald-400/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
      title: "Cryptographic TLS & Cipher Posture",
      description:
        "Direct socket connection on port 443 with SNI. Evaluates cipher suite resilience, protocol version (TLSv1.3), expiration countdown, and self-signed certificate risks.",
      highlight: "Active Handshake Verification",
      highlightColor: "text-emerald-300",
    },
    {
      icon: Layers,
      tag: "OWASP Edge Defense",
      badgeClass: "badge-chroma-cyan",
      iconGlow: "from-cyan-500/20 to-blue-600/10 border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]",
      title: "Edge Defensive Headers & RFC 9116",
      description:
        "Audits HSTS max-age, CSP injection restrictions, X-Frame-Options clickjacking mitigation, automatic HTTP->HTTPS redirection, and RFC 9116 security.txt disclosure.",
      highlight: "CVSS & OWASP Vulnerability Mappings",
      highlightColor: "text-cyan-300",
    },
    {
      icon: Terminal,
      tag: "Defensive Hardening",
      badgeClass: "badge-chroma-violet",
      iconGlow: "from-blue-500/20 to-indigo-600/10 border-blue-400/40 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.25)]",
      title: "Adversary Attack Chain Simulation",
      description:
        "Synthesizes multi-stage adversary attack chain scenarios and generates ready-to-deploy Nginx, BIND DNS, and security header remediation configurations.",
      highlight: "1-Click Copy Infrastructure Diffs",
      highlightColor: "text-blue-300",
    },
  ];

  return (
    <section id="features" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Visual Accent Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[300px] bg-cyan-500/08 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[300px] bg-blue-500/08 rounded-full blur-[140px] pointer-events-none" />

      {/* Section Header with Quad-Spectrum Contrast */}
      <div className="text-center space-y-3 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 font-mono text-[11px] font-bold text-rose-400 uppercase tracking-widest">
          <span className="text-cyan-400">[</span>
          <Activity className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
          <span>AUTONOMOUS ATTACK SURFACE MATRIX</span>
          <span className="text-rose-400">]</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
          Enterprise Attack Surface Visibility. <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-cyan-400 via-white via-30% to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(244,63,94,0.35)]">
            Continuous Perimeter Defense.
          </span>
        </h2>
        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          Audit exposed digital assets across DNS infrastructure, email authentication protocols, cryptographic handshake resilience, and domain takeover vectors.
        </p>
      </div>

      {/* Security Capability Highlights Ribbon (Quad-Spectrum Cornerstone Tiles) */}
      <div id="architecture" className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* 1. Electric Cyan Tile */}
        <div className="rounded-2xl border border-cyan-500/25 bg-[#030712] p-4 text-center shadow-lg hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all">
          <span className="text-[10px] font-mono text-cyan-400/80 uppercase block mb-1">Reconnaissance Mode</span>
          <span className="text-base sm:text-lg font-bold font-mono text-cyan-300">100% Passive</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Zero Intrusion Footprint</span>
        </div>

        {/* 2. Crimson Threat Red Tile */}
        <div className="rounded-2xl border border-rose-500/30 bg-[#0a040b] p-4 text-center shadow-lg hover:border-rose-400/60 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-all">
          <span className="text-[10px] font-mono text-rose-400/80 uppercase block mb-1">Offensive Threat Matrix</span>
          <span className="text-base sm:text-lg font-bold font-mono text-rose-300">Multi-Vector</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Subdomain & Cloud Takeovers</span>
        </div>

        {/* 3. Pure Crisp White Tile */}
        <div className="rounded-2xl border border-white/25 bg-[#060813] p-4 text-center shadow-lg hover:border-white/50 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all">
          <span className="text-[10px] font-mono text-slate-300 uppercase block mb-1">Cryptographic Posture</span>
          <span className="text-base sm:text-lg font-bold font-mono text-white">Zero-Trust TLS</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">TLSv1.3 & HSTS Enforced</span>
        </div>

        {/* 4. Sapphire Blue Tile */}
        <div className="rounded-2xl border border-blue-500/25 bg-[#040818] p-4 text-center shadow-lg hover:border-blue-400/60 hover:shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all">
          <span className="text-[10px] font-mono text-blue-400/80 uppercase block mb-1">Threat Mitigation</span>
          <span className="text-base sm:text-lg font-bold font-mono text-sky-300">Actionable Diffs</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Nginx, BIND & Cloudflare</span>
        </div>
      </div>

      {/* Feature Grid with Cyber Glassmorphic Cards */}
      <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feat, idx) => {
          const Icon = feat.icon;

          return (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-2xl cyber-card p-6 gpu-accelerated contain-paint"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br border flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${feat.iconGlow}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border shadow-sm ${feat.badgeClass}`}>
                    {feat.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-mono">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans">
                    {feat.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className={`text-[11px] font-semibold ${feat.highlightColor}`}>
                  {feat.highlight}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
