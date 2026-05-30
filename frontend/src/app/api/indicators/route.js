import { db } from "../../../lib/db/index.js";
import { indicators } from "../../../lib/db/schema.js";
import { NextResponse } from "next/server";

/**
 * GET /api/indicators
 *
 * Returns the full indicator catalogue.
 * Optional: ?category=secteurs to filter by category.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  try {
    let query = db.select().from(indicators);
    if (category) {
      const { eq } = await import("drizzle-orm");
      query = query.where(eq(indicators.category, category));
    }

    const rows = await query.orderBy(indicators.category, indicators.code);

    return NextResponse.json(
      { count: rows.length, indicators: rows },
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
  } catch (err) {
    console.error("API /indicators error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
