"use client";

import React, { useEffect, useRef, useState } from "react";
import { Activity, Radio, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { TextScramble } from "./TextScramble";
import type { DiagnosticLog } from "@/lib/types/scanner";

interface DiagnosticTerminalProps {
  logs: DiagnosticLog[];
  isScanning: boolean;
}

export function DiagnosticTerminal({ logs, isScanning }: DiagnosticTerminalProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !collapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, collapsed]);

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp.split("T")[1]?.replace("Z", "") || ""}] [${l.category}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (cat: DiagnosticLog["category"]) => {
    switch (cat) {
      case "SSRF":
        return "badge-chroma-cyan";
      case "DNS":
        return "badge-chroma-white";
      case "EMAIL":
        return "badge-chroma-amber";
      case "SUBDOMAINS":
        return "badge-chroma-crimson";
      case "TLS":
        return "badge-chroma-emerald";
      case "HEADERS":
        return "badge-chroma-crimson";
      case "INTEL":
      case "SYNTH":
        return "badge-chroma-violet";
      default:
        return "bg-white/[0.05] border border-white/[0.15] text-white";
    }
  };

  const getLevelColor = (level: DiagnosticLog["level"]) => {
    switch (level) {
      case "error":
        return "text-rose-400 font-semibold";
      case "warn":
        return "text-amber-300";
      case "success":
        return "text-emerald-400 font-medium";
      default:
        return "text-slate-200";
    }
  };

  return (
    <div id="sensor-feed" className="relative w-full rounded-2xl cyber-card shadow-2xl overflow-hidden mt-6 border border-white/[0.1] scroll-mt-24 transition-all duration-300">
      {/* Precision Predator Corner Laser Accents */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none z-10" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-rose-500 pointer-events-none z-10" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none z-10" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rose-500 pointer-events-none z-10" />

      {/* Cyber-Daemon Reconnaissance Sensor Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#030409]/95 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          {/* Demonic Optic Eye Beacon */}
          <div className="relative h-8 w-8 rounded-xl bg-[#070b16] border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            <span className="absolute inset-1 rounded-lg border border-rose-500/30 animate-pulse" />
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-optic-pulse shadow-[0_0_8px_#ff003b]" />
            <Activity className="absolute h-3.5 w-3.5 text-cyan-300 opacity-60" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2.5">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
              DAEMON RECON SENSOR FEED
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {logs.length > 0 ? (
                <span className="text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25">
                  {logs.length} live events captured
                </span>
              ) : (
                "Passive telemetry standing by"
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isScanning ? (
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-rose-300 bg-rose-500/15 border border-rose-500/40 px-2.5 py-1 rounded-lg shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
              <span>DAEMON HARVESTING</span>
            </div>
          ) : logs.length > 0 ? (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>AUDIT COMPLETED</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              <span>ENGINE READY</span>
            </div>
          )}

          {logs.length > 0 && (
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
              title="Copy raw audit logs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
            title={collapsed ? "Expand sensor feed" : "Collapse sensor feed"}
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Output Log Area */}
      {!collapsed && (
        <div
          ref={scrollRef}
          className="h-44 overflow-y-auto p-4 space-y-2 font-mono text-xs bg-[#010206]/95 scrollbar-thin"
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-1.5 py-4">
              <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-1">
                <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
              </div>
              <span className="text-slate-200 text-xs font-mono font-medium">Reconnaissance Sensors Awaiting Target Domain</span>
              <span className="text-[10px] text-slate-400 font-mono text-center max-w-md">
                Submitting a target domain will stream concurrent DNS, SSL/TLS, Certificate Transparency, and RFC 7208/7489 telemetry.
              </span>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 leading-relaxed hover:bg-white/[0.02] p-1 rounded border-l-2 border-transparent hover:border-cyan-500/40 transition-colors"
              >
                <span className="text-[10px] text-slate-400 select-none shrink-0 pt-0.5">
                  {log.timestamp.split("T")[1]?.replace("Z", "").slice(0, 8)}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase tracking-wider ${getCategoryColor(
                    log.category
                  )}`}
                >
                  {log.category}
                </span>
                <span className={`break-words sm:break-all flex-1 ${getLevelColor(log.level)}`}>
                  <TextScramble text={log.message} speed={10} />
                </span>
                {log.durationMs !== undefined && log.durationMs > 0 && (
                  <span className="text-[10px] text-slate-400 shrink-0 ml-auto">
                    {log.durationMs}ms
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
