"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { ScanHero } from "@/components/ScanHero";
import { AuditDashboard } from "@/components/AuditDashboard";
import { AiThreatReport } from "@/components/AiThreatReport";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { CyberBackground } from "@/components/CyberBackground";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import type { CompleteScanResult, DiagnosticLog } from "@/lib/types/scanner";
import { Activity, RotateCcw } from "lucide-react";

// Dynamically import TopologyCanvas with SSR disabled to guarantee zero hydration lag and 60+ FPS performance
const TopologyCanvas = dynamic(
  () => import("@/components/TopologyCanvas").then((mod) => mod.TopologyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] rounded-2xl border border-white/[0.08] bg-[#07090e] flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span>Initializing accelerated topology canvas...</span>
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

    // Initial Simulated Client-Side Diagnostic Stream
    addLog("CORE", "info", `Initializing target reconnaissance for '${domain}'...`);
    addLog("SSRF", "info", "Normalizing FQDN and executing anti-SSRF pre-flight checks...");

    // Smoothly scroll to the Reconnaissance Sensor Feed immediately on scan trigger
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
      setCurrentScan(data);
      playSuccess();

      // Ultra-responsive cross-device 120/144Hz smooth viewport transition to the Topology Canvas
      const focusTopology = () => {
        const topologyEl = document.getElementById("topology");
        if (topologyEl) {
          topologyEl.scrollIntoView({ behavior: "smooth", block: "start" });
          return true;
        }
        return false;
      };

      requestAnimationFrame(() => {
        if (!focusTopology()) {
          setTimeout(focusTopology, 50);
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

  // Preload TopologyCanvas module in background so there is zero chunk-loading delay
  useEffect(() => {
    import("@/components/TopologyCanvas");
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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col text-slate-100 relative selection:bg-rose-500/35 selection:text-white">
      {/* Precision Tactical Cyber Intelligence Radar & Threat Constellation Engine */}
      <CyberBackground />

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-full">
        {/* Tactical Navbar */}
        <Navbar
          onScanSample={handleScan}
          activeReportId={currentScan?.id}
          hasActiveScan={Boolean(currentScan)}
        />

        {/* Hero Section & Search Terminal */}
        <main className="flex-1">
          <ScanHero
            onScan={handleScan}
            isScanning={isScanning}
            logs={logs}
            errorMessage={errorMessage}
          />

        {/* Scan Results View */}
        {currentScan ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
            {/* Interactive Topological Graph Section */}
            <div id="topology" className="space-y-4 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
                    <span className="text-cyan-400">[</span>
                    <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <span>Interactive Relational Topology Canvas</span>
                    <span className="text-rose-400">]</span>
                  </h2>
                  <p className="text-xs text-slate-300 font-mono mt-1">
                    Visual attack surface topology with relational perimeter node mapping and vulnerability severity classification
                  </p>
                </div>

                <button
                  onClick={() => {
                    setCurrentScan(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="self-start sm:self-auto flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#0c1020] px-4 py-2 text-xs font-mono font-medium text-slate-200 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/15 active:scale-95 transition-all shadow-md"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Start New Audit</span>
                </button>
              </div>

              <TopologyCanvas topology={currentScan.topology} domain={currentScan.targetDomain} />
            </div>

            {/* Posture Dashboard & Analytical Breakdown */}
            <AuditDashboard scan={currentScan} />

            {/* Autonomous Threat Modeling Studio & Remediation Diffs */}
            <AiThreatReport
              analysis={currentScan.aiAnalysis}
              targetDomain={currentScan.targetDomain}
            />
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
