import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getScanById } from "@/lib/db/storage";
import { Navbar } from "@/components/Navbar";
import { AuditDashboard } from "@/components/AuditDashboard";
import { AiThreatReport } from "@/components/AiThreatReport";
import { ReportTopologyWrapper } from "@/components/ReportTopologyWrapper";
import { CyberBackground } from "@/components/CyberBackground";
import { ArrowLeft, Clock, Activity, ShieldCheck, Printer } from "lucide-react";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReportPageProps) {
  const { id } = await params;
  const scan = await getScanById(id);

  return {
    title: "SHADOR",
    description: scan
      ? `Attack surface audit snapshot for ${scan.targetDomain}. Posture Grade: [${scan.score.letterGrade}] (Risk: ${scan.score.score}/100).`
      : "Passive attack surface intelligence, DNS security, and autonomous threat modeling.",
  };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const scan = await getScanById(id);

  if (!scan) {
    notFound();
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col text-slate-100 relative selection:bg-rose-500/35 selection:text-white">
      {/* Precision Tactical Cyber Intelligence Radar & Threat Constellation Engine */}
      <CyberBackground />

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-full">
        <Navbar activeReportId={scan.id} hasActiveScan={true} />

        <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Navigation Breadcrumb & Snapshot Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Launch New Recon Scan</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`/api/reports/${scan.id}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)] active:scale-95"
                title="Print or Save Executive CISO Threat Dossier as PDF"
              >
                <Printer className="h-3.5 w-3.5 text-cyan-300" />
                <span>Executive PDF</span>
              </a>
              <span className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-[#0c1020] border border-white/[0.08] px-3.5 py-1 rounded-full shadow-sm">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                Snapshot: {new Date(scan.sanitizedAt).toLocaleString()}
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {scan.id}</span>
            </div>
          </div>

          {/* Topological Attack Surface Canvas */}
          <div id="topology" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Interactive Relational Topology Canvas
                </h2>
                <p className="text-xs text-slate-300 font-mono">
                  Visual attack surface topology with relational perimeter node mapping and vulnerability severity classification
                </p>
              </div>
            </div>

            <ReportTopologyWrapper topology={scan.topology} domain={scan.targetDomain} />
          </div>

          {/* Posture Dashboard */}
          <AuditDashboard scan={scan} />

          {/* Autonomous Threat Modeling & Remediation Scripts */}
          <AiThreatReport analysis={scan.aiAnalysis} targetDomain={scan.targetDomain} />
        </main>

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
