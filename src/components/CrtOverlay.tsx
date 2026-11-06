"use client";

import React from "react";
import { useCrtHud } from "@/lib/crt/CrtContext";

export function CrtOverlay() {
  const { isCrtEnabled } = useCrtHud();

  if (!isCrtEnabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 select-none overflow-hidden"
    >
      {/* Scanline Raster Layer */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))",
          backgroundSize: "100% 3px, 6px 100%",
        }}
      />

      {/* Phosphor Cathode Tube Vignette */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at center, transparent 60%, rgba(3, 7, 18, 0.85) 100%)",
        }}
      />

      {/* Military Reticle Outer Framing */}
      <div className="absolute inset-2 sm:inset-4 border border-cyan-500/20 rounded-2xl pointer-events-none" />

      {/* Corner Ticks */}
      <span className="absolute top-3 left-3 text-cyan-400/70 font-mono text-xs select-none">┌</span>
      <span className="absolute top-3 right-3 text-cyan-400/70 font-mono text-xs select-none">┐</span>
      <span className="absolute bottom-3 left-3 text-cyan-400/70 font-mono text-xs select-none">└</span>
      <span className="absolute bottom-3 right-3 text-cyan-400/70 font-mono text-xs select-none">┘</span>

      {/* Top Center CRT Telemetry Pill */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#050914]/90 border border-cyan-500/30 text-[9px] font-mono text-cyan-300 shadow-[0_0_12px_rgba(0,245,255,0.3)]">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>BLACK-OPS CRT HUD · 60Hz PHOSPHOR ACTIVE</span>
      </div>
    </div>
  );
}
