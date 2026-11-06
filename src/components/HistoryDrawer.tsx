"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { History, X, Clock, ShieldAlert, ArrowRight, RefreshCw, Database } from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { formatUtcDate } from "@/lib/utils";

interface HistoryItem {
  id: string;
  targetDomain: string;
  letterGrade: string;
  riskScore: number;
  sanitizedAt: string;
  executionTimeMs: number;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScan?: (scanId: string) => void;
}

export function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { playClick, playPing } = useTacticalAudio();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history?limit=20");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.history)) {
          setHistory(data.history);
        }
      }
    } catch {
      // Ignore network errors on history
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  // Handle ESC key to dismiss drawer
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

  if (!mounted || !isOpen) return null;

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "A":
        return "badge-chroma-emerald";
      case "B":
        return "badge-chroma-cyan";
      case "C":
        return "badge-chroma-amber";
      case "D":
        return "badge-chroma-amber";
      default:
        return "badge-chroma-rose";
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop with dark dimming */}
      <div
        onClick={() => {
          playClick();
          onClose();
        }}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer slide-in container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10 pointer-events-auto">
        <div
          className="w-screen max-w-full sm:max-w-md border-l border-white/[0.12] p-5 sm:p-6 shadow-[-25px_0_60px_rgba(0,0,0,0.95)] flex flex-col justify-between relative z-10"
          style={{ backgroundColor: "#060813", opacity: 1 }}
        >
          {/* Top subtle tactical glow line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Audit Recon History
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Dual-mode persisted domain intelligence snapshots
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playPing();
                    fetchHistory();
                  }}
                  disabled={loading}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none"
                  title="Refresh history"
                  aria-label="Refresh history"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
                </button>
                <button
                  onClick={() => {
                    playClick();
                    onClose();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none"
                  title="Close history"
                  aria-label="Close history"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* List Content */}
            <div className="mt-5 space-y-3 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 scrollbar-thin">
              {history.length === 0 ? (
                <div
                  className="text-center py-12 px-6 rounded-2xl border border-white/[0.08] space-y-3"
                  style={{ backgroundColor: "#0b0f1d" }}
                >
                  <ShieldAlert className="h-9 w-9 text-slate-500 mx-auto" />
                  <p className="text-xs font-mono font-medium text-slate-300">No prior audit snapshots recorded.</p>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Run your first recon scan to track infrastructure posture, certificate chains, and threat vectors over time.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <Link
                    key={item.id}
                    href={`/report/${item.id}`}
                    onClick={() => {
                      playClick();
                      onClose();
                    }}
                    className="block group rounded-xl border border-white/[0.1] p-4 transition-all duration-150 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:translate-x-0.5"
                    style={{ backgroundColor: "#0b0f1d", opacity: 1 }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {item.targetDomain}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${getGradeBadge(
                          item.letterGrade
                        )}`}
                      >
                        Grade {item.letterGrade}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5 text-slate-400" suppressHydrationWarning>
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatUtcDate(item.sanitizedAt)} · {item.executionTimeMs}ms
                      </span>
                      <span className="text-cyan-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Footer note */}
          <div
            className="pt-4 border-t border-white/[0.08] text-[11px] font-mono text-slate-400 flex items-center justify-between"
            style={{ backgroundColor: "#060813" }}
          >
            <span className="flex items-center gap-1.5 text-slate-400">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              Unified Dual-Mode Persistence
            </span>
            <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
