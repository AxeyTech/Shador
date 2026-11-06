"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  Clock,
  RotateCcw,
  Search,
  Tag,
  AlertTriangle,
  FileDown,
  FileUp,
  Flame,
  Check,
  Radio,
  Globe,
} from "lucide-react";
import type { WatchlistTarget, LetterGrade } from "@/lib/types/scanner";
import { getWatchlist, saveWatchlist, removeTargetFromWatchlist, addTargetToWatchlist } from "@/lib/watchlist/watchlist-storage";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { formatUtcDate } from "@/lib/utils";

interface ShadowWatchTrackerProps {
  currentDomain?: string;
  onSelectTarget?: (domain: string) => void;
}

export function ShadowWatchTracker({ currentDomain, onSelectTarget }: ShadowWatchTrackerProps) {
  const router = useRouter();
  const { playClick, playPing, playScanDispatch, playDownload } = useTacticalAudio();
  const [targets, setTargets] = useState<WatchlistTarget[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newDomainInput, setNewDomainInput] = useState("");
  const [newTagInput, setNewTagInput] = useState("BugBounty");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [copiedExport, setCopiedExport] = useState(false);

  useEffect(() => {
    setTargets(getWatchlist());
  }, []);

  const handleAddDomain = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newDomainInput.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    if (!clean || !clean.includes(".")) return;

    playPing();
    const updated = addTargetToWatchlist({
      domain: clean,
      autoAlert: true,
      tags: [newTagInput.trim() || "Perimeter"],
      notes: "Tracked for continuous asset drift & attack surface telemetry.",
    });
    setTargets(updated);
    setNewDomainInput("");
  };

  const handleRemove = (domain: string) => {
    playClick();
    const updated = removeTargetFromWatchlist(domain);
    setTargets(updated);
  };

  const handleLaunchScan = (domain: string) => {
    playScanDispatch();
    if (onSelectTarget) {
      onSelectTarget(domain);
    } else {
      router.push(`/?domain=${encodeURIComponent(domain)}`);
    }
  };

  const handleSaveNotes = (id: string) => {
    playClick();
    const updated = targets.map((t) => (t.id === id ? { ...t, notes: tempNotes } : t));
    saveWatchlist(updated);
    setTargets(updated);
    setEditingNotesId(null);
  };

  const handleExportJson = () => {
    playDownload();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(targets, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `shadowwatch-inventory-${Date.now()}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const filteredTargets = targets.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.domain.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
      t.notes?.toLowerCase().includes(q)
    );
  });

  const getGradeStyle = (grade?: LetterGrade) => {
    switch (grade) {
      case "A":
        return "border-emerald-500/50 bg-emerald-500/15 text-emerald-300";
      case "B":
        return "border-cyan-500/50 bg-cyan-500/15 text-cyan-300";
      case "C":
        return "border-amber-500/50 bg-amber-500/15 text-amber-300";
      case "D":
      case "F":
        return "border-rose-500/50 bg-rose-500/15 text-rose-300";
      default:
        return "border-slate-500/50 bg-slate-500/15 text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Container - 100% Solid Opaque */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border border-cyan-500/40 bg-cyan-500/15 text-cyan-300">
                <Bookmark className="h-3.5 w-3.5 text-cyan-400" />
                SHADOWWATCH RECON RADAR
              </span>

              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border border-purple-500/40 bg-purple-500/15 text-purple-300">
                {targets.length} Target{targets.length !== 1 ? "s" : ""} Monitored
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              Target Asset Inventory & Drift Watchlist
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Continuously monitor high-value targets, bug bounty program scopes (HackerOne / Bugcrowd), and
              production perimeters. Automatically preserves historical grades, asset inventory, and hacker notes
              across visits.
            </p>
          </div>

          {/* Quick Export & Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportJson}
              disabled={targets.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium border border-white/[0.1] bg-[#060813] text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-500/15 disabled:opacity-50 transition-all shadow-md active:scale-95"
              title="Export Watchlist Targets as JSON"
            >
              {copiedExport ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <FileDown className="h-3.5 w-3.5 text-cyan-400" />}
              <span>{copiedExport ? "Exported!" : "Export JSON"}</span>
            </button>
          </div>
        </div>

        {/* Quick Add Domain Form Bar */}
        <form onSubmit={handleAddDomain} className="mt-6 pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={newDomainInput}
              onChange={(e) => setNewDomainInput(e.target.value)}
              placeholder="Add target domain (e.g. uber.com, tesla.com, api.internal.org)..."
              className="w-full rounded-xl border border-white/[0.1] bg-[#060813] pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="rounded-xl border border-white/[0.1] bg-[#060813] px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60"
            >
              <option value="BugBounty">BugBounty</option>
              <option value="HackerOne">HackerOne</option>
              <option value="Bugcrowd">Bugcrowd</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="RedTeam">RedTeam</option>
            </select>

            <button
              type="submit"
              disabled={!newDomainInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border border-cyan-500/50 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 hover:border-cyan-400 disabled:opacity-40 transition-all shadow-md shadow-cyan-500/10 active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add to Radar</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search targets by domain, tag or notes..."
            className="w-full rounded-xl border border-white/[0.08] bg-[#0b0f1d] pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredTargets.length} of {targets.length} targets
        </span>
      </div>

      {/* Watchlist Target Cards Grid */}
      {filteredTargets.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-8 text-center space-y-3">
          <Bookmark className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-mono font-bold text-white">No Target Assets in Watchlist</h3>
          <p className="text-xs font-mono text-slate-400 max-w-md mx-auto leading-relaxed">
            Add target domains using the field above or click &ldquo;Track in ShadowWatch&rdquo; on any audit dashboard to
            retain threat posture intelligence.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTargets.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/[0.08] bg-[#0b0f1d] p-5 shadow-xl space-y-3.5 transition-all hover:border-cyan-500/30 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Card Header: FQDN & Grade */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Target FQDN</span>
                    <h3 className="text-base font-mono font-bold text-white truncate">{item.domain}</h3>
                  </div>

                  {item.lastGrade ? (
                    <span
                      className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${getGradeStyle(
                        item.lastGrade
                      )}`}
                    >
                      [{item.lastGrade}] {item.lastScore}/100
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-slate-400">
                      Unscanned
                    </span>
                  )}
                </div>

                {/* Tags & Telemetry Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300"
                    >
                      #{tag}
                    </span>
                  ))}
                  {item.wafProvider && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 flex items-center gap-1">
                      <Flame className="h-2.5 w-2.5 text-cyan-400" />
                      {item.wafProvider}
                    </span>
                  )}
                  {item.danglingTakeovers && item.danglingTakeovers > 0 ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/40 bg-rose-500/15 text-rose-300 flex items-center gap-1">
                      <AlertTriangle className="h-2.5 w-2.5 text-rose-400" />
                      {item.danglingTakeovers} Takeovers!
                    </span>
                  ) : null}
                </div>

                {/* Notes Block */}
                <div className="p-2.5 rounded-xl border border-white/[0.06] bg-[#060813] text-xs font-mono text-slate-300">
                  {editingNotesId === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        className="w-full rounded-lg bg-black/50 border border-cyan-500/40 p-2 text-xs text-white focus:outline-none"
                        rows={2}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-2 py-1 rounded text-[10px] text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNotes(item.id)}
                          className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingNotesId(item.id);
                        setTempNotes(item.notes || "");
                      }}
                      className="cursor-pointer group hover:text-cyan-200 transition-colors"
                      title="Click to edit notes"
                    >
                      <span className="text-slate-400 line-clamp-2">
                        {item.notes || "Click to add custom reconnaissance notes..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-500" suppressHydrationWarning>
                  {item.lastScannedAt ? `Audited ${formatUtcDate(item.lastScannedAt)}` : "Pending Audit"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLaunchScan(item.domain)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 active:scale-95 transition-all font-semibold"
                    title="Launch instant attack surface scan"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Audit</span>
                  </button>

                  <button
                    onClick={() => handleRemove(item.domain)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
