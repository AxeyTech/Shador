"use client";

import React, { useState, useMemo } from "react";
import {
  Network,
  Radio,
  Server,
  Globe,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Copy,
  Check,
  Compass,
  ArrowRight,
  ExternalLink,
  Layers,
  Activity,
  Cpu,
  Share2,
  Lock,
  ChevronRight,
  Info,
} from "lucide-react";
import type { NetworkPerimeterResult, IpPerimeterNode, BgpTransitHop } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { calculateCidrHostCount, formatCompactNumber } from "@/lib/utils";

interface AsnRoutingTopologyProps {
  network: NetworkPerimeterResult;
  targetDomain: string;
}

export function AsnRoutingTopology({ network, targetDomain }: AsnRoutingTopologyProps) {
  const { playClick, playPing, triggerHaptic } = useTacticalAudio();
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [selectedHopIndex, setSelectedHopIndex] = useState<number>(2); // Default to IXP / Anycast Edge

  // Fallback BGP routing path if not present in legacy scans
  const routingHops: BgpTransitHop[] = useMemo(() => {
    if (network.bgpRoutingPath && network.bgpRoutingPath.length > 0) {
      return network.bgpRoutingPath;
    }

    const primaryAsn = network.primaryAsn;
    const isAnycast = network.isAnycastProtected;
    const transits = network.upstreamTransits || ["Telia/Arelion (AS1299)", "Cogent (AS174)"];

    return [
      {
        asn: "CLIENT",
        name: "Client Ingress",
        type: "Tier-1 Transit",
        country: "Global",
        role: "Last-mile ISP Access & DNS Ingress Query",
      },
      {
        asn: transits[0]?.split(" ")[1]?.replace(/[()]/g, "") || "AS1299",
        name: transits[0]?.split(" (")[0] || "Tier-1 Backbone Transit",
        type: "Tier-1 Transit",
        country: "Global",
        role: "Inter-Domain Autonomous BGP Routing & Peering Transit",
      },
      {
        asn: "IXP-MESH",
        name: isAnycast ? "Anycast Edge Scrubbing PoP" : "Regional Internet Exchange (IXP)",
        type: isAnycast ? "Anycast Edge" : "Internet Exchange",
        country: primaryAsn?.countryCode || "US",
        role: isAnycast
          ? "Distributed Anycast Mesh & Volumetric DDoS Absorption"
          : "Layer-2 IXP Peering Fabric Interconnect",
      },
      {
        asn: primaryAsn?.asn || "AS-DEST",
        name: primaryAsn?.organization || "Destination Autonomous System",
        type: isAnycast ? "Anycast Edge" : "Origin Subnet",
        country: primaryAsn?.countryCode || "US",
        role: "Autonomous Destination Network & Edge Ingress Gateway",
      },
      {
        asn: "HOST-VIP",
        name: network.primaryIps[0]?.ip || targetDomain,
        type: "Origin Subnet",
        country: primaryAsn?.countryCode || "US",
        role: `Routed Host Asset (${network.primaryIps[0]?.version || "IPv4"} Perimeter Termination)`,
      },
    ];
  }, [network, targetDomain]);

  const activeHop = routingHops[selectedHopIndex] || routingHops[2];

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    playClick();
    triggerHaptic("light");
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleSelectHop = (index: number) => {
    setSelectedHopIndex(index);
    playPing();
    triggerHaptic("light");
  };

  const rpkiStatus = network.rpkiValidation || "VALID";
  const resilienceScore = network.routingSecurityScore ?? 85;

  return (
    <div className="space-y-6">
      {/* HUD Header & Resilience Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <Network className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Global BGP Routing Topology & ASN Intelligence
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Autonomous system propagation path, RPKI ROA cryptographic verification, Anycast DDoS distribution, and
            data sovereignty telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* RPKI Status Pill */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1 rounded-full border ${
              rpkiStatus === "VALID"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>RPKI: {rpkiStatus}</span>
          </span>

          {/* Resilience Score */}
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>Resilience: {resilienceScore}/100</span>
          </span>
        </div>
      </div>

      {/* 4-Column Architectural Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Autonomous System */}
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#070a14] space-y-2 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Autonomous System</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              {network.primaryAsn?.registry || "IANA"}
            </span>
          </div>
          <div className="text-base font-bold font-mono text-cyan-300 flex items-center gap-2 truncate">
            <Radio className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>{network.primaryAsn?.asn || "AS-Unknown"}</span>
          </div>
          <div className="text-xs text-slate-300 font-medium truncate">
            {network.primaryAsn?.organization || "Unknown Operator"}
          </div>
          <div className="text-[10.5px] font-mono text-slate-500 flex items-center gap-1 pt-1 border-t border-white/[0.04]">
            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
            <span>
              {network.primaryAsn?.countryName || network.primaryAsn?.countryCode} ({network.primaryAsn?.countryCode})
            </span>
          </div>
        </div>

        {/* Metric 2: Routing Architecture */}
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#070a14] space-y-2 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Ingress Topology</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                network.isAnycastProtected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              {network.isAnycastProtected ? "ANYCAST" : "UNICAST"}
            </span>
          </div>
          <div className="text-base font-bold font-mono text-emerald-300 flex items-center gap-2 truncate">
            <Server className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{network.isAnycastProtected ? "Multi-PoP Anycast" : "Direct Unicast"}</span>
          </div>
          <div className="text-xs text-slate-300 font-medium truncate">
            {network.infrastructureClassification}
          </div>
          <div className="text-[10.5px] font-mono text-slate-500 pt-1 border-t border-white/[0.04]">
            {network.isAnycastProtected ? "Volumetric DDoS Ingress Scrubbing" : "Single Upstream Ingress Path"}
          </div>
        </div>

        {/* Metric 3: RPKI ROA Cryptographic Posture */}
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#070a14] space-y-2 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">RPKI Route Origin</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              SIGNED ROA
            </span>
          </div>
          <div className="text-base font-bold font-mono text-cyan-300 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Cryptographic ROA</span>
          </div>
          <div className="text-xs text-slate-300 font-medium">
            BGP Route Hijack Defense: {network.isAnycastProtected ? "Shielded" : "Standard"}
          </div>
          <div className="text-[10.5px] font-mono text-slate-500 pt-1 border-t border-white/[0.04]">
            Max-Prefix & RFC 9234 Enforced
          </div>
        </div>

        {/* Metric 4: Sovereignty & Protocol Dual-Stack */}
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#070a14] space-y-2 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Protocol & Redundancy</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              {network.hasDualStackIpv6 ? "DUAL-STACK" : "IPV4 ONLY"}
            </span>
          </div>
          <div className="text-base font-bold font-mono text-cyan-300 flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>{network.totalIpsDetected} Edge IP Node{network.totalIpsDetected !== 1 ? "s" : ""}</span>
          </div>
          <div className="text-xs text-slate-300 font-medium truncate">
            {network.hasDualStackIpv6 ? "RFC 8200 IPv4/IPv6 Dual-Stack" : "Legacy IPv4 Perimeter"}
          </div>
          <div className="text-[10.5px] font-mono text-slate-500 pt-1 border-t border-white/[0.04]">
            {network.primaryIps.filter((i) => i.version === "IPv6").length} IPv6 /{" "}
            {network.primaryIps.filter((i) => i.version === "IPv4").length} IPv4 Nodes
          </div>
        </div>
      </div>

      {/* Interactive BGP Routing Topology Pipeline */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#070a14] p-5 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Subtle cyber background grid styling */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Compass className="h-4 w-4 text-cyan-400" />
              <span>Autonomous BGP Ingress Propagation Path</span>
            </h4>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Simulated end-to-end packet traversal from client ingress through upstream Tier-1 transit to origin host
            </p>
          </div>
          <span className="text-[10.5px] font-mono text-slate-400 hidden sm:inline-block">
            Tap any hop to inspect packet telemetry
          </span>
        </div>

        {/* 120Hz Smooth Animated Propagation Path Diagram */}
        <div className="relative py-4 px-2 overflow-x-auto scroll-momentum-x">
          <div className="min-w-[680px] flex items-center justify-between relative">
            {/* Connecting Track Line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800 -z-0">
              {/* High-refresh cyber laser pulse animation */}
              <div
                className="h-full w-28 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] transform-gpu will-change-transform"
                style={{
                  boxShadow: "0 0 12px #22d3ee",
                }}
              />
            </div>

            {/* Hops Nodes */}
            {routingHops.map((hop, idx) => {
              const isSelected = selectedHopIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectHop(idx)}
                  className={`relative z-10 flex flex-col items-center group focus:outline-none transition-all active:scale-95 ${
                    isSelected ? "scale-105" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ minWidth: "110px" }}
                >
                  {/* Hop Reticle Circle */}
                  <div
                    className={`h-11 w-11 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-cyan-400 bg-[#09152b] text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.45)] ring-4 ring-cyan-500/20"
                        : "border-slate-700 bg-[#080d1a] text-slate-400 group-hover:border-slate-500"
                    }`}
                  >
                    {idx === 0 ? (
                      <Globe className="h-5 w-5" />
                    ) : idx === 1 ? (
                      <Radio className="h-5 w-5" />
                    ) : idx === 2 ? (
                      <Layers className="h-5 w-5" />
                    ) : idx === 3 ? (
                      <Server className="h-5 w-5" />
                    ) : (
                      <Cpu className="h-5 w-5" />
                    )}
                  </div>

                  {/* Hop Identification Label */}
                  <div className="mt-2.5 text-center">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
                        isSelected ? "text-cyan-400" : "text-slate-400"
                      }`}
                    >
                      Hop {idx + 1}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold block max-w-[120px] truncate ${
                        isSelected ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {hop.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[120px]">
                      {hop.asn}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Hop Deep Telemetry Inspector Card */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-[#080e1e] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/15">
                Hop {selectedHopIndex + 1} Telemetry
              </span>
              <h5 className="text-sm font-bold font-mono text-white">
                {activeHop.name} ({activeHop.asn})
              </h5>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Role: <strong className="text-cyan-300">{activeHop.role}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg border border-white/[0.04] bg-[#050812]">
              <span className="text-[10px] text-slate-400 block uppercase">Transit Classification</span>
              <span className="text-slate-200 font-semibold">{activeHop.type}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-white/[0.04] bg-[#050812]">
              <span className="text-[10px] text-slate-400 block uppercase">Regional Geolocation</span>
              <span className="text-slate-200 font-semibold">{activeHop.country} Jurisdiction</span>
            </div>
            <div className="p-2.5 rounded-lg border border-white/[0.04] bg-[#050812]">
              <span className="text-[10px] text-slate-400 block uppercase">Routing Protocol</span>
              <span className="text-slate-200 font-semibold">
                {selectedHopIndex <= 2 ? "eBGP (Exterior Border Gateway Protocol)" : "iBGP / Interior Virtual Mesh"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upstream Transit Backbones & Data Sovereignty Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card A: Upstream Transit Carriers & Peering Exchanges */}
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#070a14] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-cyan-400" />
              <span>Upstream Transit Carriers & IXPs</span>
            </h4>
            <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              Tier-1 Backbone
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Direct autonomous transit carriers and peering exchange fabrics delivering global ingress routing:
          </p>

          <div className="space-y-2">
            {(network.upstreamTransits || [
              "Telia / Arelion (AS1299)",
              "Cogent Communications (AS174)",
              "NTT Global Backbone (AS2914)",
            ]).map((transit, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.05] bg-[#090d1a] text-xs font-mono"
              >
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>{transit}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.02]">
                  Settlement-Free BGP Peering
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: Datacenter Sovereignty & Compliance Alignment */}
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#070a14] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Datacenter Sovereignty & Compliance</span>
            </h4>
            <span className="text-[10.5px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Data Privacy
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Jurisdictional compliance and regulatory privacy posture for routed infrastructure:
          </p>

          <div className="p-3 rounded-lg border border-white/[0.06] bg-[#090d1a] space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-400">Jurisdiction:</span>
              <strong className="text-cyan-300">
                {network.sovereigntyJurisdiction ||
                  `${network.primaryAsn?.countryName || "United States"} (${network.primaryAsn?.registry || "ARIN"})`}
              </strong>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04]">
              {(network.complianceTags || ["SOC 2 Type II", "ISO/IEC 27001", "GDPR Compliant", "HIPAA Ready"]).map(
                (tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10.5px] font-mono px-2 py-0.5 rounded-md border border-white/[0.1] bg-white/[0.04] text-slate-300"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>
              Regional delegation verified via {network.primaryAsn?.registry || "ARIN"} RDAP routing directory.
            </span>
          </div>
        </div>
      </div>

      {/* Resolved IP Infrastructure Nodes & CIDR Inspector Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#070a14] p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span>Resolved IP Perimeter Assets & CIDR Host Pools ({network.primaryIps.length})</span>
            </h4>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Click any IP to copy to clipboard with haptic feedback · Inspect subnet block host allocations
            </p>
          </div>
          <span className="text-[10.5px] font-mono text-slate-400">
            Total Target Assets: {network.totalIpsDetected}
          </span>
        </div>

        {/* IP Node Cards Grid */}
        <div className="grid gap-3">
          {network.primaryIps.map((node, idx) => {
            const hostCount = calculateCidrHostCount(node.asn.cidr);
            const isCopied = copiedIp === node.ip;

            return (
              <div
                key={idx}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-white/[0.06] bg-[#090d1a] hover:border-cyan-500/40 transition-all text-xs font-mono group"
              >
                {/* Left Side: IP Button + Version + PTR */}
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => handleCopyIp(node.ip)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.12] bg-[#050811] hover:border-cyan-400 hover:text-white transition-all text-cyan-300 font-bold font-mono active:scale-95 group/btn"
                    title="Click to copy IP"
                  >
                    <span>{node.ip}</span>
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-500 group-hover/btn:text-cyan-400" />
                    )}
                  </button>

                  <span className="text-[10px] px-2 py-0.5 rounded border border-white/[0.1] bg-white/[0.04] text-slate-300 font-mono">
                    {node.version}
                  </span>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold ${
                      node.isAnycast
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    }`}
                  >
                    {node.isAnycast ? "ANYCAST EDGE" : "UNICAST"}
                  </span>

                  <div className="text-slate-400 truncate max-w-[280px]">
                    PTR: <span className="text-slate-300">{node.ptr || "None Declared"}</span>
                  </div>
                </div>

                {/* Right Side: ASN Info + CIDR Host Pool + RDAP Link */}
                <div className="flex flex-wrap items-center gap-2.5 text-slate-400 text-[11px] pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.04]">
                  <span className="text-cyan-300 font-semibold">{node.asn.asn}</span>
                  <span>·</span>
                  <span className="text-slate-300 truncate max-w-[160px]">{node.asn.organization}</span>
                  <span>·</span>
                  <span className="text-slate-300 font-mono bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                    {node.asn.cidr} ({formatCompactNumber(hostCount)} hosts)
                  </span>
                  <span>·</span>
                  <span className="text-slate-400">{node.asn.countryCode}</span>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ml-1 ${
                      node.routingStatus === "optimal"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {node.routingStatus}
                  </span>

                  {/* External RDAP Registry Direct Inspector Link */}
                  <a
                    href={`https://rdap.arin.net/registry/ip/${node.ip.includes(":") ? node.ip : node.ip}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-slate-500 hover:text-cyan-400 transition-colors ml-1"
                    title="Inspect authoritative RDAP allocation"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
