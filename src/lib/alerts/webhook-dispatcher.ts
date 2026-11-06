/**
 * ShadowTrace - Tactical Webhook & Alert Dispatcher (Discord & Slack)
 * Standard: IEEE Std 830-1998 Tactical Incident Notification
 */

import type { CompleteScanResult } from "../types/scanner";

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export function formatDiscordPayload(scan: CompleteScanResult, originUrl: string) {
  const isCritical = scan.score.score > 60 || scan.subdomains.danglingTakeoversFound > 0;
  const color =
    scan.score.letterGrade === "A"
      ? 0x10b981 // Emerald
      : scan.score.letterGrade === "B"
      ? 0x06b6d4 // Cyan
      : scan.score.letterGrade === "C"
      ? 0xf59e0b // Amber
      : 0xf43f5e; // Rose

  const fields: DiscordEmbedField[] = [
    {
      name: "🛡️ Posture Grade",
      value: `[${scan.score.letterGrade}] (${scan.score.score}/100 Risk Index)`,
      inline: true,
    },
    {
      name: "⚡ Status",
      value: scan.score.title,
      inline: true,
    },
    {
      name: "⏱️ Audit Speed",
      value: `${scan.executionTimeMs}ms`,
      inline: true,
    },
    {
      name: "📧 Email Spoofability",
      value: scan.emailSpoof.canSpoofDirectly ? "⚠️ DIRECT SPOOFING POSSIBLE" : "✅ Hardened",
      inline: true,
    },
    {
      name: "🌐 Subdomains / Takeovers",
      value: `${scan.subdomains.discoveredCount} Assets (${scan.subdomains.danglingTakeoversFound} Dangling)`,
      inline: true,
    },
    {
      name: "🔒 TLS Protocol",
      value: `${scan.tls.protocol || "Active"} (${scan.tls.daysRemaining}d left)`,
      inline: true,
    },
  ];

  if (scan.originBypass?.isBehindWaf) {
    fields.push({
      name: "🔥 WAF & Origin Leaks",
      value: `${scan.originBypass.wafProvider} (${scan.originBypass.candidates.length} leaked origin IPs)`,
      inline: false,
    });
  }

  return {
    username: "SHADOR Tactical Radar",
    avatar_url: `${originUrl}/shador-logo.jpg`,
    embeds: [
      {
        title: `🎯 Recon Dossier: ${scan.targetDomain}`,
        description: scan.score.summary,
        url: `${originUrl}/report/${scan.id}`,
        color,
        fields,
        footer: {
          text: "SHADOR Tactical Reconnaissance • IEEE Std 830-1998",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function formatSlackPayload(scan: CompleteScanResult, originUrl: string) {
  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🎯 SHADOR Recon Dossier: ${scan.targetDomain}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Posture Grade:*\n[${scan.score.letterGrade}] (${scan.score.score}/100)`,
          },
          {
            type: "mrkdwn",
            text: `*Status:*\n${scan.score.title}`,
          },
          {
            type: "mrkdwn",
            text: `*Email Spoofability:*\n${scan.emailSpoof.canSpoofDirectly ? "⚠️ Direct Spoofing" : "✅ Protected"}`,
          },
          {
            type: "mrkdwn",
            text: `*Dangling Takeovers:*\n${scan.subdomains.danglingTakeoversFound > 0 ? "🚨 Takeovers Found" : "✅ None"}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Open Full Attack Dossier",
              emoji: true,
            },
            url: `${originUrl}/report/${scan.id}`,
            style: "primary",
          },
        ],
      },
    ],
  };
}
