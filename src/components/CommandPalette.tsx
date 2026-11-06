"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { formatUtcDate } from "@/lib/utils";
import {
  Search,
  Command,
  Activity,
  Shield,
  ExternalLink,
  History,
  Globe,
  Lock,
  ArrowRight,
  Terminal,
  FileCode,
  Layers,
  Cpu,
  X,
  CornerDownLeft,
  Compass,
  Crosshair,
  Flame,
  Bookmark,
  Users,
  Swords,
  Bug,
  Radio,
  Key,
  BookOpen,
  ListFilter,
  Zap,
  KeyRound,
} from "lucide-react";

interface HistoryItem {
  id: string;
  targetDomain: string;
  letterGrade: string;
  riskScore: number;
  sanitizedAt: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory?: () => void;
  onScanSample?: (domain: string) => void;
}

export function CommandPalette({ isOpen, onClose, onOpenHistory, onScanSample }: CommandPaletteProps) {
  const { playClick, playPing } = useTacticalAudio();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentAudits, setRecentAudits] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch recent scan history
  useEffect(() => {
    if (isOpen) {
      fetch("/api/history?limit=8")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.history)) {
            setRecentAudits(data.history);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      playPing();
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, playPing]);

  // Keyboard navigation & global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global toggle: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Build actionable commands
  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();

    const dispatchTab = (tab: string, sectionId?: string) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("shador:switch-tab", {
            detail: { tab, sectionId },
          })
        );
        window.dispatchEvent(
          new CustomEvent("shadowtrace:switch-tab", {
            detail: { tab, sectionId },
          })
        );
      }
    };

    const staticActions = [
      {
        id: "history-drawer",
        title: "Open Historical Audit Drawer",
        subtitle: "View and filter previous reconnaissance snapshots",
        category: "Tactical Actions",
        icon: History,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          onOpenHistory?.();
        },
      },
      {
        id: "nav-topology",
        title: "Navigate to Relational Topology Canvas",
        subtitle: "Interactive 120 FPS perimeter node attack graph",
        category: "Perimeter Navigation",
        icon: Activity,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          const el = document.getElementById("topology");
          if (el) el.scrollIntoView({ behavior: "smooth" });
          else router.push("/#topology");
        },
      },
      {
        id: "nav-posture",
        title: "Navigate to Security Posture Matrix",
        subtitle: "Email spoofability, TLS handshakes & OWASP headers",
        category: "Perimeter Navigation",
        icon: Shield,
        iconColor: "text-amber-400",
        action: () => {
          onClose();
          const el = document.getElementById("posture");
          if (el) el.scrollIntoView({ behavior: "smooth" });
          else router.push("/#posture");
        },
      },
      {
        id: "nav-dorks",
        title: "Launch ShadowDork OSINT Radar",
        subtitle: "Google dorks, GitHub secrets & Shodan origin queries",
        category: "Offensive Recon",
        icon: Compass,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          dispatchTab("dorks", "posture");
        },
      },
      {
        id: "nav-bounty",
        title: "Launch Bug Bounty Submission Studio",
        subtitle: "1-click HackerOne & Bugcrowd CVSS v3.1 report generator",
        category: "Tactical Actions",
        icon: Bug,
        iconColor: "text-emerald-400",
        action: () => {
          onClose();
          dispatchTab("bounty", "posture");
        },
      },
      {
        id: "nav-takeover",
        title: "Launch Cloud Takeover & Fingerprint Studio",
        subtitle: "1-click subdomain takeover PoC, cloud error fingerprinting & AWS/Azure remediation",
        category: "Offensive Recon",
        icon: Globe,
        iconColor: "text-rose-400",
        action: () => {
          onClose();
          dispatchTab("takeover", "subdomain-panel");
        },
      },
      {
        id: "nav-mitre",
        title: "Launch MITRE ATT&CK Replay Studio",
        subtitle: "Replay terminal curl, dig & nmap proof-of-concept commands",
        category: "Offensive Recon",
        icon: Crosshair,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          dispatchTab("mitre", "posture");
        },
      },
      {
        id: "nav-origin",
        title: "Launch WAF Origin IP & Historical DNS Radar",
        subtitle: "Cloudflare bypass candidates, SPF/DNS leaks & Time-Machine pivots",
        category: "Offensive Recon",
        icon: Flame,
        iconColor: "text-rose-400",
        action: () => {
          onClose();
          dispatchTab("origin", "origin-bypass-panel");
        },
      },
      {
        id: "nav-watchlist",
        title: "Open ShadowWatch Target Asset Inventory",
        subtitle: "Persistent domain monitoring, zero-day threat tags & asset drift",
        category: "Tactical Actions",
        icon: Bookmark,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          dispatchTab("watchlist", "shadowwatch-panel");
        },
      },
      {
        id: "nav-cli",
        title: "View SHADOR 1-Line Terminal CLI Hook",
        subtitle: "Direct ANSI-colored reconnaissance reports via single-line curl command",
        category: "Tactical Actions",
        icon: Terminal,
        iconColor: "text-purple-400",
        action: () => {
          onClose();
          dispatchTab("cli", "cli-panel");
        },
      },
      {
        id: "nav-breach",
        title: "Launch Dark Web & Breach Exposure Radar",
        subtitle: "Mega-dump correlations, enterprise email patterns & password spray posture",
        category: "Offensive Recon",
        icon: Users,
        iconColor: "text-amber-400",
        action: () => {
          onClose();
          dispatchTab("breach", "breach-panel");
        },
      },
      {
        id: "nav-compare",
        title: "Launch Dual-Domain Comparative Arena",
        subtitle: "Side-by-side threat confrontation comparing attack surfaces against competitors",
        category: "Offensive Recon",
        icon: Swords,
        iconColor: "text-amber-400",
        action: () => {
          onClose();
          dispatchTab("compare", "comparison-panel");
        },
      },
      {
        id: "nav-satellite",
        title: "Launch Global Multi-Resolver Satellite HUD",
        subtitle: "Concurrent DNS propagation & Anycast latency across 6 worldwide backbones",
        category: "Offensive Recon",
        icon: Radio,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          dispatchTab("satellite", "satellite-panel");
        },
      },
      {
        id: "nav-dnssec",
        title: "Launch DNSSEC & Cryptographic AXFR Zone Radar",
        subtitle: "RFC 4035 RRSIG verification & DNS zone dump vulnerability testing",
        category: "Offensive Recon",
        icon: Key,
        iconColor: "text-emerald-400",
        action: () => {
          onClose();
          dispatchTab("dnssec", "dnssec-panel");
        },
      },
      {
        id: "nav-heatmap",
        title: "Launch Unified Attack Surface Defense Heatmap",
        subtitle: "12-vector cross-telemetry exposure matrix & one-click tactical teleport",
        category: "Offensive Recon",
        icon: Layers,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          dispatchTab("heatmap", "heatmap-panel");
        },
      },
      {
        id: "nav-methodology",
        title: "Launch OWASP WSTG Pentest Methodology Studio",
        subtitle: "20 standardized reconnaissance & exploitation checkpoints synchronized with live findings",
        category: "Offensive Recon",
        icon: BookOpen,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          dispatchTab("methodology", "methodology-panel");
        },
      },
      {
        id: "nav-killchain",
        title: "Launch Cyber Kill Chain & Attack Path Simulator",
        subtitle: "Multi-vector exploitation sequencing & blue-team chain disruptors",
        category: "Offensive Recon",
        icon: Crosshair,
        iconColor: "text-rose-400",
        action: () => {
          onClose();
          dispatchTab("killchain", "attack-path-panel");
        },
      },
      {
        id: "nav-batch",
        title: "Launch Multi-Target Scope Queue & Batch Recon Hub",
        subtitle: "Bulk attack surface scope ingestion, parallel queue runner & CSV export",
        category: "Offensive Recon",
        icon: ListFilter,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          dispatchTab("batch", "batch-recon-panel");
        },
      },
      {
        id: "nav-hardening",
        title: "Launch Defensive Hardening Configuration & Policy Studio",
        subtitle: "Production-ready Nginx, BIND9, Cloudflare Terraform & Next.js remediation configs",
        category: "Offensive Recon",
        icon: Zap,
        iconColor: "text-purple-400",
        action: () => {
          onClose();
          dispatchTab("hardening", "hardening-panel");
        },
      },
      {
        id: "nav-techstack",
        title: "Launch Passive Tech Stack Fingerprint Studio",
        subtitle: "Passive web server, CMS, CDN, and backend framework fingerprinting",
        category: "Offensive Recon",
        icon: Cpu,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          dispatchTab("techstack", "techstack-panel");
        },
      },
      {
        id: "nav-reputation",
        title: "Launch Threat Reputation & IP Toxicity Radar",
        subtitle: "6 global blacklist feeds, Tor exit nodes & Bogon IP verification",
        category: "Offensive Recon",
        icon: Radio,
        iconColor: "text-rose-400",
        action: () => {
          onClose();
          dispatchTab("reputation", "reputation-panel");
        },
      },
      {
        id: "nav-secretdorks",
        title: "Launch Public Secret Exposure & Code Dork Radar",
        subtitle: "16 weaponized passive dorks for leaked .env, AWS keys, tokens & credentials",
        category: "Offensive Recon",
        icon: KeyRound,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          dispatchTab("secretdorks", "secretdorks-panel");
        },
      },
      {
        id: "nav-remediation",
        title: "Navigate to Threat Remediation Diffs",
        subtitle: "Copy-paste Nginx, BIND DNS & security header configs",
        category: "Perimeter Navigation",
        icon: ExternalLink,
        iconColor: "text-emerald-400",
        action: () => {
          onClose();
          const el = document.getElementById("remediation");
          if (el) el.scrollIntoView({ behavior: "smooth" });
          else router.push("/#remediation");
        },
      },
      {
        id: "nav-features",
        title: "Platform Capabilities & Specifications",
        subtitle: "RFC standards, anti-SSRF guards & perimeter defense",
        category: "Perimeter Navigation",
        icon: Layers,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          const el = document.getElementById("features");
          if (el) el.scrollIntoView({ behavior: "smooth" });
          else router.push("/#features");
        },
      },
    ];

    // Quick target presets
    const quickTargets = [
      { domain: "cloudflare.com", name: "Cloudflare" },
      { domain: "github.com", name: "GitHub" },
      { domain: "google.com", name: "Google" },
      { domain: "stripe.com", name: "Stripe" },
    ].map((target) => ({
      id: `quick-${target.domain}`,
      title: `Audit Target: ${target.name} (${target.domain})`,
      subtitle: "Execute live passive external reconnaissance scan",
      category: "Quick Audit Targets",
      icon: Globe,
      iconColor: "text-purple-400",
      action: () => {
        onClose();
        if (typeof window !== "undefined" && window.location.pathname === "/" && onScanSample) {
          onScanSample(target.domain);
        } else {
          router.push(`/?scan=${target.domain}`);
        }
      },
    }));

    // Historical targets
    const historyItems = recentAudits.map((item) => ({
      id: `history-${item.id}`,
      title: `${item.targetDomain} — Grade [${item.letterGrade}]`,
      subtitle: `Risk Index: ${item.riskScore}/100 • ${formatUtcDate(item.sanitizedAt)}`,
      category: "Recent Audit Snapshots",
      icon: Terminal,
      iconColor: item.letterGrade === "A" ? "text-emerald-400" : item.letterGrade === "B" ? "text-cyan-400" : "text-amber-400",
      action: () => {
        onClose();
        router.push(`/report/${item.id}`);
      },
    }));

    const all = [...historyItems, ...quickTargets, ...staticActions];

    if (!q) return all;

    // Filter by query
    const matches = all.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );

    // If query looks like a custom domain, add "Audit <query>" as top item
    if (q.includes(".") && !q.includes(" ")) {
      matches.unshift({
        id: `custom-scan-${q}`,
        title: `Execute Reconnaissance on "${q}"`,
        subtitle: "Dispatch passive OSINT, DNS & TLS auditors",
        category: "Direct Ingestion",
        icon: Search,
        iconColor: "text-cyan-400",
        action: () => {
          onClose();
          if (typeof window !== "undefined" && window.location.pathname === "/" && onScanSample) {
            onScanSample(q);
          } else {
            router.push(`/?scan=${q}`);
          }
        },
      });
    }

    return matches;
  }, [query, recentAudits, onClose, onOpenHistory, onScanSample, router]);

  // Handle keyboard list navigation
  const handleKeyDownInList = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      playClick();
      setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      playClick();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      playClick();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].action();
      }
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200"
      />

      {/* Palette HUD Modal */}
      <div
        onKeyDown={handleKeyDownInList}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.12] bg-[#070a14]/95 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(217,70,239,0.15)] animate-in fade-in-50 zoom-in-95 duration-200"
      >
        {/* Corner Reticle Ticks */}
        <span className="absolute top-2 left-2 text-[9px] font-mono text-cyan-400 select-none pointer-events-none">┌</span>
        <span className="absolute top-2 right-2 text-[9px] font-mono text-cyan-400 select-none pointer-events-none">┐</span>
        <span className="absolute bottom-2 left-2 text-[9px] font-mono text-cyan-400 select-none pointer-events-none">└</span>
        <span className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-400 select-none pointer-events-none">┘</span>

        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] relative">
          <Search className="h-5 w-5 text-cyan-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search targets, navigate perimeter, or type domain to audit..."
            className="w-full bg-transparent text-sm font-mono text-white placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 rounded-md bg-white/[0.06] border border-white/[0.1] px-2 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400">
              No matching actions or targets found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredActions.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-blue-500/10 border border-cyan-400/50 text-white shadow-md shadow-cyan-500/10"
                      : "text-slate-300 hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "border-cyan-400/60 bg-cyan-500/20"
                          : "border-white/[0.08] bg-[#0c1020]"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-semibold truncate flex items-center gap-2">
                        <span>{item.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer HUD Telemetry */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-[#05070e] text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] border border-white/[0.1]">↑↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] border border-white/[0.1]">↵</kbd>
              <span>execute</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] border border-white/[0.1]">esc</kbd>
              <span>close</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-cyan-400">
            <Command className="h-3 w-3" />
            <span>Tactical Command HUD</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
