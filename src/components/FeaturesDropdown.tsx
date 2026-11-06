"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  Mail,
  Globe,
  Lock,
  Shield,
  Network,
  Crosshair,
  GitCompare,
  Terminal,
  Sparkles,
  ArrowRight,
  Flame,
  Bookmark,
  Zap,
  Users,
  Swords,
  Search,
  Bug,
  X,
  Cpu,
  Radio,
  KeyRound,
  Monitor,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";

export interface FeatureNavEntry {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  tab?:
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
    | "bounty"
    | "satellite"
    | "dnssec"
    | "heatmap"
    | "methodology"
    | "killchain"
    | "batch"
    | "hardening"
    | "techstack"
    | "reputation"
    | "secretdorks"
    | "warroom";
  sectionId: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

export const PLATFORM_FEATURES: FeatureNavEntry[] = [
  {
    id: "warroom",
    name: "CISO War Room & Command Deck",
    badge: "FULLSCREEN HUD",
    badgeColor: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    description: "Multi-panel cyber warfare situation room with live telemetry stream & hotkey 'W'",
    tab: "warroom",
    sectionId: "posture",
    icon: Monitor,
    iconBg: "bg-rose-500/15 border-rose-500/35",
    iconColor: "text-rose-400",
  },
  {
    id: "topology",
    name: "Relational Attack Topology",
    badge: "3D GRAPH",
    badgeColor: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    description: "Multi-vector perimeter node mapping & adversary kill-chain",
    sectionId: "topology",
    icon: Activity,
    iconBg: "bg-cyan-500/15 border-cyan-500/35",
    iconColor: "text-cyan-400",
  },
  {
    id: "email",
    name: "Email Infrastructure & DMARC",
    badge: "SPF / DMARC",
    badgeColor: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    description: "PermError detection, direct phishing index & BIMI alignment",
    tab: "email",
    sectionId: "posture",
    icon: Mail,
    iconBg: "bg-amber-500/15 border-amber-500/35",
    iconColor: "text-amber-400",
  },
  {
    id: "subdomains",
    name: "Subdomain & Takeover Radar",
    badge: "DANGLING CNAME",
    badgeColor: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    description: "Certificate Transparency logs & orphaned cloud aliases",
    tab: "subdomains",
    sectionId: "posture",
    icon: Globe,
    iconBg: "bg-cyan-500/15 border-cyan-500/35",
    iconColor: "text-cyan-400",
  },
  {
    id: "tls",
    name: "TLS Cryptography & X.509",
    badge: "X.509 ROOT",
    badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    description: "Port 443 handshake, cipher suite & RFC 5280 chain drawer",
    tab: "tls",
    sectionId: "posture",
    icon: Lock,
    iconBg: "bg-emerald-500/15 border-emerald-500/35",
    iconColor: "text-emerald-400",
  },
  {
    id: "headers",
    name: "Edge Headers & OWASP Rules",
    badge: "RFC 9116 / HSTS",
    badgeColor: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    description: "HSTS preload, CSP restrictions & security.txt compliance",
    tab: "headers",
    sectionId: "posture",
    icon: Shield,
    iconBg: "bg-cyan-500/15 border-cyan-500/35",
    iconColor: "text-cyan-400",
  },
  {
    id: "network",
    name: "Autonomous BGP & Network HUD",
    badge: "BGP / ANYCAST",
    badgeColor: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    description: "Routing fabric, Anycast DDoS distribution & origin ASN",
    tab: "network",
    sectionId: "posture",
    icon: Network,
    iconBg: "bg-sky-500/15 border-sky-500/35",
    iconColor: "text-sky-400",
  },
  {
    id: "origin",
    name: "Cloudflare Origin IP & History",
    badge: "WAF BYPASS",
    badgeColor: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    description: "Unproxied backend origin leaks & historical DNS time-machine",
    tab: "origin",
    sectionId: "posture",
    icon: Flame,
    iconBg: "bg-orange-500/15 border-orange-500/35",
    iconColor: "text-orange-400",
  },
  {
    id: "mitre",
    name: "MITRE ATT&CK Matrix & Replay",
    badge: "PENTEST REPLAY",
    badgeColor: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    description: "Enterprise tactics with copyable curl, dig, and nmap commands",
    tab: "mitre",
    sectionId: "posture",
    icon: Crosshair,
    iconBg: "bg-rose-500/15 border-rose-500/35",
    iconColor: "text-rose-400",
  },
  {
    id: "dorks",
    name: "OSINT Recon Dork Radar",
    badge: "GOOGLE / SHODAN",
    badgeColor: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    description: "16 automated queries for Git leaks, S3 buckets & secrets",
    tab: "dorks",
    sectionId: "posture",
    icon: Search,
    iconBg: "bg-cyan-500/15 border-cyan-500/35",
    iconColor: "text-cyan-400",
  },
  {
    id: "bounty",
    name: "Bug Bounty Submission Studio",
    badge: "CVSS / HACKERONE",
    badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    description: "CVSS v3.1 calculator, CWE mapping & 1-click Markdown export",
    tab: "bounty",
    sectionId: "posture",
    icon: Bug,
    iconBg: "bg-emerald-500/15 border-emerald-500/35",
    iconColor: "text-emerald-400",
  },
  {
    id: "watchlist",
    name: "ShadowWatch Asset Inventory",
    badge: "TARGET RADAR",
    badgeColor: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    description: "Persistent asset monitoring, hacker notes & 1-click re-audit",
    tab: "watchlist",
    sectionId: "posture",
    icon: Bookmark,
    iconBg: "bg-cyan-500/15 border-cyan-500/35",
    iconColor: "text-cyan-400",
  },
  {
    id: "drift",
    name: "Infrastructure Drift & Delta",
    badge: "DELTA TRACKER",
    badgeColor: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    description: "Chronological snapshot diffs tracking new & mutated perimeter assets",
    tab: "drift",
    sectionId: "posture",
    icon: GitCompare,
    iconBg: "bg-amber-500/15 border-amber-500/35",
    iconColor: "text-amber-400",
  },
  {
    id: "cli",
    name: "SHADOR 1-Line Terminal",
    badge: "CURL / CLI",
    badgeColor: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    description: "Direct ANSI-colored reconnaissance reports via curl terminal",
    tab: "cli",
    sectionId: "posture",
    icon: Terminal,
    iconBg: "bg-purple-500/15 border-purple-500/35",
    iconColor: "text-purple-400",
  },
  {
    id: "breach",
    name: "Dark Web & Breach Exposure",
    badge: "IDENTITY RISK",
    badgeColor: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    description: "Mega-dump correlations & corporate password spray posture",
    tab: "breach",
    sectionId: "posture",
    icon: Users,
    iconBg: "bg-rose-500/15 border-rose-500/35",
    iconColor: "text-rose-400",
  },
  {
    id: "compare",
    name: "Dual-Domain Benchmark Arena",
    badge: "VS RADAR",
    badgeColor: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    description: "Head-to-head confrontation comparing attack surfaces",
    tab: "compare",
    sectionId: "posture",
    icon: Swords,
    iconBg: "bg-amber-500/15 border-amber-500/35",
    iconColor: "text-amber-400",
  },
  {
    id: "remediation",
    name: "Hardening Policies & IaC",
    badge: "1-CLICK SCRIPTS",
    badgeColor: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    description: "Nginx .conf blocks, BIND zone files & master automated scripts",
    tab: "hardening",
    sectionId: "hardening-panel",
    icon: Zap,
    iconBg: "bg-purple-500/15 border-purple-500/35",
    iconColor: "text-purple-400",
  },
  {
    id: "techstack",
    name: "Passive Tech Stack Fingerprinter",
    badge: "ZERO INTRUSION",
    badgeColor: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    description: "Web server, CMS, CDN, and framework detection from passive headers",
    tab: "techstack",
    sectionId: "techstack-panel",
    icon: Cpu,
    iconBg: "bg-cyan-500/15 border-cyan-500/35",
    iconColor: "text-cyan-400",
  },
  {
    id: "reputation",
    name: "Threat Reputation & IP Toxicity Radar",
    badge: "IP RADAR",
    badgeColor: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    description: "6 global blacklist feeds, Tor exit nodes & Bogon IP space verification",
    tab: "reputation",
    sectionId: "reputation-panel",
    icon: Radio,
    iconBg: "bg-rose-500/15 border-rose-500/35",
    iconColor: "text-rose-400",
  },
  {
    id: "secretdorks",
    name: "Public Secret & Code Dork Radar",
    badge: "16 VECTORS",
    badgeColor: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    description: "Passive search dorks for leaked .env, AWS keys, tokens & credentials",
    tab: "secretdorks",
    sectionId: "secretdorks-panel",
    icon: KeyRound,
    iconBg: "bg-cyan-500/15 border-cyan-500/35",
    iconColor: "text-cyan-400",
  },
];

interface FeaturesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  hasActiveScan?: boolean;
}

export function FeaturesDropdown({
  isOpen,
  onClose,
  hasActiveScan = false,
}: FeaturesDropdownProps) {
  const { playClick } = useTacticalAudio();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const handleSelectFeature = (feature: FeatureNavEntry) => {
    playClick();
    onClose();

    if (hasActiveScan) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("shador:switch-tab", {
            detail: { tab: feature.tab, sectionId: feature.sectionId },
          })
        );
        window.dispatchEvent(
          new CustomEvent("shadowtrace:switch-tab", {
            detail: { tab: feature.tab, sectionId: feature.sectionId },
          })
        );
      }
      const el = document.getElementById(feature.sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      const target = document.getElementById("features") || document.getElementById("architecture");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto overscroll-contain animate-in fade-in duration-150"
      style={{ isolation: "isolate" }}
    >
      {/* Semi-transparent dark tactical backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Perfectly Centered 100% Opaque Panel with Rigid Width Limits */}
      <div
        ref={dropdownRef}
        className="relative w-full max-w-5xl max-h-[min(94vh,740px)] flex flex-col rounded-2xl border border-white/[0.14] p-3 sm:p-4 md:p-5 shadow-[-10px_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(6,182,212,0.18)] select-none z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden my-auto"
        style={{ backgroundColor: "#060813", opacity: 1 }}
        role="dialog"
        aria-modal="true"
        aria-label="Platform capabilities and features directory"
      >
        {/* Top subtle tactical glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none rounded-t-2xl" />

        {/* Top Banner */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.08] px-0.5 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-200 truncate">
              Platform Capabilities & Subsystem Matrix
            </span>
            <span className="text-[9.5px] font-mono text-cyan-400/90 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 shrink-0 hidden sm:inline">
              {PLATFORM_FEATURES.length} Tactical Modules
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9.5px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 hidden md:inline">
              Click to Jump Directly
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-slate-400 hover:text-white hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-colors shrink-0"
              title="Close menu (Esc)"
              aria-label="Close features matrix"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 
          Features Grid - Multi-Device Elastic Matrix
          - Mobile (<640px): 1 column (single thumb target)
          - Small Tablet / Split screen (640-1023px): 2 columns
          - Laptops / 125% zoom (1024-1279px): 3 columns
          - Desktop / 4K (1280px+): 4 columns
          - Zero horizontal bleed: min-w-0, w-full, overflow-hidden on all cards
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 select-none overflow-y-auto max-h-[calc(min(94vh,740px)-7.5rem)] pr-1 custom-scrollbar">
          {PLATFORM_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => handleSelectFeature(item)}
                className="group flex flex-col justify-between p-2.5 rounded-xl border border-white/[0.08] hover:border-cyan-400/50 hover:shadow-[0_0_16px_rgba(6,182,212,0.2)] active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-[68px] min-w-0 w-full overflow-hidden"
                style={{ backgroundColor: "#0b0f1d", opacity: 1 }}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div
                      className={`h-5 w-5 rounded flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110 ${item.iconBg}`}
                    >
                      <Icon className={`h-2.5 w-2.5 ${item.iconColor}`} />
                    </div>
                    <span
                      className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider truncate max-w-[120px] shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <h4 className="text-[11px] font-mono font-bold text-white group-hover:text-cyan-300 transition-colors truncate leading-tight pt-0.5 min-w-0">
                    {item.name}
                  </h4>

                  <p className="text-[9.5px] text-slate-300 leading-tight line-clamp-1 font-sans font-normal truncate min-w-0">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/[0.06] text-[8.5px] font-mono text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0">
                  <span>Direct Teleport</span>
                  <ArrowRight className="h-2.5 w-2.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Guidance */}
        <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between px-0.5 text-[9.5px] font-mono text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5 truncate">
            <Sparkles className="h-3 w-3 text-cyan-400 shrink-0" />
            <span className="truncate">Auto-switches audit view & centers screen</span>
          </span>
          <span className="text-slate-500 shrink-0 hidden sm:inline">Press Esc to dismiss</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
