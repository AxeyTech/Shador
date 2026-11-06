"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Send,
  Check,
  X,
  AlertTriangle,
  Radio,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import type { CompleteScanResult } from "@/lib/types/scanner";
import { useTacticalAudio } from "@/lib/audio/AudioContext";

interface WebhookAlertStudioProps {
  scan: CompleteScanResult;
  isOpen: boolean;
  onClose: () => void;
}

const WEBHOOK_STORAGE_KEY = "shador:webhooks:v1";
const LEGACY_WEBHOOK_STORAGE_KEY = "shadowtrace:webhooks:v1";

export function WebhookAlertStudio({ scan, isOpen, onClose }: WebhookAlertStudioProps) {
  const { playClick, playScanDispatch, playDownload } = useTacticalAudio();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookType, setWebhookType] = useState<"discord" | "slack">("discord");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load saved webhook on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WEBHOOK_STORAGE_KEY) || localStorage.getItem(LEGACY_WEBHOOK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url) setWebhookUrl(parsed.url);
        if (parsed.type) setWebhookType(parsed.type);
      }
    } catch {
      // Storage fallback
    }
  }, []);

  if (!mounted || !isOpen) return null;

  const handleUrlChange = (val: string) => {
    setWebhookUrl(val);
    if (val.includes("slack.com")) {
      setWebhookType("slack");
    } else if (val.includes("discord.com")) {
      setWebhookType("discord");
    }
  };

  const handleDispatch = async () => {
    if (!webhookUrl.trim()) return;

    setIsSending(true);
    setSendSuccess(null);
    setSendError(null);
    playScanDispatch();

    try {
      const res = await fetch("/api/alerts/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          scan,
          type: webhookType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendSuccess(`Alert transmitted successfully to ${webhookType.toUpperCase()}!`);
        // Save to localStorage
        localStorage.setItem(
          WEBHOOK_STORAGE_KEY,
          JSON.stringify({ url: webhookUrl.trim(), type: webhookType })
        );
        playDownload();
      } else {
        setSendError(data.error || "Failed to deliver webhook notification.");
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Network error during transmission");
    } finally {
      setIsSending(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Webhook Tactical Alert Dispatcher"
    >
      {/* 100% Solid Opaque Container */}
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/[0.14] shadow-[-10px_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(6,182,212,0.18)] max-h-[92vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: "#060813", opacity: 1 }}
      >
        {/* Top Tactical Laser Line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-cyan-500/50 bg-cyan-500/15 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  INCIDENT ALERT ENGINE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                  DISCORD & SLACK
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-mono font-bold text-white">
                Live Webhook Tactical Alert Dispatcher
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="p-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
            aria-label="Close Webhook Studio"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            Transmit real-time reconnaissance alerts, critical posture changes, and dangling takeover reports directly
            into your team&apos;s Discord or Slack operations channel.
          </p>

          {/* Webhook URL Input Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <label htmlFor="webhook-input" className="font-semibold text-white flex items-center gap-1.5">
                <span>Webhook Destination URL:</span>
              </label>
              <span className="text-[10px] text-slate-400">HTTPS only</span>
            </div>

            <div className="relative">
              <input
                id="webhook-input"
                type="url"
                value={webhookUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/services/..."
                className="w-full rounded-xl border border-white/[0.1] bg-[#0b0f1d] px-4 py-3 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all"
              />
            </div>
          </div>

          {/* Platform Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 mr-2">Target Platform:</span>
            <button
              type="button"
              onClick={() => {
                playClick();
                setWebhookType("discord");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                webhookType === "discord"
                  ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  : "border-white/[0.08] bg-[#0b0f1d] text-slate-400 hover:text-white"
              }`}
            >
              Discord Embed
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setWebhookType("slack");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                webhookType === "slack"
                  ? "border-purple-500/50 bg-purple-500/20 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  : "border-white/[0.08] bg-[#0b0f1d] text-slate-400 hover:text-white"
              }`}
            >
              Slack Block Kit
            </button>
          </div>

          {/* Notification Preview Box */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-semibold text-slate-400 block">
              Live Payload Preview ({webhookType.toUpperCase()} Format):
            </span>

            <div className="rounded-xl border border-white/[0.08] bg-[#0b0f1d] p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-xs font-mono">
                <span className="font-bold text-cyan-300">🎯 Recon Dossier: {scan.targetDomain}</span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-[#060813] border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 block">Posture Grade</span>
                  <span className="font-bold text-white">
                    [{scan.score.letterGrade}] ({scan.score.score}/100)
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#060813] border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 block">Dangling Takeovers</span>
                  <span className="font-bold text-emerald-300">
                    {scan.subdomains.danglingTakeoversFound > 0
                      ? `${scan.subdomains.danglingTakeoversFound} Takeovers!`
                      : "0 Vulnerabilities"}
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-400 line-clamp-2">
                {scan.score.summary}
              </div>
            </div>
          </div>

          {/* Status Banners */}
          {sendSuccess && (
            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 text-xs font-mono flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{sendSuccess}</span>
            </div>
          )}

          {sendError && (
            <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-200 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{sendError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#080c19] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Tested & Verified for Discord & Slack
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleDispatch}
              disabled={isSending || !webhookUrl.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold border border-cyan-500/50 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 hover:border-cyan-400 disabled:opacity-40 transition-all shadow-md shadow-cyan-500/10 active:scale-95"
            >
              {isSending ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-cyan-300 border-t-transparent animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Send Live Test Alert</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
