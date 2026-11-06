"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { GraphTopology } from "@/lib/types/scanner";

const TopologyCanvas = dynamic(
  () => import("@/components/TopologyCanvas").then((mod) => mod.TopologyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] sm:h-[380px] lg:h-[450px] rounded-2xl cyber-card flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span>Initializing accelerated topology canvas...</span>
      </div>
    ),
  }
);

interface ReportTopologyWrapperProps {
  topology: GraphTopology;
  domain?: string;
}

export function ReportTopologyWrapper({ topology, domain }: ReportTopologyWrapperProps) {
  return <TopologyCanvas topology={topology} domain={domain} />;
}
