import { pgTable, serial, date, doublePrecision, varchar, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";

// ─── Dimensions ─────────────────────────────────────────────

export const indicators = pgTable("indicators", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 80 }).unique().notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  category: varchar("category", { length: 50 }),
});

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  geoName: varchar("geo_name", { length: 100 }),
});

// ─── Faits ──────────────────────────────────────────────────

export const observations = pgTable(
  "observations",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    indicatorId: integer("indicator_id")
      .references(() => indicators.id)
      .notNull(),
    regionId: integer("region_id").references(() => regions.id), // NULL = national
    value: doublePrecision("value"),
  },
  (t) => [uniqueIndex("obs_unique").on(t.date, t.indicatorId, t.regionId)]
);

// ─── Traçabilité ────────────────────────────────────────────

export const ingestions = pgTable("ingestions", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }),
  recordsInserted: integer("records_inserted"),
  runAt: timestamp("run_at").defaultNow(),
});
