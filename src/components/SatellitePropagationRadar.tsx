"use client";

import React, { useState } from "react";
import {
  Globe,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Terminal,
  Zap,
  ShieldCheck,
  Share2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import type { SatelliteRadarResult } from "@/lib/types/scanner";

interface SatellitePropagationRadarProps {
  radar: SatelliteRadarResult;
  targetDomain: string;
}

export function SatellitePropagationRadar({
  radar,
  targetDomain,
}: SatellitePropagationRadarProps) {
  const { playClick, playDownload, playPing } = useTacticalAudio();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyCommand = (cmd: string, id: string) => {
    playDownload();
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleCopyIp = (ip: string) => {
    playDownload();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleRefreshPulse = () => {
    playPing();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const getStatusBadge = () => {
    if (radar.propagationPercentage === 100) {
      return {
        text: "100% SYNCHRONIZED",
        bg: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        icon: CheckCircle2,
      };
    }
    if (radar.isGeoDnsActive) {
      return {
        text: "REGIONAL GEODNS ACTIVE",
        bg: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
        icon: Globe,
      };
    }
    return {
      text: `${radar.propagationPercentage}% PROPAGATING`,
      bg: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      icon: AlertTriangle,
    };
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <div
      id="satellite-panel"
      className="rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden p-5 sm:p-7 space-y-6 select-none"
      style={{ backgroundColor: "#060914" }}
    >
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center shrink-0">
            <Radio className="h-5 w-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                Global Multi-Resolver Satellite HUD
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hidden sm:inline">
                FR-11
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Concurrent worldwide recursive DNS telemetry querying 6 sovereign backbones in parallel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border uppercase tracking-wider ${statusBadge.bg}`}
          >
            <StatusIcon className="h-3.5 w-3.5 shrink-0" />
            <span>{statusBadge.text}</span>
          </span>

          <button
            onClick={handleRefreshPulse}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-white/[0.08] bg-[#0b0f1d] hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all active:scale-95"
            title="Trigger satellite ping pulse"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Primary Telemetry Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f1d]">
          <div className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
            Propagation Index
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300 mt-1">
            {radar.propagationPercentage}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {radar.syncedResolvers}/{radar.totalResolvers} Nodes Synced
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f1d]">
          <div className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
            Average Latency
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300 mt-1">
            {radar.averageLatencyMs}ms
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Global Anycast Edge
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f1d]">
          <div className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
            Routing Topology
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300 mt-1 truncate">
            {radar.isGeoDnsActive ? "GeoDNS" : "Anycast"}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {radar.isGeoDnsActive ? "Multi-Zone Geo Routed" : "BGP Single Anycast IP"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f1d]">
          <div className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
            Satellite Resolvers
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-purple-300 mt-1">
            6 Nodes
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            NA, EU, APAC & Oceania
          </div>
        </div>
      </div>

      {/* Global Satellite Resolver Node Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-semibold px-0.5">
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span>Worldwide Satellite Recursive Resolvers</span>
          </span>
          <span className="text-slate-400 text-[10px]">Parallel SLA &lt; 600ms</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {radar.nodes.map((node) => {
            const isSynced = node.status === "synced";
            const latencyBarWidth = Math.min(100, Math.max(15, Math.round((node.latencyMs / 120) * 100)));

            return (
              <div
                key={node.resolverId}
                className="p-3.5 rounded-xl border border-white/[0.08] hover:border-cyan-400/40 transition-all flex flex-col justify-between gap-3 shadow-md"
                style={{ backgroundColor: "#0b0f1d" }}
              >
                {/* Node Top Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{node.flag}</span>
                      <div>
                        <h4 className="text-xs font-bold font-mono text-white leading-tight">
                          {node.providerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {node.location}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        isSynced
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                      }`}
                    >
                      {isSynced ? "Synced" : "GeoDNS"}
                    </span>
                  </div>

                  {/* Resolver IP & Latency Bar */}
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">DNS: {node.resolverIp}</span>
                    <span
                      className={`font-bold ${
                        node.latencyMs <= 40
                          ? "text-emerald-400"
                          : node.latencyMs <= 90
                          ? "text-cyan-400"
                          : "text-amber-400"
                      }`}
                    >
                      {node.latencyMs}ms
                    </span>
                  </div>

                  {/* Mini Latency Meter */}
                  <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        node.latencyMs <= 40
                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                          : node.latencyMs <= 90
                          ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                          : "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                      }`}
                      style={{ width: `${latencyBarWidth}%` }}
                    />
                  </div>
                </div>

                {/* Resolved IP Addresses */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    Resolved A Records:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {node.resolvedIps.length > 0 ? (
                      node.resolvedIps.map((ip) => (
                        <button
                          key={ip}
                          onClick={() => handleCopyIp(ip)}
                          className="group flex items-center gap-1 px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.03] hover:border-cyan-400/50 hover:bg-cyan-500/10 text-[10.5px] font-mono text-slate-200 transition-colors"
                          title="Click to copy IP"
                        >
                          <span>{ip}</span>
                          {copiedIp === ip ? (
                            <Check className="h-2.5 w-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-2.5 w-2.5 text-slate-500 group-hover:text-cyan-400 opacity-60" />
                          )}
                        </button>
                      ))
                    ) : (
                      <span className="text-[10.5px] font-mono text-rose-400">NXDOMAIN</span>
                    )}
                  </div>
                </div>

                {/* Dig Command Copy Row */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500 truncate max-w-[190px]">{node.command}</span>
                  <button
                    onClick={() => handleCopyCommand(node.command, node.resolverId)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded border border-white/[0.08] hover:border-cyan-400/50 text-slate-300 hover:text-white transition-colors"
                    title="Copy dig terminal command"
                  >
                    {copiedCmd === node.resolverId ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Terminal className="h-3 w-3 text-cyan-400" />
                        <span>Copy Dig</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Architectural Insights Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-white/[0.08] bg-[#080d1e] text-xs font-mono space-y-1.5">
        <div className="flex items-center gap-2 text-cyan-300 font-bold">
          <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>Tactical Architectural Summary:</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          {radar.summary}
        </p>
      </div>
    </div>
  );
}
