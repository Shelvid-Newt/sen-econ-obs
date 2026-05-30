import { db } from "../../../lib/db/index.js";
import { observations, indicators, regions } from "../../../lib/db/schema.js";
import { eq, gte, lte, and, isNull, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/series?indicator=primaire_brute&from=2024-01&to=2026-01&region=dakar
 *
 * Returns time-series observations for one or more indicators.
 * - indicator: comma-separated indicator codes (required)
 * - from: start date YYYY-MM (optional)
 * - to: end date YYYY-MM (optional)
 * - region: region code (optional, omit for national-level)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const indicatorParam = searchParams.get("indicator");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const regionParam = searchParams.get("region");

  if (!indicatorParam) {
    return NextResponse.json({ error: "Missing 'indicator' parameter" }, { status: 400 });
  }

  const codes = indicatorParam.split(",").map((s) => s.trim());

  try {
    // Indicator filter
    const indRows = await db
      .select({ id: indicators.id, code: indicators.code })
      .from(indicators)
      .where(inArray(indicators.code, codes));

    if (indRows.length === 0) {
      return NextResponse.json({ error: `Unknown indicator(s): ${codes.join(", ")}` }, { status: 404 });
    }

    const indIds = indRows.map((r) => r.id);

    // Build conditions
    const conditions = [inArray(observations.indicatorId, indIds)];

    // Date filters
    if (from) conditions.push(gte(observations.date, `${from}-01`));
    if (to) conditions.push(lte(observations.date, `${to}-31`));

    // Region filter
    if (regionParam) {
      const reg = await db.select({ id: regions.id }).from(regions).where(eq(regions.code, regionParam));
      if (reg.length === 0) {
        return NextResponse.json({ error: `Unknown region: ${regionParam}` }, { status: 404 });
      }
      conditions.push(eq(observations.regionId, reg[0].id));
    } else {
      conditions.push(isNull(observations.regionId));
    }

    const rows = await db
      .select({
        date: observations.date,
        indicator: indicators.code,
        value: observations.value,
      })
      .from(observations)
      .innerJoin(indicators, eq(observations.indicatorId, indicators.id))
      .where(and(...conditions))
      .orderBy(observations.date);

    // Group by indicator
    const result = {};
    for (const row of rows) {
      if (!result[row.indicator]) result[row.indicator] = [];
      result[row.indicator].push({ date: row.date, value: row.value });
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    console.error("API /series error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
