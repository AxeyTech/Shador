"use client";

import React, { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // High-tech stealth quad-spectrum palette: Crimson Red + Electric Cyan + Deep Sapphire + Pure Crisp White
    const colors = ["#00f0ff", "#38bdf8", "#2563eb", "#ff1744", "#f43f5e", "#ffffff", "#e0e7ff"];

    const isMobile = width < 768 || window.matchMedia("(pointer: coarse)").matches;
    const particleCount = isMobile ? 18 : 44;
    const maxDistance = isMobile ? 85 : 130;
    const maxDistSq = maxDistance * maxDistance;
    const mouseRadius = 140;
    const mouseRadiusSq = mouseRadius * mouseRadius;

    let mouseX = -1000;
    let mouseY = -1000;

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.4 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.45 + 0.2,
      });
    }

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw interconnected filament lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / maxDistance) * 0.16;
            const isRedFilament =
              p1.color.startsWith("#f") || p2.color.startsWith("#f");
            ctx.strokeStyle = isRedFilament
              ? `rgba(244, 63, 94, ${alpha * 1.1})`
              : `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        if (!isMobile) {
          // Mouse interactive evasion / attraction on pointer devices only
          const mouseDx = p1.x - mouseX;
          const mouseDy = p1.y - mouseY;
          const mouseDistSq = mouseDx * mouseDx + mouseDy * mouseDy;
          if (mouseDistSq > 0 && mouseDistSq < mouseRadiusSq) {
            const mouseDist = Math.sqrt(mouseDistSq);
            const force = (1 - mouseDist / mouseRadius) * 1.5;
            p1.x += (mouseDx / mouseDist) * force;
            p1.y += (mouseDy / mouseDist) * force;
          }

          p1.x += p1.vx;
          p1.y += p1.vy;

          if (p1.x < 0 || p1.x > width) p1.vx *= -1;
          if (p1.y < 0 || p1.y > height) p1.vy *= -1;
        }

        // Draw particle node
        ctx.beginPath();
        ctx.globalAlpha = p1.alpha;
        ctx.fillStyle = p1.color;
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fill();

        // Soft tactical glow
        ctx.beginPath();
        ctx.globalAlpha = p1.alpha * 0.22;
        ctx.arc(p1.x, p1.y, p1.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (isMobile) drawFrame();
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // On mobile/touch devices, render a crisp zero-overhead tactical constellation once
    // instead of a continuous 60-144Hz loop so touch scrolling remains 100% tear-free.
    if (isMobile) {
      drawFrame();
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    let isDocumentVisible = true;
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      if (isDocumentVisible) {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const render = () => {
      if (!isDocumentVisible) return;
      drawFrame();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{ contain: "strict" }}
    >
      {/* 1. Zero-Filter Pure Gradient Quad-Spectrum Atmosphere (0ms GPU blur overhead) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#010204",
          backgroundImage: [
            "radial-gradient(ellipse 60% 45% at 72% 8%, rgba(6, 182, 212, 0.12), rgba(37, 99, 235, 0.06) 45%, transparent 72%)",
            "radial-gradient(circle 550px at 8% 28%, rgba(225, 29, 72, 0.11), rgba(244, 63, 94, 0.04) 45%, transparent 72%)",
            "radial-gradient(ellipse 50% 30% at 50% 25%, rgba(255, 255, 255, 0.02), transparent 70%)",
            "radial-gradient(ellipse 75% 40% at 50% 98%, rgba(30, 58, 138, 0.16), transparent 70%)",
          ].join(", "),
        }}
      />

      {/* 2. Tactical Concentric Radar & Orbital Scan Rings */}
      <div className="absolute top-[280px] sm:top-[320px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] sm:w-[760px] h-[560px] sm:h-[760px] pointer-events-none flex items-center justify-center opacity-35 sm:opacity-50">
        {/* Outer Orbital Compass Ring with White & Cyan Markers */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 md:animate-spin-slow border-dashed [stroke-dasharray:10_15]">
          <span className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-[9px] font-mono text-cyan-300 tracking-widest bg-[#010204] px-1 font-bold">000° N</span>
          <span className="hidden sm:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-[9px] font-mono text-rose-400 tracking-widest bg-[#010204] px-1 font-bold">180° S</span>
          <span className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 text-[9px] font-mono text-white tracking-widest bg-[#010204] px-1 font-bold">270° W</span>
          <span className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 text-[9px] font-mono text-cyan-300 tracking-widest bg-[#010204] px-1 font-bold">090° E</span>
        </div>

        {/* Middle Tactical Radar Ring with Subtle Crimson Tint */}
        <div className="absolute w-[380px] sm:w-[520px] h-[380px] sm:h-[520px] rounded-full border border-rose-500/20 md:animate-spin-reverse-slow border-dotted" />

        {/* Inner Reconnaissance Perimeter Ring */}
        <div className="absolute w-[240px] sm:w-[300px] h-[240px] sm:h-[300px] rounded-full border border-cyan-400/25 md:animate-radar-pulse" />

        {/* Center Target Core Ring with Dual Cyan & Crimson Glow and Geometric Cyber-Daemon Horns */}
        <div className="absolute w-[124px] sm:w-[140px] h-[124px] sm:h-[140px] rounded-full border border-cyan-400/35 bg-gradient-to-br from-cyan-500/[0.04] to-rose-500/[0.04] flex items-center justify-center">
          {/* Cyber-Daemon Precision Geometric Targeting Reticle */}
          <svg className="w-24 h-24 text-rose-500/60 pointer-events-none" viewBox="0 0 100 100" fill="none">
            {/* Top-Left Predator Horn */}
            <path d="M25 15 L35 25 L35 35 L25 35" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.7" />
            <circle cx="25" cy="15" r="1.5" fill="#00f0ff" />
            {/* Top-Right Predator Horn */}
            <path d="M75 15 L65 25 L65 35 L75 35" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.7" />
            <circle cx="75" cy="15" r="1.5" fill="#f43f5e" />
            {/* Bottom-Left Predator Fang */}
            <path d="M25 85 L35 75 L35 65 L25 65" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.7" />
            <circle cx="25" cy="85" r="1.5" fill="#00f0ff" />
            {/* Bottom-Right Predator Fang */}
            <path d="M75 85 L65 75 L65 65 L75 65" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.7" />
            <circle cx="75" cy="85" r="1.5" fill="#f43f5e" />
            {/* Center Optic Targeting Reticle */}
            <circle cx="50" cy="50" r="14" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5" />
            <circle cx="50" cy="50" r="3" fill="#f43f5e" />
          </svg>
        </div>

        {/* Continuous 360° Radar Sweep Beam (Desktop Only for Zero Mobile GPU Thrash) */}
        <div className="hidden md:block absolute inset-0 rounded-full animate-radar-sweep pointer-events-none [background:conic-gradient(from_0deg,transparent_0deg,rgba(0,240,255,0.12)_45deg,rgba(244,63,94,0.08)_50deg,transparent_58deg)]" />

        {/* Cardinal Crosshair Grid Axes: Cyan Horizontal & Crimson Vertical */}
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-rose-500/20 to-transparent" />
      </div>

      {/* 3. HTML5 Particle Network Canvas (Zero mixBlendMode Overhead) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease" }}
      />

      {/* 4. Fine Tactical Grid Matrix */}
      <div className="absolute inset-0 bg-tactical-grid pointer-events-none opacity-35" />
    </div>
  );
}
