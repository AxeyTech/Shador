"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { ScanHero } from "@/components/ScanHero";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { CyberBackground } from "@/components/CyberBackground";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import type { CompleteScanResult, DiagnosticLog } from "@/lib/types/scanner";
import { Activity, Shield, ShieldCheck, Layers, Rows } from "lucide-react";

type WorkspacePillar = "posture" | "topology" | "remediation" | "stacked";

// Code-split heavy post-scan workspaces so initial Render landing load is near-instantaneous
const TopologyCanvas = dynamic(
  () => import("@/components/TopologyCanvas").then((mod) => mod.TopologyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded-2xl border border-white/[0.08] bg-[#07090e] flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span>Initializing accelerated topology canvas...</span>
      </div>
    ),
  }
);

const AuditDashboard = dynamic(
  () => import("@/components/AuditDashboard").then((mod) => mod.AuditDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[360px] rounded-2xl border border-white/[0.08] bg-[#07090e] flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span>Hydrating posture telemetry modules...</span>
      </div>
    ),
  }
);

const AiThreatReport = dynamic(
  () => import("@/components/AiThreatReport").then((mod) => mod.AiThreatReport),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[320px] rounded-2xl border border-white/[0.08] bg-[#07090e] flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <span>Synthesizing remediation playbooks...</span>
      </div>
    ),
  }
);

export default function HomePage() {
  const { playScanDispatch, playSuccess, playAlert } = useTacticalAudio();
  const [currentScan, setCurrentScan] = useState<CompleteScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePillar, setActivePillar] = useState<WorkspacePillar>("posture");

  const addLog = useCallback((
    category: DiagnosticLog["category"],
    level: DiagnosticLog["level"],
    message: string
  ) => {
    const newLog: DiagnosticLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      category,
      level,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  const handleScan = useCallback(async (domain: string) => {
    setErrorMessage(null);
    setIsScanning(true);
    setLogs([]);
    playScanDispatch();

    // Warm up post-scan studio chunks during the active API scan (zero impact on initial page open)
    void import("@/components/AuditDashboard");
    void import("@/components/TopologyCanvas");

    // Initial Simulated Client-Side Diagnostic Stream
    addLog("CORE", "info", `Initializing target reconnaissance for '${domain}'...`);
    addLog("SSRF", "info", "Normalizing FQDN and executing anti-SSRF pre-flight checks...");

    // Scroll to the Reconnaissance Sensor Feed immediately on scan trigger
    setTimeout(() => {
      const feedEl = document.getElementById("sensor-feed");
      if (feedEl) {
        feedEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);

    try {
      const t1 = setTimeout(() => {
        addLog("DNS", "info", "Dispatching concurrent DNS lookups (A, AAAA, MX, TXT, NS, SOA)...");
      }, 100);

      const t2 = setTimeout(() => {
        addLog("EMAIL", "info", "Auditing SPF policy mechanism and DMARC enforcement (_dmarc)...");
      }, 220);

      const t3 = setTimeout(() => {
        addLog("SUBDOMAINS", "info", "Ingesting Certificate Transparency logs & checking dangling CNAMEs...");
      }, 340);

      const t4 = setTimeout(() => {
        addLog("TLS", "info", "Connecting to port 443 with SNI to verify certificate authority & ciphers...");
      }, 460);

      const t5 = setTimeout(() => {
        addLog("HEADERS", "info", "Executing safe HEAD request to audit HSTS, CSP, and edge defensive headers...");
      }, 580);

      const t6 = setTimeout(() => {
        addLog("INTEL", "info", "Aggregating telemetry and dispatching to cognitive threat synthesizer...");
      }, 700);

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reconnaissance execution encountered an error.");
      }

      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
      setActivePillar("posture");
      setCurrentScan(data);
      playSuccess();

      requestAnimationFrame(() => {
        const ws = document.getElementById("scan-workspace");
        if (ws) {
          ws.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    } catch (err: unknown) {
      playAlert();
      const msg = err instanceof Error ? err.message : "Failed to execute scan.";
      setErrorMessage(msg);
      addLog("CORE", "error", `Reconnaissance failed: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  }, [addLog, playAlert, playScanDispatch, playSuccess]);

  // Synchronize Navbar / FeaturesDropdown / Mobile Dock jumps with active Post-Scan Workspace Pillar
  useEffect(() => {
    const handleWorkspaceJump = (e: Event) => {
      const detail = (e as CustomEvent<{ tab?: string; sectionId?: string }>).detail;
      if (!detail) return;
      if (detail.sectionId === "topology") {
        setActivePillar("topology");
      } else if (detail.sectionId === "remediation") {
        setActivePillar("remediation");
      } else if (detail.sectionId === "posture" || detail.tab) {
        setActivePillar((prev) => (prev === "stacked" ? "stacked" : "posture"));
        if (detail.tab) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("shador:sync-tab", { detail }));
          }, 60);
        }
      }
    };

    window.addEventListener("shador:switch-tab", handleWorkspaceJump);
    window.addEventListener("shadowtrace:switch-tab", handleWorkspaceJump);
    return () => {
      window.removeEventListener("shador:switch-tab", handleWorkspaceJump);
      window.removeEventListener("shadowtrace:switch-tab", handleWorkspaceJump);
    };
  }, []);

  // Inspect query parameter on mount for automated command palette triggers
  const initialTriggerRef = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !initialTriggerRef.current) {
      initialTriggerRef.current = true;
      const params = new URLSearchParams(window.location.search);
      const scanTarget = params.get("scan");
      if (scanTarget && !isScanning && !currentScan) {
        handleScan(scanTarget);
      }
    }
  }, [handleScan, isScanning, currentScan]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip flex flex-col text-slate-100 relative selection:bg-rose-500/35 selection:text-white">
      {/* Precision Tactical Cyber Intelligence Radar & Threat Constellation Engine */}
      <CyberBackground />

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-full">
        {/* Tactical Navbar */}
        <Navbar
          onScanSample={handleScan}
          activeReportId={currentScan?.id}
          hasActiveScan={Boolean(currentScan)}
        />

        {/* Hero Section & Search Terminal (Auto-compacts when scan results are active) */}
        <main className="flex-1">
          <ScanHero
            onScan={handleScan}
            isScanning={isScanning}
            logs={logs}
            errorMessage={errorMessage}
            hasActiveScan={Boolean(currentScan)}
            activeDomain={currentScan?.targetDomain}
            onResetScan={() => {
              setCurrentScan(null);
              setLogs([]);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />

        {/* Post-Scan Focused Workspace (Eliminates Excessive Vertical Scrolling on Mobile) */}
        {currentScan ? (
          <div id="scan-workspace" className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 sm:pb-10 space-y-6 scroll-mt-20">
            {/* Segmented Pillar Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 rounded-2xl border border-white/[0.1] bg-[#050814]/95 shadow-lg">
              <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActivePillar("posture")}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-colors cursor-pointer ${
                    activePillar === "posture"
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_14px_rgba(0,240,255,0.2)]"
                      : "text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Posture</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePillar("topology")}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-colors cursor-pointer ${
                    activePillar === "topology"
                      ? "bg-rose-500/20 text-rose-200 border border-rose-400/50 shadow-[0_0_14px_rgba(244,63,94,0.2)]"
                      : "text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  <Activity className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">Topology</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePillar("remediation")}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-colors cursor-pointer ${
                    activePillar === "remediation"
                      ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 shadow-[0_0_14px_rgba(16,185,129,0.2)]"
                      : "text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">AI Fixes</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePillar((prev) => (prev === "stacked" ? "posture" : "stacked"))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                    activePillar === "stacked"
                      ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                      : "border-white/[0.1] bg-white/[0.03] text-slate-300 hover:text-white"
                  }`}
                  title="Toggle Focused View vs Stacked Scrollable View"
                >
                  {activePillar === "stacked" ? <Layers className="h-3.5 w-3.5 text-cyan-400" /> : <Rows className="h-3.5 w-3.5 text-cyan-400" />}
                  <span>{activePillar === "stacked" ? "Focused Mode" : "All Stacked"}</span>
                </button>
              </div>
            </div>

            {/* Posture Dashboard & Analytical Breakdown */}
            {(activePillar === "posture" || activePillar === "stacked") && (
              <AuditDashboard scan={currentScan} />
            )}

            {/* Interactive Topological Graph Section */}
            {(activePillar === "topology" || activePillar === "stacked") && (
              <div id="topology" className="space-y-4 scroll-mt-24">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
                    <span className="text-cyan-400">[</span>
                    <Activity className="h-5 w-5 text-cyan-400" />
                    <span>Interactive Relational Topology Canvas</span>
                    <span className="text-rose-400">]</span>
                  </h2>
                  <p className="text-xs text-slate-300 font-mono mt-1">
                    Visual attack surface topology with relational perimeter node mapping and vulnerability severity classification
                  </p>
                </div>

                <TopologyCanvas topology={currentScan.topology} domain={currentScan.targetDomain} />
              </div>
            )}

            {/* Autonomous Threat Modeling Studio & Remediation Diffs */}
            {(activePillar === "remediation" || activePillar === "stacked") && (
              <AiThreatReport
                analysis={currentScan.aiAnalysis}
                targetDomain={currentScan.targetDomain}
              />
            )}
          </div>
        ) : (
          /* Landing Feature Matrix Showcase */
          <FeatureShowcase />
        )}
      </main>

      {/* Production Footer with Quad-Spectrum Hairline */}
      <footer className="w-full border-t border-white/[0.08] bg-[#020307] relative py-8 text-xs font-mono text-slate-500">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/35 via-white/40 via-rose-500/35 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-center text-center">
          <span className="font-medium text-slate-400">© 2026 SHADOR by Akshay Sharma. All rights reserved.</span>
        </div>
      </footer>
    </div>
  </div>
);
}
