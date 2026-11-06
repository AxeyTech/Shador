"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ListFilter,
  Layers,
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Terminal,
  Trash2,
  FileSpreadsheet,
  Globe,
  Mail,
  Lock,
  Plus,
  Crosshair,
  TrendingUp,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import type { CompleteScanResult } from "@/lib/types/scanner";

interface BatchReconHubProps {
  initialDomain?: string;
  onSelectTarget?: (domain: string) => void;
}

export interface BatchTargetEntry {
  id: string;
  domain: string;
  status: "QUEUED" | "SCANNING" | "COMPLETED" | "FAILED";
  letterGrade?: string;
  riskScore?: number;
  subdomainsCount?: number;
  danglingTakeovers?: number;
  emailSpoofable?: boolean;
  missingHeadersCount?: number;
  originLeaksCount?: number;
  completedAt?: string;
  error?: string;
}

const STORAGE_KEY = "shador:batch-recon-queue";
const LEGACY_STORAGE_KEY = "shadowtrace:batch-recon-queue";

const PRESET_SCOPES: { name: string; domains: string[] } = {
  name: "Sample Enterprise Scope",
  domains: ["uber.com", "ubereats.com", "careem.com", "postmates.com"],
};

export function BatchReconHub({
  initialDomain,
  onSelectTarget,
}: BatchReconHubProps) {
  const router = useRouter();
  const { playClick, playDownload, playAlert } = useTacticalAudio();
  const [inputText, setInputText] = useState("");
  const [queue, setQueue] = useState<BatchTargetEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [sortBy, setSortBy] = useState<"risk" | "domain" | "takeovers">("risk");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load saved batch queue on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed: BatchTargetEntry[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQueue(parsed);
          return;
        }
      }
    } catch {
      // LocalStorage unavailable
    }

    // Default queue populated with initial domain or preset
    if (initialDomain) {
      setQueue([
        {
          id: "target-initial",
          domain: initialDomain,
          status: "QUEUED",
        },
      ]);
    }
  }, [initialDomain]);

  // Save queue to localStorage
  const saveQueue = (updated: BatchTargetEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage quota exceeded
    }
  };

  // Ingest pasted domains
  const handleIngestDomains = () => {
    playClick();
    if (!inputText.trim()) return;

    const rawLines = inputText.split(/[\n,;]+/);
    const sanitizedDomains: string[] = [];

    for (const line of rawLines) {
      let cleaned = line.trim().toLowerCase();
      // Remove protocol, wildcards, ports, slashes
      cleaned = cleaned.replace(/^(?:https?:\/\/)?(?:\*\.)?/, "");
      cleaned = cleaned.replace(/[:/].*$/, "");
      // Validate domain pattern
      if (
        cleaned.includes(".") &&
        !cleaned.includes(" ") &&
        cleaned.length >= 3 &&
        !sanitizedDomains.includes(cleaned)
      ) {
        sanitizedDomains.push(cleaned);
      }
    }

    if (sanitizedDomains.length === 0) return;

    const existingDomains = new Set(queue.map((q) => q.domain));
    const newEntries: BatchTargetEntry[] = sanitizedDomains
      .filter((d) => !existingDomains.has(d))
      .map((domain, idx) => ({
        id: `batch-${Date.now()}-${idx}`,
        domain,
        status: "QUEUED",
      }));

    const updated = [...queue, ...newEntries];
    setQueue(updated);
    saveQueue(updated);
    setInputText("");
  };

  // Load preset demo scope
  const handleLoadPreset = () => {
    playClick();
    const existingDomains = new Set(queue.map((q) => q.domain));
    const newEntries: BatchTargetEntry[] = PRESET_SCOPES.domains
      .filter((d) => !existingDomains.has(d))
      .map((domain, idx) => ({
        id: `preset-${Date.now()}-${idx}`,
        domain,
        status: "QUEUED",
      }));

    const updated = [...queue, ...newEntries];
    setQueue(updated);
    saveQueue(updated);
  };

  // Clear batch queue
  const handleClearQueue = () => {
    playAlert();
    if (window.confirm("Clear all targets from the batch reconnaissance scope queue?")) {
      setQueue([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignored
      }
    }
  };

  // Remove single target
  const handleRemoveTarget = (id: string) => {
    playClick();
    const updated = queue.filter((t) => t.id !== id);
    setQueue(updated);
    saveQueue(updated);
  };

  // Execute batch scanning sequentially
  const handleExecuteBatchScan = async () => {
    playClick();
    if (isProcessing) return;
    setIsProcessing(true);

    const updatedQueue = [...queue];

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      if (item.status === "COMPLETED") continue;

      // Mark scanning
      item.status = "SCANNING";
      setQueue([...updatedQueue]);

      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: item.domain }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: CompleteScanResult = await res.json();

        // Extract key telemetry metrics
        item.status = "COMPLETED";
        item.letterGrade = data.score?.letterGrade || "B";
        item.riskScore = data.score?.score ?? 50;
        item.subdomainsCount = data.subdomains?.discoveredCount ?? 0;
        item.danglingTakeovers = data.subdomains?.danglingTakeoversFound ?? 0;
        item.emailSpoofable = data.emailSpoof?.canSpoofDirectly ?? false;
        item.missingHeadersCount = data.headers?.missingCount ?? 0;
        item.originLeaksCount = data.originBypass?.candidates?.length ?? 0;
        item.completedAt = new Date().toISOString();
      } catch (err: any) {
        item.status = "FAILED";
        item.error = err.message || "Failed to reach endpoint";
      }

      setQueue([...updatedQueue]);
      saveQueue(updatedQueue);
    }

    setIsProcessing(false);
  };

  // Sort queue
  const sortedQueue = useMemo(() => {
    const list = [...queue];
    return list.sort((a, b) => {
      if (sortBy === "risk") {
        const scoreA = a.riskScore ?? -1;
        const scoreB = b.riskScore ?? -1;
        return sortOrder === "desc" ? scoreB - scoreA : scoreA - scoreB;
      }
      if (sortBy === "takeovers") {
        const tA = a.danglingTakeovers ?? 0;
        const tB = b.danglingTakeovers ?? 0;
        return sortOrder === "desc" ? tB - tA : tA - tB;
      }
      return sortOrder === "desc"
        ? b.domain.localeCompare(a.domain)
        : a.domain.localeCompare(b.domain);
    });
  }, [queue, sortBy, sortOrder]);

  // Statistics
  const totalTargets = queue.length;
  const completedTargets = queue.filter((q) => q.status === "COMPLETED").length;
  const totalTakeovers = queue.reduce((acc, q) => acc + (q.danglingTakeovers || 0), 0);
  const totalSpoofable = queue.filter((q) => q.emailSpoofable).length;
  const percentComplete = totalTargets > 0 ? Math.round((completedTargets / totalTargets) * 100) : 0;

  // Export CSV
  const handleExportCsv = () => {
    playDownload();
    const headers = [
      "Target Domain",
      "Status",
      "Grade",
      "Risk Score",
      "Subdomains",
      "Dangling Takeovers",
      "Email Spoofable",
      "Missing Headers",
      "Origin Leaks",
      "Audited At",
    ];

    const rows = sortedQueue.map((t) => [
      t.domain,
      t.status,
      t.letterGrade || "N/A",
      t.riskScore !== undefined ? t.riskScore.toString() : "N/A",
      (t.subdomainsCount ?? 0).toString(),
      (t.danglingTakeovers ?? 0).toString(),
      t.emailSpoofable ? "YES" : "NO",
      (t.missingHeadersCount ?? 0).toString(),
      (t.originLeaksCount ?? 0).toString(),
      t.completedAt || "Pending",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shador_batch_scope_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  const handleLaunchTarget = (domain: string) => {
    playClick();
    if (onSelectTarget) {
      onSelectTarget(domain);
    } else {
      router.push(`/?domain=${encodeURIComponent(domain)}`);
    }
  };

  return (
    <div
      id="batch-recon-panel"
      className="rounded-2xl border border-white/[0.1] shadow-2xl p-4 sm:p-6 md:p-7 space-y-6 select-none"
      style={{ backgroundColor: "#060914" }}
    >
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-cyan-500/35 bg-cyan-500/15 flex items-center justify-center shrink-0">
            <ListFilter className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                Multi-Target Scope Queue & Batch Recon Hub
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hidden sm:inline">
                Bulk Attack Surface
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Automated multi-domain scope intake, sequential reconnaissance execution, and comparative threat ranking
            </p>
          </div>
        </div>

        {/* Global Batch Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            disabled={queue.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-400/50 text-slate-300 hover:text-white text-xs font-mono transition-all active:scale-95 shadow-sm disabled:opacity-40"
            title="Export scope audit as CSV spreadsheet"
          >
            {copiedCsv ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">CSV Exported</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </>
            )}
          </button>

          <button
            onClick={handleExecuteBatchScan}
            disabled={isProcessing || queue.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-cyan-500/50 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-mono font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.25)] disabled:opacity-40"
          >
            <Play className={`h-3.5 w-3.5 text-cyan-400 ${isProcessing ? "animate-spin" : ""}`} />
            <span>{isProcessing ? "Auditing Queue..." : "Run Batch Recon"}</span>
          </button>

          <button
            onClick={handleClearQueue}
            disabled={queue.length === 0}
            className="p-1.5 rounded-xl border border-white/[0.08] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
            title="Clear all targets"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scope Ingestion Box */}
      <div className="p-4 rounded-xl border border-white/[0.08] bg-[#080d1e] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <Plus className="h-3.5 w-3.5 text-cyan-400" />
            <span>Paste Target Scope (One per line or comma-separated)</span>
          </span>
          <button
            onClick={handleLoadPreset}
            className="text-[10.5px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" />
            <span>Load Demo Scope</span>
          </button>
        </div>

        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="example.com&#10;api.example.com&#10;subdomain.target.org&#10;corp-portal.net"
          className="w-full bg-[#04060d] border border-white/[0.08] focus:border-cyan-400/50 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 outline-none transition-all resize-y"
        />

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Strips wildcards (*.), protocols (https://), and trailing paths automatically</span>
          <button
            onClick={handleIngestDomains}
            disabled={!inputText.trim()}
            className="px-4 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold transition-all disabled:opacity-40"
          >
            Add to Queue
          </button>
        </div>
      </div>

      {/* Statistics & Batch Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0a0f20] p-4 rounded-xl border border-white/[0.06]">
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Queue Ingestion</span>
          <div className="text-lg font-bold font-mono text-white mt-0.5 flex items-baseline gap-1.5">
            <span>{completedTargets}/{totalTargets}</span>
            <span className="text-xs text-cyan-400 font-normal">({percentComplete}%)</span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.08] rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Dangling Takeovers</span>
          <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
            {totalTakeovers} Detected
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Critical bounty targets</span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Phishing Spoofable</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
            {totalSpoofable} Domains
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Permissive DMARC/SPF</span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Recon Workflow</span>
          <div className="text-lg font-bold font-mono text-purple-300 mt-0.5">
            Autonomous
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Parallel API runner</span>
        </div>
      </div>

      {/* Queue Table Controls (Sorting & Filter) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
          <span>Sort Targets By:</span>
          <button
            onClick={() => {
              playClick();
              if (sortBy === "risk") setSortOrder(sortOrder === "desc" ? "asc" : "desc");
              else {
                setSortBy("risk");
                setSortOrder("desc");
              }
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
              sortBy === "risk"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "border-white/[0.06] text-slate-400 hover:text-white"
            }`}
          >
            Risk Score {sortBy === "risk" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => {
              playClick();
              if (sortBy === "takeovers") setSortOrder(sortOrder === "desc" ? "asc" : "desc");
              else {
                setSortBy("takeovers");
                setSortOrder("desc");
              }
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
              sortBy === "takeovers"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "border-white/[0.06] text-slate-400 hover:text-white"
            }`}
          >
            Takeovers {sortBy === "takeovers" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => {
              playClick();
              if (sortBy === "domain") setSortOrder(sortOrder === "desc" ? "asc" : "desc");
              else {
                setSortBy("domain");
                setSortOrder("asc");
              }
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
              sortBy === "domain"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "border-white/[0.06] text-slate-400 hover:text-white"
            }`}
          >
            Domain {sortBy === "domain" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          Showing {sortedQueue.length} targets in scope
        </span>
      </div>

      {/* Target Queue Table / Cards */}
      <div className="space-y-2.5">
        {sortedQueue.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-white/[0.06] bg-[#070b18] space-y-2">
            <Globe className="h-8 w-8 text-slate-500 mx-auto" />
            <div className="text-xs font-mono text-slate-300 font-bold">Scope Queue is Empty</div>
            <p className="text-[11px] text-slate-500 font-sans max-w-sm mx-auto">
              Paste a list of targets above or click &quot;Load Demo Scope&quot; to begin batch external attack surface reconnaissance.
            </p>
          </div>
        ) : (
          sortedQueue.map((item) => {
            const isCompleted = item.status === "COMPLETED";
            const isScanning = item.status === "SCANNING";
            const isFailed = item.status === "FAILED";

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isScanning
                    ? "border-cyan-400/50 bg-[#0a1228] shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : isCompleted && (item.danglingTakeovers ?? 0) > 0
                    ? "border-rose-500/40 bg-[#0d091a]"
                    : "border-white/[0.06] bg-[#080c1b] hover:border-white/[0.12]"
                }`}
              >
                {/* Domain & Telemetry Indicators */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  {/* Status Indicator Beacon */}
                  <div className="mt-1 sm:mt-0">
                    {isScanning ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping block" />
                    ) : isCompleted ? (
                      <span
                        className={`h-2.5 w-2.5 rounded-full block ${
                          (item.danglingTakeovers ?? 0) > 0
                            ? "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                            : item.emailSpoofable
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                      />
                    ) : isFailed ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 block" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-500 block" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-mono font-bold text-white truncate">
                        {item.domain}
                      </h4>

                      {isCompleted && item.letterGrade && (
                        <span
                          className={`text-[9.5px] font-mono font-black px-1.5 py-0.2 rounded border ${
                            item.letterGrade.startsWith("A")
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : item.letterGrade.startsWith("B")
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                              : item.letterGrade.startsWith("C")
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          Grade {item.letterGrade} ({item.riskScore}/100)
                        </span>
                      )}
                    </div>

                    {/* Sub-metrics */}
                    {isCompleted ? (
                      <div className="flex items-center gap-2.5 mt-1 text-[10px] font-mono text-slate-400 flex-wrap">
                        <span>{item.subdomainsCount} Subdomains</span>
                        <span>•</span>
                        <span
                          className={
                            (item.danglingTakeovers ?? 0) > 0
                              ? "text-rose-400 font-bold"
                              : "text-slate-400"
                          }
                        >
                          {item.danglingTakeovers} Takeovers
                        </span>
                        <span>•</span>
                        <span className={item.emailSpoofable ? "text-amber-400" : "text-emerald-400"}>
                          {item.emailSpoofable ? "Spoofable Mail" : "DMARC Protected"}
                        </span>
                        <span>•</span>
                        <span>{item.originLeaksCount} Origin Leaks</span>
                      </div>
                    ) : isScanning ? (
                      <span className="text-[10px] font-mono text-cyan-300 animate-pulse mt-0.5 block">
                        Executing multi-vector DNS, TLS, CT and OWASP discovery...
                      </span>
                    ) : isFailed ? (
                      <span className="text-[10px] font-mono text-rose-400 mt-0.5 block">
                        Error: {item.error || "Unreachable endpoint"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                        Queued for reconnaissance execution
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions & Launch Button */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isCompleted ? (
                    <button
                      onClick={() => handleLaunchTarget(item.domain)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold transition-all"
                    >
                      <span>Inspect Audit</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLaunchTarget(item.domain)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-white/[0.08] hover:border-cyan-400/50 bg-white/[0.02] text-slate-300 hover:text-white text-xs font-mono transition-all"
                    >
                      <span>Scan Direct</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}

                  <button
                    onClick={() => handleRemoveTarget(item.id)}
                    className="p-1 rounded-lg border border-white/[0.06] hover:border-rose-500/30 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tactical Guidance Footer */}
      <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#070b18] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <span className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>Queue state automatically persists in your browser; exportable to Burp Suite / Caido</span>
        </span>
        <span className="text-slate-500 text-[10.5px]">RFC & IEEE Std 830-1998 Compliant</span>
      </div>
    </div>
  );
}
