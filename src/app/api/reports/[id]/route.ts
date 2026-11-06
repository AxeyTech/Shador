/**
 * ShadowTrace - API Route: /api/reports/[id]
 * Serves immutable, shareable audit report snapshots by scanId.
 */

import { NextResponse } from "next/server";
import { getScanById } from "@/lib/db/storage";

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

    return NextResponse.json(scan, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
