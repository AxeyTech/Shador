"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, Compass, RotateCcw, Maximize2, Shield, Radio, MapPin } from "lucide-react";
import type { GeoIpLocation } from "@/lib/types/scanner";

interface TacticalCyberGlobeProps {
  locations: GeoIpLocation[];
  selectedLocation: GeoIpLocation | null;
  onSelectLocation?: (loc: GeoIpLocation) => void;
  className?: string;
}

// Compact, high-precision procedural world anchor land points (Lat, Lon)
// Covers major global landmasses with high fidelity
const WORLD_LAND_NODES: [number, number][] = [
  // North America
  [64, -152], [60, -135], [55, -120], [50, -100], [53, -80], [58, -65], [45, -75],
  [48, -122], [42, -124], [37, -122], [34, -118], [32, -114],
  [40, -105], [35, -90], [30, -90], [29, -95], [26, -98], [24, -102],
  [42, -71], [40, -74], [38, -77], [34, -78], [28, -81], [25, -80],
  [21, -89], [19, -99], [16, -93], [14, -87], [9, -80],

  // South America
  [10, -75], [5, -73], [1, -78], [-4, -80], [-12, -77], [-18, -70], [-23, -70],
  [-30, -71], [-37, -73], [-45, -74], [-53, -70], [-55, -67],
  [-35, -57], [-23, -43], [-13, -38], [-5, -35], [-3, -40], [-1, -48],
  [4, -52], [8, -60], [6, -67], [-15, -48], [-25, -57],

  // Europe & UK
  [51, -1], [53, -2], [56, -4], [58, -5], [50, -5],
  [44, -1], [43, 3], [41, 1], [37, -3], [36, -6], [39, -9], [43, -8],
  [48, 2], [50, 4], [52, 5], [54, 10], [56, 12],
  [58, 8], [61, 8], [63, 10], [68, 14], [70, 24], [64, 20], [60, 18],
  [52, 13], [50, 14], [48, 16], [45, 12], [42, 13], [38, 15], [38, 23],
  [40, 22], [45, 20], [48, 24], [53, 23], [56, 24],

  // Africa
  [36, -5], [34, -6], [32, -9], [28, -13], [21, -17], [15, -17], [10, -14],
  [5, -4], [4, 2], [4, 7], [4, 9], [2, 10], [-5, 12], [-12, 14], [-17, 12],
  [-22, 14], [-29, 17], [-34, 18], [-34, 26], [-30, 31], [-25, 33], [-19, 36],
  [-11, 40], [-3, 40], [4, 45], [11, 51], [12, 43], [15, 40], [22, 38],
  [27, 34], [31, 32], [32, 24], [32, 13], [36, 10], [36, 1],
  [-18, 47], // Madagascar

  // Middle East & West Asia
  [31, 35], [28, 34], [25, 37], [22, 39], [15, 42], [13, 45], [15, 52],
  [22, 59], [25, 56], [27, 50], [30, 48], [33, 44], [35, 39],
  [38, 44], [36, 52], [32, 53], [28, 56], [29, 60],

  // India & South Asia
  [34, 74], [31, 75], [28, 77], [24, 72], [21, 70], [19, 73], [15, 74],
  [10, 76], [8, 77], [10, 79], [13, 80], [16, 82], [18, 83], [21, 87],
  [22, 89], [26, 89], [26, 92], [28, 85], [25, 82], [22, 79], [18, 78],
  [7, 80], // Sri Lanka

  // East & Central Asia, Russia
  [55, 38], [56, 49], [53, 50], [51, 58], [47, 52], [43, 60],
  [45, 68], [43, 76], [48, 80], [52, 85], [56, 85], [58, 92],
  [60, 100], [64, 100], [68, 90], [70, 70], [65, 60], [60, 60],
  [55, 105], [52, 105], [48, 115], [44, 115], [40, 116], [36, 120],
  [32, 121], [25, 118], [22, 114], [21, 108], [16, 108], [10, 106],
  [38, 127], [35, 129], [35, 139], [38, 141], [43, 144], [34, 133],

  // Southeast Asia & Oceania
  [5, 100], [1, 104], [-2, 102], [-6, 106], [-7, 110], [-8, 115],
  [1, 114], [-3, 114], [14, 121], [10, 123], [7, 125],
  [-12, 131], [-15, 124], [-21, 115], [-26, 113], [-32, 116], [-35, 118],
  [-32, 133], [-36, 137], [-38, 145], [-34, 151], [-28, 153], [-20, 149],
  [-14, 144], [-12, 136],
  [-37, 175], [-41, 174], [-45, 170], // New Zealand
];

export function TacticalCyberGlobe({
  locations = [],
  selectedLocation,
  onSelectLocation,
  className = "",
}: TacticalCyberGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [rotation, setRotation] = useState(0); // Longitude angle in degrees
  const [tilt, setTilt] = useState(15); // Latitude tilt angle in degrees
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [radarPulse, setRadarPulse] = useState(0);
  const [satelliteAngle, setSatelliteAngle] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  // Active target coords
  const targetLat = selectedLocation?.latitude ?? (locations[0]?.latitude || 20);
  const targetLon = selectedLocation?.longitude ?? (locations[0]?.longitude || 77);

  // Auto-focus smoothly onto target coordinate
  const handleLockTarget = useCallback(() => {
    // To face camera, target longitude should be rotated so: targetLon + rot = 90 (or 270)
    const desiredRot = (90 - targetLon + 360) % 360;
    setRotation(desiredRot);
    setTilt(Math.max(-25, Math.min(35, targetLat * 0.4)));
  }, [targetLat, targetLon]);

  // Initial focus on mount
  useEffect(() => {
    handleLockTarget();
  }, [handleLockTarget]);

  // Continuous animation loop: 120/144Hz fluid
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (isRotating && !isDragging) {
        setRotation((prev) => (prev + delta * 12) % 360);
      }

      setRadarPulse((prev) => (prev + delta * 2.5) % (Math.PI * 2));
      setSatelliteAngle((prev) => (prev + delta * 35) % 360);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRotating, isDragging]);

  // Canvas render pass
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Retina & High-DPI handling
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.max(10, Math.min(width, height) * 0.38);

    // 1. Atmosphere Radial Bloom
    const atmosphereGlow = ctx.createRadialGradient(
      centerX,
      centerY,
      Math.max(1, radius * 0.7),
      centerX,
      centerY,
      Math.max(2, radius * 1.35)
    );
    atmosphereGlow.addColorStop(0, "rgba(0, 240, 255, 0.08)");
    atmosphereGlow.addColorStop(0.5, "rgba(0, 240, 255, 0.03)");
    atmosphereGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = atmosphereGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(2, radius * 1.35), 0, Math.PI * 2);
    ctx.fill();

    // 2. Globe Dark Sphere Core
    const sphereGrad = ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      Math.max(1, radius * 0.1),
      centerX,
      centerY,
      Math.max(2, radius)
    );
    sphereGrad.addColorStop(0, "#081329");
    sphereGrad.addColorStop(0.7, "#030612");
    sphereGrad.addColorStop(1, "#010308");

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(2, radius), 0, Math.PI * 2);
    ctx.fill();

    // Globe Silhouette Edge Rim
    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Helper: 3D Spherical to 2D Screen projection
    const project3D = (lat: number, lon: number): { x: number; y: number; z: number; visible: boolean } => {
      const latRad = (lat * Math.PI) / 180;
      const lonRad = ((lon + rotation) * Math.PI) / 180;
      const tiltRad = (tilt * Math.PI) / 180;

      // Un-tilted coordinates
      const x0 = radius * Math.cos(latRad) * Math.sin(lonRad);
      const y0 = -radius * Math.sin(latRad);
      const z0 = radius * Math.cos(latRad) * Math.cos(lonRad);

      // Apply tilt around X axis
      const y1 = y0 * Math.cos(tiltRad) - z0 * Math.sin(tiltRad);
      const z1 = y0 * Math.sin(tiltRad) + z0 * Math.cos(tiltRad);

      return {
        x: centerX + x0,
        y: centerY + y1,
        z: z1,
        visible: z1 > 0,
      };
    };

    // 3. Graticule Lines (Latitudes & Longitudes)
    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.lineWidth = 1;

    // Latitudes: -60, -30, 0 (Equator), 30, 60
    [-60, -30, 0, 30, 60].forEach((lat) => {
      ctx.beginPath();
      let first = true;
      for (let lon = -180; lon <= 180; lon += 6) {
        const p = project3D(lat, lon);
        if (p.visible) {
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    });

    // Longitudes: Every 45 degrees
    for (let lon = -180; lon < 180; lon += 45) {
      ctx.beginPath();
      let first = true;
      for (let lat = -80; lat <= 80; lat += 4) {
        const p = project3D(lat, lon);
        if (p.visible) {
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // 4. Draw Procedural Continents (Vector Land Nodes)
    WORLD_LAND_NODES.forEach(([lat, lon]) => {
      const p = project3D(lat, lon);
      if (p.visible) {
        const depth = p.z / radius; // 0 to 1
        const alpha = 0.25 + depth * 0.65;
        const dotSize = Math.max(0.5, 1.2 + depth * 1.4);

        ctx.fillStyle = `rgba(0, 240, 255, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 5. Orbital Satellite Trajectory Ring
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, Math.max(2, radius * 1.28), Math.max(1, radius * 0.45), Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Satellite Position
    const satRad = (satelliteAngle * Math.PI) / 180;
    const satOrbitX = centerX + Math.cos(satRad) * radius * 1.28 * Math.cos(Math.PI / 6) - Math.sin(satRad) * radius * 0.45 * Math.sin(Math.PI / 6);
    const satOrbitY = centerY + Math.cos(satRad) * radius * 1.28 * Math.sin(Math.PI / 6) + Math.sin(satRad) * radius * 0.45 * Math.cos(Math.PI / 6);

    ctx.fillStyle = "#ff003b";
    ctx.beginPath();
    ctx.arc(satOrbitX, satOrbitY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 0, 59, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(satOrbitX, satOrbitY, 7, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Perimeter Target Nodes & Beacons
    locations.forEach((loc, idx) => {
      const isSelected = selectedLocation ? selectedLocation.ip === loc.ip : idx === 0;
      const p = project3D(loc.latitude, loc.longitude);

      if (p.visible) {
        const depth = Math.max(0.2, p.z / radius);

        // A. Pulsing Radar Wave Rings (Front-facing)
        const pulseProgress = ((radarPulse % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2); // strictly 0 to 1
        const pulseRadius = Math.max(0.1, 4 + pulseProgress * 14); // 4px to 18px (always positive)
        const pulseAlpha = Math.max(0, 1 - pulseProgress);

        if (pulseRadius > 0 && pulseAlpha > 0.02) {
          ctx.strokeStyle = isSelected
            ? `rgba(0, 240, 255, ${(pulseAlpha * depth).toFixed(2)})`
            : `rgba(244, 63, 94, ${(pulseAlpha * depth).toFixed(2)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // B. Solid Core Beacon
        ctx.fillStyle = isSelected ? "#00f0ff" : "#f43f5e";
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSelected ? 4.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // C. Elevated Vertical Radar Pin
        ctx.strokeStyle = isSelected ? "#00f0ff" : "#f43f5e";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - 18 * depth);
        ctx.stroke();

        // D. Top Pin Flag / Diamond
        ctx.fillStyle = isSelected ? "#ffffff" : "#fecdd3";
        ctx.beginPath();
        ctx.arc(p.x, p.y - 18 * depth, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // E. Tactical HUD Target Label
        if (isSelected) {
          ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
          const label = `${loc.flagEmoji} ${loc.city || loc.countryCode} [${loc.countryCode}]`;
          const textWidth = ctx.measureText(label).width;

          // Pill Background
          ctx.fillStyle = "rgba(4, 9, 26, 0.85)";
          ctx.strokeStyle = "rgba(0, 240, 255, 0.6)";
          ctx.lineWidth = 1;
          const boxX = p.x - textWidth / 2 - 8;
          const boxY = p.y - 38 * depth;

          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(boxX, boxY, textWidth + 16, 18, 6);
          } else {
            ctx.rect(boxX, boxY, textWidth + 16, 18);
          }
          ctx.fill();
          ctx.stroke();

          // Text Label
          ctx.fillStyle = "#00f0ff";
          ctx.fillText(label, p.x - textWidth / 2, boxY + 13);
        }
      } else {
        // Back of globe indicator (faded ghost marker)
        ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }, [rotation, tilt, radarPulse, satelliteAngle, locations, selectedLocation]);

  // Touch and Mouse Drag handlers for 360 degree rotation
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unavailable
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setRotation((prev) => (prev + dx * 0.4 + 360) % 360);
    // Invert dy so dragging UP pulls the globe UP, and dragging DOWN pulls the globe DOWN (natural 1:1 direct tracking)
    setTilt((prev) => Math.max(-55, Math.min(55, prev - dy * 0.35)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore if pointer capture unavailable
    }
  };

  return (
    <div className={`relative flex flex-col rounded-2xl bg-[#030612] border border-cyan-500/25 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.8)] ${className}`}>
      {/* Top Specular Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#00f0ff]" />

      {/* Globe Canvas Viewport */}
      <div className="relative w-full h-[280px] sm:h-[340px] md:h-[380px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full touch-none"
        />

        {/* Top Left Overlay: Orbital Recon Telemetry */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#050814]/90 border border-white/10">
            <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
              3D Orbital Telemetry
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/5 w-fit">
            Rot: {Math.round(rotation)}° • Tilt: {Math.round(tilt)}°
          </div>
        </div>

        {/* Top Right Overlay: Controls Pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {/* Lock / Center Target Button */}
          <button
            onClick={handleLockTarget}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-[11px] font-mono font-semibold shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all active:scale-95"
            title="Rotate & Center Globe on Active Server Target"
          >
            <Compass className="h-3.5 w-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Center Target</span>
          </button>

          {/* Play/Pause Rotation */}
          <button
            onClick={() => setIsRotating((prev) => !prev)}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95"
            title={isRotating ? "Pause Orbit" : "Resume Orbit"}
          >
            {isRotating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>
    </div>
  );
}
