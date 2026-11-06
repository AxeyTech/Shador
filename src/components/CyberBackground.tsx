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

    const isMobile = width < 768;
    const particleCount = isMobile ? 24 : 48;
    const maxDistance = isMobile ? 80 : 130;
    const mouseRadius = 140;

    let mouseX = -1000;
    let mouseY = -1000;

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.40,
        vy: (Math.random() - 0.5) * 0.40,
        radius: Math.random() * 1.4 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.45 + 0.2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    let isDocumentVisible = true;
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      if (isDocumentVisible) {
        lastTime = performance.now();
        render(lastTime);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    let lastTime = performance.now();

    const render = (_currentTime: number) => {
      if (!isDocumentVisible) return;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw interconnected filament lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.16;
            const isRedFilament = p1.color.startsWith("#f") || p1.color.startsWith("#ff") || p2.color.startsWith("#f") || p2.color.startsWith("#ff");
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

        // Mouse interactive evasion / attraction
        const mouseDx = p1.x - mouseX;
        const mouseDy = p1.y - mouseY;
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        if (mouseDist < mouseRadius) {
          const force = (1 - mouseDist / mouseRadius) * 1.5;
          p1.x += (mouseDx / mouseDist) * force;
          p1.y += (mouseDy / mouseDist) * force;
        }

        // Movement update
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Screen boundary rebound
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Deep Obsidian Stealth Base with Quad-Spectrum Nebula Architecture */}
      <div className="absolute inset-0 bg-[#010204]">
        {/* Top-Right Quantum Cyan & Sapphire Core */}
        <div className="absolute -top-[15%] right-[5%] w-[750px] h-[550px] rounded-full bg-gradient-to-bl from-cyan-500/14 via-blue-600/08 to-transparent blur-[140px] pointer-events-none" />

        {/* Top-Left Crimson Threat Core Flare */}
        <div className="absolute top-[5%] -left-[120px] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-rose-600/13 via-crimson-600/08 to-transparent blur-[150px] pointer-events-none" />

        {/* Center Crisp Specular White Horizon */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-white/[0.015] blur-[110px] pointer-events-none" />

        {/* Bottom Horizon Deep Obsidian Anchor */}
        <div className="absolute -bottom-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-blue-950/20 blur-[130px] pointer-events-none" />
      </div>

      {/* 2. Tactical Concentric Radar & Orbital Scan Rings */}
      <div className="absolute top-[280px] sm:top-[320px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] pointer-events-none flex items-center justify-center opacity-40 sm:opacity-55">
        {/* Outer Orbital Compass Ring with White & Cyan Markers */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/25 animate-spin-slow border-dashed [stroke-dasharray:10_15]">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-[9px] font-mono text-cyan-300 tracking-widest bg-[#010204] px-1 font-bold">000° N</span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-[9px] font-mono text-rose-400 tracking-widest bg-[#010204] px-1 font-bold">180° S</span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 text-[9px] font-mono text-white tracking-widest bg-[#010204] px-1 font-bold">270° W</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 text-[9px] font-mono text-cyan-300 tracking-widest bg-[#010204] px-1 font-bold">090° E</span>
        </div>

        {/* Middle Tactical Radar Ring with Subtle Crimson Tint */}
        <div className="absolute w-[520px] h-[520px] rounded-full border border-rose-500/20 animate-spin-reverse-slow border-dotted" />

        {/* Inner Reconnaissance Perimeter Ring */}
        <div className="absolute w-[300px] h-[300px] rounded-full border border-cyan-400/30 animate-radar-pulse" />

        {/* Center Target Core Ring with Dual Cyan & Crimson Glow and Geometric Cyber-Daemon Horns */}
        <div className="absolute w-[140px] h-[140px] rounded-full border border-cyan-400/40 bg-gradient-to-br from-cyan-500/[0.05] to-rose-500/[0.05] shadow-[0_0_25px_rgba(0,240,255,0.2)] flex items-center justify-center">
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

        {/* Continuous 360° Radar Sweep Beam */}
        <div className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none [background:conic-gradient(from_0deg,transparent_0deg,rgba(0,240,255,0.12)_45deg,rgba(244,63,94,0.08)_50deg,transparent_58deg)]" />

        {/* Cardinal Crosshair Grid Axes: Cyan Horizontal & Crimson Vertical */}
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-rose-500/25 to-transparent" />
      </div>

      {/* 3. HTML5 Interactive Particle Network Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-auto"
        style={{ mixBlendMode: "screen", opacity: mounted ? 1 : 0, transition: "opacity 0.6s ease" }}
      />

      {/* 4. Fine Tactical Grid Matrix */}
      <div className="absolute inset-0 bg-tactical-grid pointer-events-none opacity-40" />
    </div>
  );
}
