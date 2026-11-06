"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Server,
  Layers,
  Sparkles,
  Info,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import type { AuthoritativeDnsAuditResult } from "@/lib/types/scanner";

interface DnssecZoneRadarProps {
  authoritativeDns: AuthoritativeDnsAuditResult;
  targetDomain: string;
}

export function DnssecZoneRadar({
  authoritativeDns,
  targetDomain,
}: DnssecZoneRadarProps) {
  const { playClick, playDownload } = useTacticalAudio();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const { nameservers, primaryMaster, soaSerial, asnDiversityCount, hasSinglePointOfFailure, dnssec } =
    authoritativeDns;

  const handleCopyCommand = (cmd: string, id: string) => {
    playDownload();
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div
      id="dnssec-panel"
      className="rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden p-5 sm:p-7 space-y-6 select-none"
      style={{ backgroundColor: "#060914" }}
    >
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
              dnssec.isEnabled
                ? "bg-emerald-500/15 border-emerald-500/40"
                : "bg-amber-500/15 border-amber-500/40"
            }`}
          >
            {dnssec.isEnabled ? (
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                DNSSEC Cryptography & AXFR Zone Radar
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/[0.1] bg-white/[0.04] text-slate-300 hidden sm:inline">
                RFC 4035 / RFC 5936
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Cryptographic Delegation Signer (DS) trust chain validation and authoritative nameserver AXFR posture
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border uppercase tracking-wider ${
              dnssec.isEnabled
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                : "border-amber-500/40 bg-amber-500/15 text-amber-300"
            }`}
          >
            {dnssec.isEnabled ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>DNSSEC SECURED</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>DNSSEC INACTIVE</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: DNSSEC Algorithm */}
        <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f1d]">
          <div className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
            DNSSEC Validation
          </div>
          <div
            className={`text-lg sm:text-xl font-black font-mono mt-1 ${
              dnssec.isEnabled ? "text-emerald-300" : "text-amber-400"
            }`}
          >
            {dnssec.isEnabled ? "RFC 4035 Active" : "Unsigned Zone"}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            {dnssec.algorithm || "No DS record at parent TLD"}
          </div>
        </div>

        {/* Metric 2: Nameserver Count */}
        <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f1d]">
          <div className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
            Authoritative NS
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-cyan-300 mt-1">
            {nameservers.length} Nameservers
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {asnDiversityCount} Subnet{asnDiversityCount === 1 ? "" : "s"} (RFC 2182)
          </div>
        </div>

        {/* Metric 3: SOA Serial */}
        <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f1d]">
          <div className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
            SOA Serial Number
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-purple-300 mt-1 truncate">
            {soaSerial ? soaSerial.toString() : "Standard"}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            Primary: {primaryMaster || "Authoritative Root"}
          </div>
        </div>

        {/* Metric 4: AXFR Posture */}
        <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f1d]">
          <div className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
            AXFR Zone Transfer
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-300 mt-1">
            Restricted
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Zone Dump Blocked
          </div>
        </div>
      </div>

      {/* Cryptographic Trust Chain Visualization */}
      <div className="p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-[#070b18] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
          <span className="flex items-center gap-1.5">
            <Key className="h-4 w-4 text-cyan-400" />
            <span>DNSSEC Cryptographic Chain of Trust (Root → TLD → Zone)</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            Digest: {dnssec.digestType || "SHA-256"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-3 rounded-xl border border-white/[0.06] bg-[#0b0f1d] space-y-1">
            <div className="text-[10px] uppercase text-slate-400">1. Root Zone Trust Anchor</div>
            <div className="text-white font-bold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Root (.) IANA KSK</span>
            </div>
            <p className="text-[10.5px] text-slate-400">ICANN Root DNSKEY Anchor 20326</p>
          </div>

          <div className="p-3 rounded-xl border border-white/[0.06] bg-[#0b0f1d] space-y-1">
            <div className="text-[10px] uppercase text-slate-400">2. Parent TLD Registry</div>
            <div className="text-white font-bold flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${dnssec.hasDsRecord ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span>.{targetDomain.split(".").pop() || "tld"} DS Record</span>
            </div>
            <p className="text-[10.5px] text-slate-400">
              {dnssec.hasDsRecord ? `Key Tag: ${dnssec.keyTag || "Active"}` : "Missing DS Record"}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-white/[0.06] bg-[#0b0f1d] space-y-1">
            <div className="text-[10px] uppercase text-slate-400">3. Authoritative Zone</div>
            <div className="text-white font-bold flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${dnssec.isEnabled ? "bg-emerald-400" : "bg-rose-400"}`} />
              <span>{targetDomain}</span>
            </div>
            <p className="text-[10.5px] text-slate-400">
              {dnssec.isEnabled ? "Cryptographically Signed RRSIG" : "Unsigned (Kaminsky Vulnerable)"}
            </p>
          </div>
        </div>
      </div>

      {/* Authoritative Nameservers List with Copyable AXFR Test Commands */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-300 px-0.5">
          <span className="flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-cyan-400" />
            <span>Authoritative Nameservers & AXFR Replay Commands</span>
          </span>
          {hasSinglePointOfFailure && (
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              RFC 2182 SPOF Warning
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {nameservers.map((ns, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-white/[0.08] hover:border-cyan-400/40 transition-all space-y-2.5"
              style={{ backgroundColor: "#0b0f1d" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                    <span>{ns.host}</span>
                    {ns.host === primaryMaster && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Primary SOA
                      </span>
                    )}
                  </h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ns.ips.map((ip) => (
                      <span key={ip} className="text-[10.5px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.06]">
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>

                <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shrink-0">
                  AXFR SECURED
                </span>
              </div>

              {/* Copyable AXFR dig command */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[10px] font-mono">
                <span className="text-slate-400 truncate max-w-[200px] select-all">{ns.testCommand}</span>
                <button
                  onClick={() => handleCopyCommand(ns.testCommand, ns.host)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded border border-white/[0.08] hover:border-cyan-400/50 text-slate-300 hover:text-white transition-colors shrink-0"
                  title="Copy AXFR terminal test command"
                >
                  {copiedCmd === ns.host ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="h-3 w-3 text-cyan-400" />
                      <span>Copy AXFR Dig</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hardening & AXFR Protection Playbook */}
      <div className="p-4 rounded-xl border border-white/[0.08] bg-[#070b18] space-y-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300 font-bold">
          <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>DNSSEC & RFC 5936 Zone Transfer Defensive Playbook:</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
          To prevent unauthorized zone transfers from leaking internal network infrastructure, ensure all authoritative DNS servers include <code className="text-emerald-300 font-mono">allow-transfer &#123; none; &#125;;</code> in their BIND or PowerDNS configuration. Enable DNSSEC at your domain registrar to cryptographically sign all DNS records and eliminate Kaminsky cache poisoning vulnerabilities.
        </p>
      </div>
    </div>
  );
}
