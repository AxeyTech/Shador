"use client";

import "@xyflow/react/dist/style.css";
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  RootNode,
  SubdomainNode,
  MxNode,
  NsNode,
  TlsNode,
  IpNode,
} from "./nodes/CustomNodes";
import type { GraphTopology, TopologyNodeData } from "@/lib/types/scanner";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Hand,
  Lock,
  X,
  Copy,
  Check,
  Shield,
  AlertTriangle,
  Globe,
  Mail,
  Server,
  Network,
  Radio,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Crosshair,
  Flame,
  ChevronsUpDown,
  Zap,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";
import { InteractiveAttackArena } from "./InteractiveAttackArena";
import { generateNodeSimulation } from "@/lib/simulation/killchain-engine";
import type { NodeAttackSimulation } from "@/lib/types/scanner";

interface TopologyCanvasProps {
  topology: GraphTopology;
  domain?: string;
  fullHeight?: boolean;
}

interface SimVector {
  step: number;
  title: string;
  mitreId: string;
  technique: string;
  targetType: "root" | "mx" | "subdomain" | "tls" | "ip";
  description: string;
  adversaryAction: string;
}

const ATTACK_VECTORS: SimVector[] = [
  {
    step: 1,
    title: "Apex Discovery & DNS Reconnaissance",
    mitreId: "T1584.004",
    technique: "DNS Zone Walking & Boundary Enumeration",
    targetType: "root",
    description: "Adversary probes root DNS records, authoritative nameservers, and sub-delegations to establish external perimeter footprint.",
    adversaryAction: "Harvesting authoritative NS cluster, SOA serials, and DNSSEC validation posture.",
  },
  {
    step: 2,
    title: "Mail Relay Hijack & SPF/DMARC Forgery",
    mitreId: "T1566.002",
    technique: "Spearphishing Link / Mail Forgery",
    targetType: "mx",
    description: "Evaluating email authentication policies for direct spoofing vulnerabilities or permissive softfail (~all) rules.",
    adversaryAction: "Testing MX gateway spoofability and mail receiver policy bypass.",
  },
  {
    step: 3,
    title: "Orphaned CNAME & Subdomain Takeover",
    mitreId: "T1584.004",
    technique: "Subdomain Hijacking (RFC 1034)",
    targetType: "subdomain",
    description: "Scanning dangling aliases pointing to decommissioned cloud buckets, GitHub Pages, or external edge endpoints.",
    adversaryAction: "Attempting takeover claim on dangling canonical name pointers.",
  },
  {
    step: 4,
    title: "Cryptographic Downgrade & MITM Intercept",
    mitreId: "T1557.002",
    technique: "Adversary-in-the-Middle (AiTM)",
    targetType: "tls",
    description: "Inspecting cipher negotiation, legacy protocol support (TLS 1.0/1.1), and certificate trust chain anomalies.",
    adversaryAction: "Analyzing cryptographic strength, self-signed warnings, and cipher degradation.",
  },
  {
    step: 5,
    title: "Autonomous ASN Origin & Edge Ingress",
    mitreId: "T1190",
    technique: "Exploit Public-Facing Application",
    targetType: "ip",
    description: "Resolving underlying BGP Autonomous System Number, origin IP addresses, and bypass routes around CDN/WAF defenses.",
    adversaryAction: "Pinpointing origin server IP coordinates to bypass reverse-proxy WAF filtering.",
  },
];

export function TopologyCanvas({ topology, domain, fullHeight = false }: TopologyCanvasProps) {
  const { playClick, playScanDispatch, playPing } = useTacticalAudio();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // Attack Path Simulator State
  const [isSimActive, setIsSimActive] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [isSimPlaying, setIsSimPlaying] = useState(false);

  // Red vs Blue Attack Arena State
  const [arenaSimulation, setArenaSimulation] = useState<NodeAttackSimulation | null>(null);
  const [isArenaOpen, setIsArenaOpen] = useState(false);

  const rootDomain = useMemo(() => {
    if (domain) return domain;
    const root = topology.nodes.find((n) => n.type === "root");
    return root?.data.label || "target.com";
  }, [domain, topology.nodes]);

  const nodeTypes = useMemo(
    () => ({
      root: RootNode,
      subdomain: SubdomainNode,
      mx: MxNode,
      ns: NsNode,
      tls: TlsNode,
      ip: IpNode,
    }),
    []
  );

  const initialNodes: Node[] = useMemo(() => {
    return topology.nodes.map((n) => ({
      id: n.id,
      type: n.type || "root",
      position: n.position,
      data: { ...n.data },
    }));
  }, [topology.nodes]);

  const initialEdges: Edge[] = useMemo(() => {
    return topology.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.animated,
      style: {
        strokeWidth: 1.5,
        ...e.style,
      },
    }));
  }, [topology.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isPanActive, setIsPanActive] = useState(true);

  // Synchronize canvas topology nodes and edges whenever new reconnaissance data arrives
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNode(null);
    if (flowInstanceRef.current) {
      setTimeout(() => {
        flowInstanceRef.current?.fitView({ padding: 0.25, duration: 400 });
      }, 50);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Reset simulation and restore original node/edge visual state
  const exitSimulation = useCallback(() => {
    setIsSimActive(false);
    setIsSimPlaying(false);
    setSimStep(0);
    setNodes(initialNodes);
    setEdges(initialEdges);
    playClick();
  }, [initialNodes, initialEdges, playClick, setNodes, setEdges]);

  // Focus a specific simulation vector on the canvas
  const focusVector = useCallback(
    (stepIndex: number) => {
      const vector = ATTACK_VECTORS[stepIndex];
      if (!vector) return;

      // Identify corresponding target node
      let targetNode = nodes.find((n) => n.type === vector.targetType);
      if (!targetNode && vector.targetType === "subdomain") {
        targetNode = nodes.find((n) => (n.data as unknown as TopologyNodeData)?.severity === "critical");
      }
      if (!targetNode) {
        targetNode = nodes.find((n) => n.type === "root") || nodes[0];
      }

      if (targetNode) {
        // Highlight active target node
        setNodes((prevNodes) =>
          prevNodes.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isSimulated: n.id === targetNode?.id,
            },
          }))
        );

        // Highlight connected attack route edges with crimson glow
        setEdges((prevEdges) =>
          prevEdges.map((e) => {
            const isTargetEdge = e.source === targetNode?.id || e.target === targetNode?.id;
            return {
              ...e,
              animated: isTargetEdge || Boolean(e.animated),
              style: isTargetEdge
                ? {
                    stroke: "#f43f5e",
                    strokeWidth: 3,
                    filter: "drop-shadow(0 0 8px rgba(244, 63, 94, 0.8))",
                  }
                : {
                    strokeWidth: 1.5,
                    ...e.style,
                    stroke: "#334155",
                  },
            };
          })
        );

        // Smoothly center and pan to the targeted node
        if (flowInstanceRef.current) {
          flowInstanceRef.current.setCenter(
            targetNode.position.x + 80,
            targetNode.position.y + 30,
            { zoom: 1.3, duration: 600 }
          );
        }

        // Tactical Audio & Micro-Haptics
        playScanDispatch();
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(25);
        }
      }
    },
    [nodes, playScanDispatch, setNodes, setEdges]
  );

  // Auto-play timer for attack simulation
  useEffect(() => {
    if (!isSimActive || !isSimPlaying) return;

    const interval = setInterval(() => {
      setSimStep((prev) => {
        const next = (prev + 1) % ATTACK_VECTORS.length;
        focusVector(next);
        return next;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [isSimActive, isSimPlaying, focusVector]);

  // Listen for global custom event dispatched from AiThreatReport / MITRE components
  useEffect(() => {
    const handleRemoteSimulate = (event: Event) => {
      const customEvent = event as CustomEvent<{ stageNumber?: number }>;
      const stageNum = customEvent.detail?.stageNumber ?? 1;
      const targetIdx = Math.max(0, Math.min(ATTACK_VECTORS.length - 1, stageNum - 1));

      setIsSimActive(true);
      setIsSimPlaying(false);
      setSimStep(targetIdx);

      // Scroll canvas into view smoothly
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      focusVector(targetIdx);
    };

    window.addEventListener("shador:simulate-attack-stage", handleRemoteSimulate);
    window.addEventListener("shadowtrace:simulate-attack-stage", handleRemoteSimulate);
    return () => {
      window.removeEventListener("shador:simulate-attack-stage", handleRemoteSimulate);
      window.removeEventListener("shadowtrace:simulate-attack-stage", handleRemoteSimulate);
    };
  }, [focusVector]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleResetView = useCallback(() => {
    if (flowInstanceRef.current) {
      flowInstanceRef.current.fitView({ padding: 0.25, duration: 400 });
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (flowInstanceRef.current) {
      flowInstanceRef.current.zoomIn({ duration: 300 });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (flowInstanceRef.current) {
      flowInstanceRef.current.zoomOut({ duration: 300 });
    }
  }, []);

  const handleCopyNodeData = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (flowInstanceRef.current) {
          flowInstanceRef.current.fitView({ padding: 0.25, duration: 350 });
        }
      }, 350);
      return next;
    });
    playClick();
  }, [playClick]);

  const selectedData = selectedNode?.data as unknown as TopologyNodeData | undefined;

  const getNodeIcon = (type?: string) => {
    switch (type) {
      case "root":
        return <Radio className="h-4 w-4 text-cyan-400" />;
      case "subdomain":
        return <Globe className="h-4 w-4 text-cyan-400" />;
      case "mx":
        return <Mail className="h-4 w-4 text-blue-400" />;
      case "ns":
        return <Server className="h-4 w-4 text-indigo-400" />;
      case "tls":
        return <Shield className="h-4 w-4 text-emerald-400" />;
      case "ip":
        return <Network className="h-4 w-4 text-slate-400" />;
      default:
        return <Globe className="h-4 w-4 text-cyan-400" />;
    }
  };

  const activeVector = ATTACK_VECTORS[simStep];

  return (
    <div
      id="attack-surface-topology"
      ref={containerRef}
      className={`relative w-full ${
        fullHeight
          ? "h-full min-h-0 rounded-none border-0 shadow-none"
          : `rounded-2xl border border-white/[0.12] shadow-2xl ${
              isExpanded
                ? "h-[540px] sm:h-[640px] lg:h-[720px]"
                : "h-[340px] sm:h-[420px] lg:h-[480px]"
            }`
      } bg-[#07090e] overflow-hidden group transition-all duration-300 gpu-accelerated contain-paint`}
    >
      {/* Precision Predator Corner Laser Accents */}
      {!fullHeight && (
        <>
          <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none z-30" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-rose-500 pointer-events-none z-30" />
          <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none z-30" />
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-rose-500 pointer-events-none z-30" />
        </>
      )}

      {/* Top Header Visor & Viewport Controls (Unified Non-Overlapping Responsive Architecture) */}
      <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-20 flex flex-col gap-2 pointer-events-none">
        {/* Top Control Bar: Title Badge on Left, Viewport Actions on Right */}
        <div className="flex items-center justify-between gap-2 w-full">
          {/* Left: Tactical Matrix Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-xl border border-white/[0.12] bg-[#0d121c]/95 px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-lg pointer-events-auto shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-slate-200">
              <span className="hidden sm:inline">DAEMON </span>TOPOLOGY<span className="hidden sm:inline"> MATRIX</span>
            </span>
            <span className="text-[9.5px] sm:text-[11px] font-mono text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded-full border border-cyan-500/30">
              {nodes.length}n · {edges.length}e
            </span>
          </div>

          {/* Right: Viewport Action Pill (Hand, ZoomIn, ZoomOut, Reset, Expand) */}
          <div className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-white/[0.08] bg-[#0d121c]/95 p-1 shadow-xl pointer-events-auto shrink-0">
            <button
              onClick={() => setIsPanActive(!isPanActive)}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-mono ${
                isPanActive
                  ? "text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30"
                  : "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30"
              }`}
              title={isPanActive ? "Pan Active: Click to lock canvas (Pure Page Scroll)" : "Scroll-Safe Active: Click to enable Canvas Pan"}
              aria-label="Toggle Canvas Pan"
            >
              {isPanActive ? <Hand className="h-4 w-4 text-cyan-400" /> : <Lock className="h-4 w-4 text-amber-400" />}
              <span className="hidden xl:inline text-[10px]">{isPanActive ? "Pan" : "Locked"}</span>
            </button>

            <div className="h-4 w-px bg-white/[0.1] mx-0.5" />

            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Reset View (Fit View)"
              aria-label="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {!fullHeight && (
              <>
                <div className="h-4 w-px bg-white/[0.1] mx-0.5" />
                <button
                  onClick={toggleExpand}
                  className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-mono ${
                    isExpanded
                      ? "text-cyan-300 bg-cyan-500/20 border border-cyan-500/40"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.08]"
                  }`}
                  title={isExpanded ? "Collapse Canvas Height" : "Expand Canvas Workspace"}
                  aria-label="Toggle Canvas Height"
                >
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="hidden xl:inline text-[10px]">{isExpanded ? "Collapse" : "Expand"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Action Triggers Row: Simulate Attack Path & Kill-Chain Arena */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-0.5 pointer-events-none">
          {/* Interactive Attack Simulator Trigger */}
          <button
            onClick={() => {
              if (isSimActive) {
                exitSimulation();
              } else {
                setIsSimActive(true);
                setIsSimPlaying(true);
                setSimStep(0);
                focusVector(0);
                playPing();
              }
            }}
            className={`pointer-events-auto shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all shadow-md active:scale-95 border ${
              isSimActive
                ? "bg-rose-500/25 text-rose-200 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.45)]"
                : "bg-cyan-500/15 text-cyan-300 border-cyan-500/35 hover:bg-cyan-500/25 hover:text-white"
            }`}
            title="Interactive Adversary Attack Path Simulator"
          >
            {isSimActive ? (
              <>
                <Flame className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                <span>KILL CHAIN ACTIVE ({simStep + 1}/{ATTACK_VECTORS.length})</span>
              </>
            ) : (
              <>
                <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
                <span>Simulate Attack Path</span>
              </>
            )}
          </button>

          {/* 1-Click Launch Kill-Chain Arena */}
          <button
            onClick={() => {
              const rootNode = topology.nodes.find((n) => n.type === "root") || topology.nodes[0];
              const sim = generateNodeSimulation(
                rootNode?.id || "root",
                (rootNode?.data as unknown as TopologyNodeData) || {
                  label: rootDomain,
                  type: "root",
                  severity: "secure",
                },
                rootDomain
              );
              setArenaSimulation(sim);
              setIsArenaOpen(true);
              playScanDispatch();
            }}
            className="pointer-events-auto shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all shadow-md active:scale-95 border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 hover:text-white"
            title="Open Interactive Red vs Blue Kill-Chain Arena"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>Kill-Chain Arena</span>
          </button>
        </div>
      </div>

      {/* Bottom Right: Relocated Legend (Zero-collision with top controls) */}
      <div className="absolute bottom-3 right-4 z-10 hidden xl:flex items-center gap-3 text-[11px] font-mono rounded-xl border border-white/[0.06] bg-[#0d121c]/85 px-3 py-1.5 text-slate-400 backdrop-blur-md shadow-md">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" /> Hardened
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" /> Drift
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" /> Takeover
        </span>
      </div>

      {/* React Flow Canvas (GPU 120/144 FPS Accelerated) */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onInit={(instance) => {
          flowInstanceRef.current = instance;
        }}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.0}
        onlyRenderVisibleElements={true}
        elevateNodesOnSelect={false}
        preventScrolling={false}
        zoomOnScroll={false}
        zoomActivationKeyCode="Control"
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        panOnDrag={isPanActive}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="rgba(255,255,255,0.06)" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { severity?: string };
            if (data?.severity === "critical") return "#f43f5e";
            if (data?.severity === "warning") return "#f59e0b";
            return "#00e5ff";
          }}
          maskColor="rgba(7, 9, 14, 0.85)"
          className="hidden md:block !border !border-slate-800 !bg-[#0a0f19] !rounded-lg overflow-hidden"
        />
      </ReactFlow>

      {/* Bottom Left: Navigation Guidance */}
      {!isSimActive && (
        <>
          <div className="absolute bottom-3 left-4 z-10 hidden sm:flex items-center gap-2 pointer-events-none">
            <div className="rounded-xl border border-white/[0.08] bg-[#090d18]/95 px-3 py-1.5 text-[11px] font-mono text-slate-400 shadow-md flex items-center gap-2 pointer-events-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                {fullHeight
                  ? "War Room Topology · Pan freely · Hold Ctrl + Scroll or +/- to zoom"
                  : "Page scroll active · Hold Ctrl + Scroll or toolbar +/- to zoom"}
              </span>
            </div>
          </div>
          <div className="absolute bottom-3 left-4 z-10 sm:hidden flex items-center gap-2 pointer-events-none">
            <div className="rounded-lg border border-white/[0.08] bg-[#090d18]/95 px-2.5 py-1 text-[10px] font-mono text-slate-400 shadow-md flex items-center gap-1.5 pointer-events-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>{fullHeight ? "Drag nodes & canvas · Pinch to zoom" : "Swipe scrolls page · Pinch to zoom"}</span>
            </div>
          </div>
        </>
      )}

      {/* Tactical Attack Simulation Controller HUD (Active Mode) */}
      {isSimActive && activeVector && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-2xl border border-rose-500/50 bg-[#090814]/98 p-3.5 sm:p-4 shadow-[0_0_30px_rgba(244,63,94,0.22)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left Info */}
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                    STAGE 0{activeVector.step} OF 0{ATTACK_VECTORS.length}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
                    MITRE {activeVector.mitreId}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 hidden md:inline">
                    {activeVector.technique}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  {activeVector.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-1 sm:line-clamp-2 font-sans">
                  {activeVector.description}
                </p>
              </div>

              {/* Right Controller Controls */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {/* Step dots */}
                <div className="hidden lg:flex items-center gap-1.5 mr-2">
                  {ATTACK_VECTORS.map((v, i) => (
                    <button
                      key={v.step}
                      onClick={() => {
                        setSimStep(i);
                        focusVector(i);
                        playClick();
                      }}
                      className={`h-2 rounded-full transition-all ${
                        simStep === i
                          ? "w-6 bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                          : "w-2 bg-slate-700 hover:bg-slate-500"
                      }`}
                      title={`Jump to Stage 0${v.step}`}
                      aria-label={`Jump to Stage 0${v.step}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/50 p-1">
                  <button
                    onClick={() => {
                      const prev = (simStep - 1 + ATTACK_VECTORS.length) % ATTACK_VECTORS.length;
                      setSimStep(prev);
                      focusVector(prev);
                      playClick();
                    }}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                    title="Previous Stage"
                    aria-label="Previous Stage"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      setIsSimPlaying(!isSimPlaying);
                      playClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSimPlaying
                        ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                        : "bg-rose-500/25 text-rose-200 border border-rose-500/40 hover:bg-rose-500/35"
                    }`}
                    title={isSimPlaying ? "Pause Auto-Advance" : "Start Auto-Advance"}
                    aria-label={isSimPlaying ? "Pause Auto-Advance" : "Start Auto-Advance"}
                  >
                    {isSimPlaying ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Auto-Play</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const next = (simStep + 1) % ATTACK_VECTORS.length;
                      setSimStep(next);
                      focusVector(next);
                      playClick();
                    }}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                    title="Next Stage"
                    aria-label="Next Stage"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={exitSimulation}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
                  title="Close Attack Simulator"
                  aria-label="Close Attack Simulator"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tactical Holographic Node Inspector Widget (Shown on Node Click) - 100% Solid Opaque */}
      {selectedNode && selectedData && !isSimActive && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className="rounded-2xl border border-cyan-500/50 p-4 shadow-[0_0_30px_rgba(0,240,255,0.2)]"
            style={{ backgroundColor: "#0b0f1d", opacity: 1 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center">
                  {getNodeIcon(selectedData.type)}
                </div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                  {selectedData.type} Node
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                    selectedData.severity === "critical"
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                      : selectedData.severity === "warning"
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {selectedData.severity || "Secure"}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  aria-label="Dismiss inspector"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="py-3 space-y-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Identifier / FQDN
                </span>
                <div className="text-sm font-mono font-bold text-white break-all flex items-center justify-between gap-2 mt-0.5">
                  <span>{selectedData.label}</span>
                  <button
                    onClick={() => handleCopyNodeData(selectedData.label)}
                    className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-cyan-300 transition-colors shrink-0"
                    title="Copy identifier"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                <div className="rounded-lg bg-[#060813] border border-white/[0.08] p-2">
                  <span className="text-slate-400 block text-[9px] uppercase">Classification</span>
                  <span className="text-slate-200 font-medium">{selectedData.subtitle || "Perimeter Host"}</span>
                </div>
                <div className="rounded-lg bg-[#060813] border border-white/[0.08] p-2">
                  <span className="text-slate-400 block text-[9px] uppercase">Attack Vector</span>
                  <span
                    className={
                      selectedData.severity === "critical"
                        ? "text-rose-400 font-bold"
                        : "text-emerald-400 font-medium"
                    }
                  >
                    {selectedData.severity === "critical" ? "Exploitable" : "Defended"}
                  </span>
                </div>
              </div>

              {selectedData.isDriftNew && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-xs text-amber-300 font-mono">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Newly surfaced host identified via drift telemetry.</span>
                </div>
              )}

              {/* 1-Click Launch Kill-Chain Simulation on this Node */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    const sim = generateNodeSimulation(selectedNode.id, selectedData, rootDomain);
                    setArenaSimulation(sim);
                    setIsArenaOpen(true);
                    playScanDispatch();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-mono font-bold border border-rose-500/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 hover:border-rose-400 active:scale-95 transition-all shadow-md shadow-rose-500/10 group"
                >
                  <Flame className="h-3.5 w-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span>Simulate Kill-Chain on Node</span>
                  <span className="text-[10px] bg-rose-500/40 text-rose-100 px-1.5 py-0.2 rounded border border-rose-400/40 font-bold uppercase">
                    Red vs Blue
                  </span>
                </button>
              </div>
            </div>

            {/* Footer Tip */}
            <div className="pt-2 border-t border-white/[0.06] text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Interactive Topology Engine</span>
              <span className="text-cyan-400">Node Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Red vs Blue Kill-Chain Arena Modal */}
      <InteractiveAttackArena
        simulation={arenaSimulation}
        isOpen={isArenaOpen}
        onClose={() => setIsArenaOpen(false)}
        targetDomain={rootDomain}
      />
    </div>
  );
}
