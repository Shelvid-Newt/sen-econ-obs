import { db } from "../../../lib/db/index.js";
import { observations, indicators } from "../../../lib/db/schema.js";
import { eq, and, isNull, desc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/kpis?month=2026-01
 *
 * Returns the latest KPI values for all key indicators.
 * If month is omitted, returns the most recent available month.
 *
 * Response: { month, kpis: { [code]: { value, prev, variation } } }
 */

const KEY_INDICATORS = [
  "primaire_brute", "secondaire_brute", "tertiaire_brute", "commerce_brute",
  "or", "ciment_production", "ciment_ventes_locales", "ciment_exportations",
  "peche_total", "peche_industrielle", "peche_artisanale",
  "brent", "eur_usd", "usd_cfa",
  "recettes_fiscales",
  "maritime_embarquements", "maritime_debarquements",
  "aerien_passagers",
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // YYYY-MM

  try {
    // Resolve target date
    let targetDate;
    if (monthParam) {
      targetDate = `${monthParam}-01`;
    } else {
      const latest = await db
        .select({ date: observations.date })
        .from(observations)
        .where(isNull(observations.regionId))
        .orderBy(desc(observations.date))
        .limit(1);
      if (!latest.length) {
        return NextResponse.json({ error: "No data available" }, { status: 404 });
      }
      targetDate = latest[0].date;
    }

    // Previous month
    const d = new Date(targetDate);
    d.setMonth(d.getMonth() - 1);
    const prevDate = d.toISOString().slice(0, 10);

    // Fetch all key indicators
    const allInds = await db
      .select({ id: indicators.id, code: indicators.code, unit: indicators.unit, label: indicators.label })
      .from(indicators)
      .where(inArray(indicators.code, KEY_INDICATORS));

    const indIds = allInds.map((r) => r.id);
    const indLookup = Object.fromEntries(allInds.map((r) => [r.id, r]));

    // Fetch current + previous month
    const rows = await db
      .select({
        date: observations.date,
        indicatorId: observations.indicatorId,
        value: observations.value,
      })
      .from(observations)
      .where(
        and(
          inArray(observations.indicatorId, indIds),
          isNull(observations.regionId),
          inArray(observations.date, [targetDate, prevDate])
        )
      );

    // Build KPI map
    const currentVals = {};
    const prevVals = {};

    for (const row of rows) {
      const ind = indLookup[row.indicatorId];
      if (!ind) continue;
      if (row.date === targetDate) currentVals[ind.code] = row.value;
      else prevVals[ind.code] = row.value;
    }

    const kpis = {};
    for (const ind of allInds) {
      const cur = currentVals[ind.code];
      const prev = prevVals[ind.code];
      const variation = cur != null && prev != null && prev !== 0
        ? ((cur - prev) / Math.abs(prev)) * 100
        : null;
      kpis[ind.code] = {
        value: cur ?? null,
        prev: prev ?? null,
        variation: variation != null ? Math.round(variation * 100) / 100 : null,
        unit: ind.unit,
        label: ind.label,
      };
    }

    return NextResponse.json(
      { month: targetDate.slice(0, 7), kpis },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (err) {
    console.error("API /kpis error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
