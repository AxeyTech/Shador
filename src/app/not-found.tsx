import Link from "next/link";
import { ShieldAlert, ArrowLeft, Terminal } from "lucide-react";

export const dynamic = "force-static";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 select-none relative overflow-hidden"
      style={{ backgroundColor: "#010204" }}
    >
      <div
        className="absolute top-1/4 -left-20 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(225,29,72,0.14), transparent)" }}
      />
      <div
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(8,145,178,0.14), transparent)" }}
      />

      <div
        className="max-w-md w-full rounded-2xl border border-white/[0.1] p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative z-10"
        style={{ backgroundColor: "#04060f" }}
      >
        <div className="h-14 w-14 rounded-2xl border border-rose-500/40 bg-rose-500/15 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <ShieldAlert className="h-7 w-7 text-rose-400" />
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-mono font-bold text-rose-400 tracking-widest uppercase">
            ERR_TARGET_NODE_UNRESOLVED • 404
          </div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
            Perimeter Path Not Found
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed pt-1">
            The requested intelligence vector, dossier ID, or audit path does not exist on this active network topology fabric.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cyan-500/50 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to SHADOR Radar</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-white/[0.06] text-[10px] font-mono text-slate-500">
          SHADOR Tactical OSINT & Attack Surface Engine
        </div>
      </div>
    </main>
  );
}
