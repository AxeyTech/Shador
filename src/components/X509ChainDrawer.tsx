"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Download,
  Copy,
  Check,
  ChevronRight,
  ArrowDown,
  Key,
  Calendar,
  Layers,
  FileCode,
  Sparkles,
  ExternalLink,
  Cpu,
} from "lucide-react";
import type { CompleteScanResult, X509CertNode } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { formatUtcDate } from "@/lib/utils";

interface X509ChainDrawerProps {
  scan: CompleteScanResult;
}

export function X509ChainDrawer({ scan }: X509ChainDrawerProps) {
  const { playClick, playDownload } = useTacticalAudio();
  const tls = scan.tls;
  const certChain = tls?.certChain || [];

  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [copiedPem, setCopiedPem] = useState(false);

  // If no TLS available
  if (!tls || !tls.hasTls || certChain.length === 0) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-center font-mono text-xs text-rose-300">
        <ShieldAlert className="h-6 w-6 mx-auto mb-2 text-rose-400" />
        <p className="font-bold">No Cryptographic X.509 Certificate Chain Available</p>
        <p className="text-slate-400 text-[11px] mt-1">
          Port 443 handshake was rejected, timed out, or endpoint is not offering TLS encryption.
        </p>
      </div>
    );
  }

  const activeCert: X509CertNode = certChain[selectedIdx] || certChain[0];

  const handleCopyFingerprint = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedFingerprint(true);
    playClick();
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const handleCopyPem = () => {
    const pem = tls.rawPem || `-----BEGIN CERTIFICATE-----\nMIIE+zCCA+OgAwIBAgIU...\n-----END CERTIFICATE-----`;
    navigator.clipboard.writeText(pem);
    setCopiedPem(true);
    playClick();
    setTimeout(() => setCopiedPem(false), 2000);
  };

  const handleDownloadPem = () => {
    playDownload();
    const pem = tls.rawPem || `-----BEGIN CERTIFICATE-----\nMIIE+zCCA+OgAwIBAgIU...\n-----END CERTIFICATE-----`;
    const blob = new Blob([pem], { type: "application/x-x509-ca-cert;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scan.targetDomain}-${activeCert.level}-cert.crt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level: "leaf" | "intermediate" | "root") => {
    switch (level) {
      case "leaf":
        return {
          label: "Leaf Certificate",
          style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          icon: <Lock className="h-3.5 w-3.5 text-emerald-400" />,
        };
      case "intermediate":
        return {
          label: "Intermediate CA",
          style: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
          icon: <Layers className="h-3.5 w-3.5 text-cyan-400" />,
        };
      case "root":
        return {
          label: "Root Trust Anchor",
          style: "bg-purple-500/15 text-purple-300 border-purple-500/30",
          icon: <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />,
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            <span>Interactive X.509 Certificate Chain Hierarchy</span>
          </h4>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Cryptographic trust path verification from RFC 5280 Root Anchor down to Edge End-Entity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tls.ocspStapling && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              OCSP Stapled
            </span>
          )}
          {tls.alpnProtocols && tls.alpnProtocols.length > 0 && (
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              ALPN: {tls.alpnProtocols.join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Visual Hierarchy Flow Track */}
      {/* Desktop / Tablet Horizontal Chain */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
        {certChain.map((node, idx) => {
          const badge = getLevelBadge(node.level);
          const isSelected = selectedIdx === idx;
          return (
            <div
              key={idx}
              onClick={() => {
                setSelectedIdx(idx);
                playClick();
              }}
              className={`relative cursor-pointer rounded-xl border p-3.5 transition-all duration-200 select-none ${
                isSelected
                  ? "border-emerald-500/70 bg-[#0d161a] shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.02]"
                  : "border-white/[0.08] bg-[#090d18]/70 hover:border-white/[0.2] hover:bg-[#0c1220]"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badge.style}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>

                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                    node.trusted
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                  }`}
                >
                  {node.trusted ? "TRUSTED" : "UNTRUSTED"}
                </span>
              </div>

              {/* Subject Title */}
              <div className="space-y-0.5">
                <p className="text-xs font-mono font-bold text-white truncate" title={node.subjectCn}>
                  {node.subjectCn}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {node.subjectOrg || node.issuerOrg || "Verified Certificate Authority"}
                </p>
              </div>

              {/* Meta pills */}
              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/[0.06] text-[10px] font-mono text-slate-400">
                <span>{node.keyAlgorithm} {node.keySizeBits}-bit</span>
                <span className={node.daysRemaining <= 14 ? "text-amber-400 font-bold" : "text-slate-300"}>
                  {node.daysRemaining} days left
                </span>
              </div>

              {/* Active Selection Glow Ring */}
              {isSelected && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Deep Cryptographic Inspector Drawer for Active Certificate */}
      {activeCert && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#070b16] p-4 sm:p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center shrink-0">
                <Key className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                  Cryptographic Inspector ({activeCert.level.toUpperCase()})
                </span>
                <span className="text-sm font-bold text-white font-mono break-all">
                  {activeCert.subjectCn}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleCopyPem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] bg-[#0f1422] hover:bg-white/[0.08] text-slate-300 hover:text-white font-mono text-xs font-medium transition-all active:scale-95 shadow-sm"
                title="Copy PEM Certificate block"
              >
                {copiedPem ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedPem ? "Copied" : "Copy PEM"}</span>
              </button>

              <button
                onClick={handleDownloadPem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white font-mono text-xs font-semibold transition-all active:scale-95 shadow-sm"
                title="Download PEM Certificate (.crt)"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .crt</span>
              </button>
            </div>
          </div>

          {/* Detailed Fields Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs font-mono">
            {/* Subject Org */}
            <div className="rounded-xl border border-white/[0.05] bg-[#090d18] p-3 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 block tracking-wider">Subject Organization (O)</span>
              <span className="text-white font-semibold truncate block">
                {activeCert.subjectOrg || "None (Domain Validated / Cloud Multi-tenant)"}
              </span>
            </div>

            {/* Issuer */}
            <div className="rounded-xl border border-white/[0.05] bg-[#090d18] p-3 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 block tracking-wider">Issued By (CA)</span>
              <span className="text-white font-semibold truncate block">
                {activeCert.issuerCn} {activeCert.issuerOrg ? `(${activeCert.issuerOrg})` : ""}
              </span>
            </div>

            {/* Key Specification */}
            <div className="rounded-xl border border-white/[0.05] bg-[#090d18] p-3 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 block tracking-wider">Public Key & Curve</span>
              <span className="text-white font-semibold block">
                {activeCert.keyAlgorithm} · {activeCert.keySizeBits} bits
              </span>
            </div>

            {/* Signature Algorithm */}
            <div className="rounded-xl border border-white/[0.05] bg-[#090d18] p-3 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 block tracking-wider">Signature Algorithm</span>
              <span className="text-emerald-300 font-semibold truncate block">
                {activeCert.signatureAlgorithm || "sha256WithRSAEncryption"}
              </span>
            </div>

            {/* Valid From */}
            <div className="rounded-xl border border-white/[0.05] bg-[#090d18] p-3 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 block tracking-wider">Valid From</span>
              <span className="text-slate-300 block font-mono" suppressHydrationWarning>
                {formatUtcDate(activeCert.validFrom)}
              </span>
            </div>

            {/* Valid To */}
            <div className="rounded-xl border border-white/[0.05] bg-[#090d18] p-3 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 block tracking-wider">Expires On</span>
              <span
                className={`font-mono ${activeCert.daysRemaining <= 14 ? "text-amber-400 font-bold" : "text-slate-300"}`}
                suppressHydrationWarning
              >
                {formatUtcDate(activeCert.validTo)} ({activeCert.daysRemaining} days left)
              </span>
            </div>
          </div>

          {/* Serial Number & SHA-256 Fingerprint */}
          <div className="space-y-2 pt-1">
            {activeCert.serialNumber && (
              <div className="rounded-xl border border-white/[0.05] bg-[#090d18] p-3">
                <span className="text-[10px] uppercase text-slate-400 block font-mono tracking-wider">
                  Certificate Serial Number (HEX)
                </span>
                <span className="text-xs font-mono text-slate-300 break-all select-all font-semibold">
                  {activeCert.serialNumber}
                </span>
              </div>
            )}

            {activeCert.fingerprintSha256 && (
              <div className="rounded-xl border border-white/[0.05] bg-[#090d18] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase text-slate-400 block font-mono tracking-wider">
                    SHA-256 Thumbprint / Fingerprint
                  </span>
                  <span className="text-xs font-mono text-cyan-300 break-all select-all font-semibold">
                    {activeCert.fingerprintSha256}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyFingerprint(activeCert.fingerprintSha256)}
                  className="self-start sm:self-auto p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                  title="Copy SHA-256 fingerprint"
                >
                  {copiedFingerprint ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
