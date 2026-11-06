/**
 * ShadowTrace - API Route: /api/reports/[id]/print
 * Serves the standalone, print-perfect Executive CISO Dossier (A4/Letter).
 */

import { NextResponse } from "next/server";
import { getScanById } from "@/lib/db/storage";
import { generateExecutivePdfHtml } from "@/lib/export/pdf-dossier";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    const scan = await getScanById(id);

    if (!scan) {
      return NextResponse.json(
        { error: "Audit report not found or expired" },
        { status: 404 }
      );
    }

    const html = generateExecutivePdfHtml(scan);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error generating dossier";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
