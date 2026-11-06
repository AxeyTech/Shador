import { NextRequest, NextResponse } from "next/server";
import { formatDiscordPayload, formatSlackPayload } from "@/lib/alerts/webhook-dispatcher";
import type { CompleteScanResult } from "@/lib/types/scanner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { webhookUrl, scan, type = "discord" } = body as {
      webhookUrl: string;
      scan: CompleteScanResult;
      type?: "discord" | "slack" | "generic";
    };

    if (!webhookUrl || typeof webhookUrl !== "string") {
      return NextResponse.json({ error: "Missing or invalid webhook URL" }, { status: 400 });
    }

    // Security Anti-SSRF Check
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(webhookUrl);
    } catch {
      return NextResponse.json({ error: "Malformed webhook URL format" }, { status: 400 });
    }

    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Webhook endpoint must use secure HTTPS protocol" }, { status: 400 });
    }

    const host = parsedUrl.hostname.toLowerCase();
    const isPrivate =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("172.16.") ||
      host.endsWith(".local") ||
      host.endsWith(".internal");

    if (isPrivate) {
      return NextResponse.json({ error: "Private or internal loopback IP addresses are blocked" }, { status: 403 });
    }

    const origin = req.nextUrl.origin;
    let payload: Record<string, unknown>;

    if (type === "slack" || host.includes("slack.com")) {
      payload = formatSlackPayload(scan, origin);
    } else {
      payload = formatDiscordPayload(scan, origin);
    }

    // Dispatch to webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `Webhook server responded with HTTP ${response.status}`, details: errText.slice(0, 200) },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: "Alert dispatched successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transmit webhook alert" },
      { status: 500 }
    );
  }
}
