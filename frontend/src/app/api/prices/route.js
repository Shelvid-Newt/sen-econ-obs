import { db } from "../../../lib/db/index.js";
import { observations, indicators, regions } from "../../../lib/db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/prices?product=oignon_local&month=2019-01
 *
 * Returns regional price data for a given product and month.
 * - product: product code (e.g. oignon_local) — required
 * - month: YYYY-MM (optional, returns all available blocks if omitted)
 *
 * Response: { product, month?, data: { [regionLabel]: price } }
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const product = searchParams.get("product");
  const monthParam = searchParams.get("month");

  if (!product) {
    return NextResponse.json({ error: "Missing 'product' parameter" }, { status: 400 });
  }

  const indCode = `prix_reg_${product}`;

  try {
    // Find indicator
    const ind = await db
      .select({ id: indicators.id })
      .from(indicators)
      .where(eq(indicators.code, indCode));

    if (!ind.length) {
      return NextResponse.json({ error: `Unknown product: ${product}` }, { status: 404 });
    }

    const conditions = [eq(observations.indicatorId, ind[0].id)];
    if (monthParam) {
      conditions.push(eq(observations.date, `${monthParam}-01`));
    }

    const rows = await db
      .select({
        date: observations.date,
        regionId: observations.regionId,
        regionLabel: regions.label,
        value: observations.value,
      })
      .from(observations)
      .leftJoin(regions, eq(observations.regionId, regions.id))
      .where(and(...conditions))
      .orderBy(observations.date);

    // Group by date block
    const blocks = {};
    for (const row of rows) {
      const month = row.date.slice(0, 7);
      if (!blocks[month]) blocks[month] = {};
      const label = row.regionLabel || "National";
      blocks[month][label] = row.value;
    }

    // Also compute national average for each block
    for (const [month, data] of Object.entries(blocks)) {
      const vals = Object.values(data).filter((v) => v != null);
      if (vals.length) {
        data["_moyenne"] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
      }
    }

    return NextResponse.json(
      { product, blocks },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (err) {
    console.error("API /prices error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
