"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  FileText,
  Shield,
  Printer,
  ExternalLink,
  Sparkles,
  Radio,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import type { CompleteScanResult } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import {
  generateStix21Bundle,
  generateCisoMarkdownReport,
} from "@/lib/export/intelligence-feed";
import { generateExecutivePdfHtml } from "@/lib/export/pdf-dossier";

interface IntelligenceExportModalProps {
  scan: CompleteScanResult;
  isOpen: boolean;
  onClose: () => void;
}

export function IntelligenceExportModal({
  scan,
  isOpen,
  onClose,
}: IntelligenceExportModalProps) {
  const { playClick, playDownload, triggerHaptic } = useTacticalAudio();
  const [activeFormat, setActiveFormat] = useState<"pdf" | "stix" | "markdown" | "raw">("pdf");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const stixBundle = generateStix21Bundle(scan);
  const stixJsonString = JSON.stringify(stixBundle, null, 2);
  const markdownReport = generateCisoMarkdownReport(scan);
  const rawJsonString = JSON.stringify(scan, null, 2);
  const printUrl = `/api/reports/${scan.id}/print`;

  const getCurrentContent = () => {
    switch (activeFormat) {
      case "pdf":
        return {
          content: generateExecutivePdfHtml(scan),
          ext: "html",
          mime: "text/html",
          filename: `${scan.targetDomain}-executive-dossier.html`,
        };
      case "stix":
        return {
          content: stixJsonString,
          ext: "json",
          mime: "application/json",
          filename: `${scan.targetDomain}-stix2.1-bundle.json`,
        };
      case "markdown":
        return {
          content: markdownReport,
          ext: "md",
          mime: "text/markdown",
          filename: `${scan.targetDomain}-ciso-dossier.md`,
        };
      case "raw":
        return {
          content: rawJsonString,
          ext: "json",
          mime: "application/json",
          filename: `shador-${scan.targetDomain}-raw.json`,
        };
    }
  };

  const handleCopy = () => {
    triggerHaptic("medium");
    playDownload();
    const { content } = getCurrentContent();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    triggerHaptic("heavy");
    playDownload();
    const { content, mime, filename } = getCurrentContent();
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    triggerHaptic("heavy");
    playClick();
    // Open the print-perfect standalone dossier in a new window and trigger print
    const printWindow = window.open(printUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[880px] flex flex-col rounded-2xl border border-white/[0.12] bg-[#030612] text-white shadow-[0_10px_60px_rgba(0,0,0,0.95)] overflow-hidden font-mono">
        {/* Specular Tri-Color Laser Hairline */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-rose-500 to-emerald-400 shadow-[0_0_12px_#00e5ff]" />

        {/* Modal Header */}
        <div className="p-3 sm:p-5 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-[#050816]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)] shrink-0">
              <Printer className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                  Executive Dossier &amp; Intelligence Export
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded border border-rose-500/40 bg-rose-500/15 text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  CISO GRADE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Print-ready Executive PDF, OASIS STIX 2.1 Threat Feed &amp; CISO Markdown
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("light");
              playClick();
              onClose();
            }}
            className="p-2 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all active:scale-95 shrink-0"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format Selector Pills Bar */}
        <div className="px-3 sm:px-5 py-2.5 border-b border-white/[0.08] bg-[#070b1a] flex flex-wrap items-center justify-between gap-2.5">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 max-w-full">
            {/* Executive PDF Dossier Tab */}
            <button
              onClick={() => {
                triggerHaptic("light");
                playClick();
                setActiveFormat("pdf");
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                activeFormat === "pdf"
                  ? "border border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                  : "border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Printer className="h-3.5 w-3.5 text-cyan-400" />
              <span>Executive PDF Dossier</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                Print A4
              </span>
            </button>

            {/* STIX 2.1 Tab */}
            <button
              onClick={() => {
                triggerHaptic("light");
                playClick();
                setActiveFormat("stix");
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                activeFormat === "stix"
                  ? "border border-cyan-500/50 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                  : "border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <Radio className="h-3.5 w-3.5 text-cyan-400" />
              <span>OASIS STIX 2.1</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hidden sm:inline">
                SIEM
              </span>
            </button>

            {/* Markdown Tab */}
            <button
              onClick={() => {
                triggerHaptic("light");
                playClick();
                setActiveFormat("markdown");
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                activeFormat === "markdown"
                  ? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>CISO Markdown</span>
            </button>

            {/* Raw JSON Tab */}
            <button
              onClick={() => {
                triggerHaptic("light");
                playClick();
                setActiveFormat("raw");
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                activeFormat === "raw"
                  ? "border border-amber-500/50 bg-amber-500/20 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-amber-400" />
              <span>Raw JSON</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {activeFormat === "pdf" ? (
              <>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold transition-all active:scale-95 text-slate-300"
                  title="Save standalone offline HTML dossier"
                >
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Download .html</span>
                </button>

                <button
                  onClick={handlePrintPdf}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-cyan-400/60 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-600/40 text-cyan-200 font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all active:scale-95"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold transition-all active:scale-95"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-cyan-400" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-cyan-500/50 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download File</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Intelligence Format Information Banner */}
        <div className="px-3 sm:px-5 py-2 bg-[#040714] border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <Shield className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            {activeFormat === "pdf" && (
              <span className="truncate">
                Executive CISO Dossier: Print-optimized for A4/Letter PDF with WHOIS, Geo-IP, and Gemini AI narrative.
              </span>
            )}
            {activeFormat === "stix" && (
              <span className="truncate">
                Standard OASIS Open STIX 2.1 Bundle: Direct ingestion for Splunk, Sentinel, OpenCTI &amp; MISP.
              </span>
            )}
            {activeFormat === "markdown" && (
              <span className="truncate">
                Formatted CISO Executive Intelligence Report: Formatted for Notion, Slack, Jira &amp; GitHub Security.
              </span>
            )}
            {activeFormat === "raw" && (
              <span className="truncate">
                Complete Unfiltered Telemetry Matrix: 100% passive DNS, WHOIS, Geo-IP, and headers assets.
              </span>
            )}
          </div>

          {activeFormat === "pdf" && (
            <button
              onClick={handlePrintPdf}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-semibold shrink-0 hidden sm:inline-flex items-center gap-1"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Content Preview Window */}
        <div className="flex-1 overflow-auto bg-[#02040a] relative scrollbar-none">
          {activeFormat === "pdf" ? (
            <div className="h-full w-full flex flex-col">
              <iframe
                src={printUrl}
                title="Executive Dossier Preview"
                className="w-full flex-1 border-0 bg-[#05070e]"
              />
            </div>
          ) : (
            <div className="p-4 sm:p-5 font-mono text-xs leading-relaxed text-slate-300 select-text">
              <pre className="whitespace-pre-wrap break-all font-mono">
                {getCurrentContent().content}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#050816] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Target: <strong className="text-white">{scan.targetDomain}</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-emerald-400 font-semibold">Grade [{scan.score.letterGrade}]</span>
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            SHADOR Autonomous Threat Intelligence Engine
          </span>
        </div>
      </div>
    </div>
  );
}
