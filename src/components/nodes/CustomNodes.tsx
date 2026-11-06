"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Globe, Shield, Mail, Server, AlertTriangle, Radio, Network, Sparkles } from "lucide-react";
import type { TopologyNodeData } from "@/lib/types/scanner";

export const TargetReticle = () => (
  <div className="absolute -inset-2 rounded-xl border border-rose-500/80 animate-pulse pointer-events-none shadow-[0_0_25px_rgba(244,63,94,0.9)] z-30">
    {/* Cyber-Daemon Predator Precision Corner Reticles */}
    <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-rose-500" />
    <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400" />
    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-rose-500" />

    {/* Predator Target Lock Banner */}
    <span className="absolute -top-3.5 right-1 bg-gradient-to-r from-rose-600 via-crimson-600 to-rose-500 text-white font-mono text-[8px] font-black tracking-widest px-2 py-0.5 rounded shadow-lg flex items-center gap-1 border border-white/20">
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-ping" />
      <span>DAEMON LOCK</span>
    </span>
  </div>
);

export const RootNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as TopologyNodeData;
  const isCritical = nodeData.severity === "critical";

  return (
    <div
      className={`relative px-5 py-3.5 rounded-2xl border shadow-2xl transition-colors duration-200 ${
        nodeData.isSimulated
          ? "border-rose-500 bg-rose-950/90 shadow-[0_0_40px_rgba(244,63,94,0.7)] scale-105"
          : isCritical
          ? "border-rose-500/90 bg-rose-950/85 shadow-[0_0_35px_rgba(244,63,94,0.4)]"
          : "border-cyan-400/80 bg-gradient-to-br from-[#051120] via-[#060c18] to-[#040814] shadow-[0_0_35px_rgba(0,240,255,0.35)]"
      }`}
    >
      {nodeData.isSimulated && <TargetReticle />}
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2.5 !h-2.5 !border-none" />
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2.5 !h-2.5 !border-none" />
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-md ${
            isCritical ? "bg-rose-500/25 text-rose-300" : "bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-300 border border-cyan-400/40"
          }`}
        >
          <Radio className="h-5 w-5 animate-pulse text-cyan-400" />
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
            {nodeData.subtitle || "Target Apex"}
          </div>
          <div className="text-sm font-bold tracking-wide text-white break-all max-w-[190px] font-mono">
            {nodeData.label}
          </div>
        </div>
      </div>
    </div>
  );
});
RootNode.displayName = "RootNode";

export const SubdomainNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as TopologyNodeData;
  const isDangling = nodeData.severity === "critical";
  const isNew = Boolean(nodeData.isDriftNew);

  return (
    <div
      className={`relative px-3.5 py-2 rounded-xl border shadow-md transition-colors duration-150 md:hover:scale-105 ${
        nodeData.isSimulated
          ? "border-rose-500 bg-rose-950/90 shadow-[0_0_24px_rgba(244,63,94,0.65)] scale-105"
          : isDangling
          ? "border-rose-500 bg-rose-950/85 shadow-[0_0_16px_rgba(244,63,94,0.45)]"
          : isNew
          ? "border-amber-400 bg-amber-950/80 shadow-[0_0_14px_rgba(251,191,36,0.3)]"
          : "border-cyan-500/35 bg-[#060e1d]/95 text-cyan-200 hover:border-cyan-400/60"
      }`}
    >
      {nodeData.isSimulated && <TargetReticle />}
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-1.5 !h-1.5 !border-none" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-1.5 !h-1.5 !border-none" />

      <div className="flex items-center gap-2">
        <Globe className={`h-3.5 w-3.5 ${isDangling ? "text-rose-400" : "text-cyan-400"}`} />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-medium text-slate-200 break-all max-w-[150px]">
              {nodeData.label}
            </span>
            {isDangling && (
              <span className="flex items-center text-[9px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/40">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5 inline" />
                TAKEOVER
              </span>
            )}
            {isNew && !isDangling && (
              <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40">
                NEW
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono text-slate-400">
            {nodeData.subtitle || "Subdomain"}
          </span>
        </div>
      </div>
    </div>
  );
});
SubdomainNode.displayName = "SubdomainNode";

export const MxNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as TopologyNodeData;
  const isCritical = nodeData.severity === "critical";

  return (
    <div
      className={`relative px-3 py-1.5 rounded-xl border shadow-sm transition-colors md:hover:scale-105 ${
        nodeData.isSimulated
          ? "border-rose-500 bg-rose-950/90 shadow-[0_0_24px_rgba(244,63,94,0.65)] scale-105"
          : isCritical
          ? "border-rose-500/60 bg-rose-950/75"
          : "border-sky-500/35 bg-[#081220]/95 text-sky-200 hover:border-sky-400/60"
      }`}
    >
      {nodeData.isSimulated && <TargetReticle />}
      <Handle type="target" position={Position.Top} className="!bg-sky-400 !w-1.5 !h-1.5 !border-none" />
      <Handle type="source" position={Position.Bottom} className="!bg-sky-400 !w-1.5 !h-1.5 !border-none" />
      <div className="flex items-center gap-2">
        <Mail className={`h-3.5 w-3.5 ${isCritical ? "text-rose-400" : "text-sky-400"}`} />
        <div>
          <span className="text-xs font-mono text-slate-200 block truncate max-w-[130px]">
            {nodeData.label}
          </span>
          <span className="text-[9px] font-mono text-sky-300/80">Mail Gateway</span>
        </div>
      </div>
    </div>
  );
});
MxNode.displayName = "MxNode";

export const NsNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as TopologyNodeData;

  return (
    <div
      className={`relative px-3 py-1.5 rounded-xl border shadow-sm transition-colors md:hover:scale-105 ${
        nodeData.isSimulated
          ? "border-rose-500 bg-rose-950/90 shadow-[0_0_24px_rgba(244,63,94,0.65)] scale-105"
          : "border-indigo-500/35 bg-[#0b0c1e]/95 hover:border-indigo-400/60"
      }`}
    >
      {nodeData.isSimulated && <TargetReticle />}
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-1.5 !h-1.5 !border-none" />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-1.5 !h-1.5 !border-none" />
      <div className="flex items-center gap-2">
        <Server className="h-3.5 w-3.5 text-indigo-400" />
        <div>
          <span className="text-xs font-mono text-slate-200 block truncate max-w-[130px]">
            {nodeData.label}
          </span>
          <span className="text-[9px] font-mono text-indigo-300/80">Authoritative NS</span>
        </div>
      </div>
    </div>
  );
});
NsNode.displayName = "NsNode";

export const TlsNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as TopologyNodeData;
  const isCritical = nodeData.severity === "critical";
  const isWarning = nodeData.severity === "warning";

  return (
    <div
      className={`relative px-3 py-1.5 rounded-xl border shadow-sm transition-colors md:hover:scale-105 ${
        nodeData.isSimulated
          ? "border-rose-500 bg-rose-950/90 shadow-[0_0_24px_rgba(244,63,94,0.65)] scale-105"
          : isCritical
          ? "border-rose-500/80 bg-rose-950/75 text-rose-300"
          : isWarning
          ? "border-amber-500/80 bg-amber-950/75 text-amber-300"
          : "border-emerald-500/50 bg-[#081813]/95 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
      }`}
    >
      {nodeData.isSimulated && <TargetReticle />}
      <Handle type="target" position={Position.Top} className="!bg-emerald-400 !w-1.5 !h-1.5 !border-none" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400 !w-1.5 !h-1.5 !border-none" />
      <div className="flex items-center gap-2">
        <Shield className="h-3.5 w-3.5 text-emerald-400" />
        <div>
          <span className="text-xs font-mono font-medium block truncate max-w-[130px]">
            {nodeData.label}
          </span>
          <span className="text-[9px] font-mono text-emerald-300/80">Port 443 TLS</span>
        </div>
      </div>
    </div>
  );
});
TlsNode.displayName = "TlsNode";

export const IpNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as TopologyNodeData;

  return (
    <div
      className={`relative px-2.5 py-1 rounded-lg border shadow-sm transition-colors md:hover:scale-105 ${
        nodeData.isSimulated
          ? "border-rose-500 bg-rose-950/90 shadow-[0_0_24px_rgba(244,63,94,0.65)] scale-105"
          : "border-amber-500/30 bg-[#120f09]/95"
      }`}
    >
      {nodeData.isSimulated && <TargetReticle />}
      <Handle type="target" position={Position.Top} className="!bg-amber-400 !w-1.5 !h-1.5 !border-none" />
      <div className="flex items-center gap-1.5">
        <Network className="h-3 w-3 text-amber-400" />
        <span className="text-[11px] font-mono text-amber-200">{nodeData.label}</span>
      </div>
    </div>
  );
});
IpNode.displayName = "IpNode";
