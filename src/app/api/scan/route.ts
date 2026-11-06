/**
 * ShadowTrace - API Route: /api/scan
 * Handles asynchronous domain scanning requests, SSRF validation, and reconnaissance telemetry.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { executeShadowTraceRecon } from "@/lib/scanner/orchestrator";
import { DomainValidationError } from "@/lib/scanner/ssrf-guard";
import { saveScanRecord } from "@/lib/db/storage";

export const dynamic = "force-dynamic";

const scanRequestSchema = z.object({
  domain: z.string().min(1, "Domain is required").max(253, "Domain exceeds maximum length"),
  userId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = scanRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { domain, userId } = parseResult.data;

    // 1. Execute full reconnaissance pipeline
    const scanResult = await executeShadowTraceRecon(domain);

    // 2. Persist record and compute infrastructure drift (FR-9 & FR-10)
    const { scan: savedScan } = await saveScanRecord(scanResult, userId);

    return NextResponse.json(savedScan, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    if (err instanceof DomainValidationError) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
        },
        { status: 400 }
      );
    }

    const message = err instanceof Error ? err.message : "Internal reconnaissance error";
    return NextResponse.json(
      {
        error: message,
        code: "SCAN_EXECUTION_FAILED",
      },
      { status: 500 }
    );
  }
}
