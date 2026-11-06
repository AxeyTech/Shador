"use client";

import React, { useState } from "react";
import {
  Globe,
  MapPin,
  Server,
  Radio,
  Compass,
  Layers,
  Sparkles,
  Maximize2,
  Crosshair,
} from "lucide-react";
import type { GeoIpLocation, AsnInfo } from "@/lib/types/scanner";
import { TacticalCyberGlobe } from "./TacticalCyberGlobe";

interface GeoLocationRadarProps {
  locations?: GeoIpLocation[];
  primaryAsn?: AsnInfo | null;
  targetDomain: string;
}

export function GeoLocationRadar({
  locations = [],
  primaryAsn,
  targetDomain,
}: GeoLocationRadarProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visualMode, setVisualMode] = useState<"globe" | "radar">("globe");

  // If no locations array, construct a primary fallback from primaryAsn
  const displayLocations: GeoIpLocation[] =
    locations.length > 0
      ? locations
      : primaryAsn
      ? [
          {
            ip: primaryAsn.cidr?.split("/")[0] || "Target IP",
            countryName: primaryAsn.countryName || "Global Distributed Edge",
            countryCode: primaryAsn.countryCode || "US",
            flagEmoji: primaryAsn.flagEmoji || "🌐",
            regionName: primaryAsn.region || "Global",
            city: primaryAsn.city || "Edge PoP",
            latitude: primaryAsn.latitude || 37.7749,
            longitude: primaryAsn.longitude || -122.4194,
            timezone: primaryAsn.timezone || "UTC",
            isp: primaryAsn.organization || "Autonomous Network",
            org: primaryAsn.organization || "Autonomous Network",
            asn: primaryAsn.asn || "AS-Unknown",
          },
        ]
      : [];

  const current = displayLocations[selectedIdx] || displayLocations[0];

  if (!current) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#090d1a] to-[#04060c] border border-cyan-500/20 p-4 sm:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.7)] transition-all duration-300">
      {/* Background Cybernetic Ambient Glow */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Global Geo-IP &amp; Tactical 3D Telemetry
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                SATELLITE LOCK
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Target: <span className="text-cyan-300 font-bold">{targetDomain}</span> • Physical Data Center &amp; BGP Edge
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Multi-Node Selector */}
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* Mode Toggle (3D Globe vs 2D Radar) */}
          <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10">
            <button
              onClick={() => setVisualMode("globe")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                visualMode === "globe"
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span>3D Globe</span>
            </button>
            <button
              onClick={() => setVisualMode("radar")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                visualMode === "radar"
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Crosshair className="h-3.5 w-3.5 text-rose-400" />
              <span>2D Reticle</span>
            </button>
          </div>

          {/* Multi-Node Selector Pills */}
          {displayLocations.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
              {displayLocations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedIdx === idx
                      ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-white"
                  }`}
                >
                  <span className="mr-1">{loc.flagEmoji}</span>
                  {loc.city || loc.countryCode}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Canvas Display Section */}
      <div className="mt-5">
        {visualMode === "globe" ? (
          <TacticalCyberGlobe
            locations={displayLocations}
            selectedLocation={current}
            onSelectLocation={(loc) => {
              const idx = displayLocations.findIndex((l) => l.ip === loc.ip);
              if (idx !== -1) setSelectedIdx(idx);
            }}
          />
        ) : (
          /* 2D Concentric Tactical Radar Display */
          <div className="relative rounded-2xl bg-[#030612] border border-cyan-500/25 p-6 flex flex-col items-center justify-center text-center overflow-hidden h-[300px] sm:h-[340px]">
            {/* Concentric Radar Rings */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
              <div className="absolute inset-6 rounded-full border border-cyan-500/30" />
              <div className="absolute inset-12 rounded-full border border-cyan-500/40" />
              <div className="absolute inset-16 rounded-full border border-cyan-500/60" />

              {/* Radar Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1px] bg-cyan-500/30" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-full w-[1px] bg-cyan-500/30" />
              </div>

              {/* Rotating Radar Sweep Blade */}
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-cyan-400/25 to-transparent pointer-events-none animate-spin"
                style={{ animationDuration: "4s" }}
              />

              {/* Center Pulsing Lock */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="h-11 w-11 rounded-full bg-cyan-500/30 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.8)] animate-pulse">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-mono font-bold text-white tracking-wider uppercase">
                {current.flagEmoji} {current.city || "Edge"} • {current.countryName}
              </div>
              <div className="text-xs font-mono text-cyan-300/90 mt-1">
                Radar Lock: {current.latitude !== 0 ? `${current.latitude.toFixed(4)}°, ${current.longitude.toFixed(4)}°` : "Anycast"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Telemetry Details Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
        {/* 1. Country & National Flag */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" /> Physical Jurisdiction
            </span>
            <span className="text-xl leading-none">{current.flagEmoji}</span>
          </div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <span className="truncate">{current.countryName}</span>
            <span className="text-xs font-mono text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 shrink-0">
              {current.countryCode}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono truncate">
            City/Region: <span className="text-cyan-300">{current.city || "Edge PoP"}</span>
            {current.regionName ? `, ${current.regionName}` : ""}
          </div>
        </div>

        {/* 2. Coordinates & Radar Fix */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-cyan-400" /> Geo Coordinates
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
              WGS 84
            </span>
          </div>
          <div className="text-base font-bold text-white font-mono truncate">
            {current.latitude !== 0
              ? `${current.latitude.toFixed(4)}°, ${current.longitude.toFixed(4)}°`
              : "Anycast Edge Mesh"}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono truncate">
            Timezone: <span className="text-cyan-300">{current.timezone || "UTC"}</span>
          </div>
        </div>

        {/* 3. Autonomous System & ISP */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-cyan-400" /> Carrier / ISP Network
            </span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded">
              BGP Fabric
            </span>
          </div>
          <div className="text-sm font-bold text-white truncate" title={current.isp}>
            {current.isp || current.org || "Autonomous Infrastructure"}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono truncate">
            ASN: <span className="text-cyan-300">{current.asn}</span>
          </div>
        </div>

        {/* 4. Resolved IP Asset */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-cyan-400" /> Routed Endpoint IP
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
              ONLINE
            </span>
          </div>
          <div className="text-base font-bold text-cyan-200 font-mono tracking-tight truncate">
            {current.ip}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono truncate">
            Protocol: <span className="text-cyan-300">{current.ip.includes(":") ? "IPv6" : "IPv4"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
