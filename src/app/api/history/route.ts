/**
 * ShadowTrace - API Route: /api/history
 * Serves recent audit history and drift timeline records.
 */

import { NextResponse } from "next/server";
import { getRecentScans } from "@/lib/db/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const history = await getRecentScans(Math.min(50, Math.max(1, limit)));

    return NextResponse.json(
      { history },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=15, s-maxage=30",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
