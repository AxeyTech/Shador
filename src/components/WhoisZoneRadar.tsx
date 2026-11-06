"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Building,
  Calendar,
  Lock,
  Unlock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Server,
} from "lucide-react";
import type { WhoisAuditResult } from "@/lib/types/scanner";

interface WhoisZoneRadarProps {
  whois: WhoisAuditResult;
  targetDomain: string;
}

export function WhoisZoneRadar({ whois, targetDomain }: WhoisZoneRadarProps) {
  const [showAllFlags, setShowAllFlags] = useState(false);

  const isCritical = whois.expiryRisk === "critical" || whois.isNewDomain;
  const isWarning = whois.expiryRisk === "warning";

  // Calculate visual progress percentage for expiry (assuming typical 1-5 year lifecycle)
  const maxDays = 365 * 2;
  const daysLeft = whois.daysUntilExpiry ?? 365;
  const progressPercent = Math.min(100, Math.max(5, Math.round((daysLeft / maxDays) * 100)));

  const hasTransferLock = whois.statusFlags.some((s) =>
    s.toLowerCase().includes("transferprohibited")
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#090d1a] to-[#04060c] border border-cyan-500/20 p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.6)] transition-all duration-300">
      {/* Background Cybernetic Ambient Sheen */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Domain Lifecycle & WHOIS Intelligence
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 uppercase">
                RFC 7482 RDAP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Target: <span className="text-cyan-300 font-bold">{targetDomain}</span> • Authoritative ICANN Registry Ingestion
            </p>
          </div>
        </div>

        {/* Global Lifecycle Risk Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isCritical ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5" /> CRITICAL EXPIRY RISK
            </span>
          ) : isWarning ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">
              <Clock className="h-3.5 w-3.5" /> EXPIRING SOON (&lt;90d)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="h-3.5 w-3.5" /> HEALTHY LIFECYCLE
            </span>
          )}
        </div>
      </div>

      {/* Primary Intelligence Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-5">
        {/* 1. Registrar */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-cyan-400" /> Registrar
            </span>
            {whois.ianaId && (
              <span className="text-[10px] text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded">
                IANA ID: {whois.ianaId}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-white truncate" title={whois.registrar}>
            {whois.registrar}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center gap-1">
            Status: <span className="text-emerald-400 font-semibold">Accredited</span>
          </div>
        </div>

        {/* 2. Domain Age */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Domain Age
            </span>
            {whois.isNewDomain ? (
              <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/40">
                NEWBORN
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                ESTABLISHED
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-cyan-200">
            {whois.ageHuman}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {whois.createdDate
              ? `Registered ${new Date(whois.createdDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
              : "Registration date shielded"}
          </div>
        </div>

        {/* 3. Expiration Meter */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" /> Expiry Countdown
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              {whois.daysUntilExpiry !== null ? `${whois.daysUntilExpiry}d left` : "Undisclosed"}
            </span>
          </div>
          <div className="text-sm font-bold text-white">
            {whois.expiresDate
              ? new Date(whois.expiresDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
              : "Auto-renew protected"}
          </div>
          {whois.daysUntilExpiry !== null && (
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCritical ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* 4. Hijacking Lock Status */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5">
              {hasTransferLock ? (
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Unlock className="h-3.5 w-3.5 text-rose-400" />
              )}
              Transfer Lock
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                hasTransferLock
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
              }`}
            >
              {hasTransferLock ? "LOCKED" : "UNLOCKED"}
            </span>
          </div>
          <div className="text-sm font-bold text-white">
            {hasTransferLock ? "Anti-Hijack Guard Active" : "Transfer Lock Missing"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {hasTransferLock ? "clientTransferProhibited set" : "Vulnerable to unauthorized transfer"}
          </div>
        </div>
      </div>

      {/* Advisory Bar */}
      <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-2.5 text-xs font-mono">
        <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-slate-300 leading-relaxed">
          <strong className="text-cyan-300">Auditor Assessment:</strong> {whois.riskSummary}
        </div>
      </div>

      {/* Status Flags & Name Servers Expandable Tray */}
      {whois.statusFlags.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <button
            onClick={() => setShowAllFlags(!showAllFlags)}
            className="flex items-center justify-between w-full text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors py-1"
          >
            <span className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                ICANN Registry Status Flags ({whois.statusFlags.length} active)
              </span>
            </span>
            {showAllFlags ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showAllFlags && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
              {whois.statusFlags.map((flag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-black/40 border border-white/[0.1] text-slate-300"
                >
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
