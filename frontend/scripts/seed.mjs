/**
 * Seed script — reads existing JSON data files and inserts into Neon PostgreSQL.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed.mjs
 *
 * Requires DATABASE_URL in .env.local
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { readFileSync } from "fs";
import { resolve } from "path";

import { indicators, regions, observations, ingestions } from "../src/lib/db/schema.js";

const DATA_DIR = resolve("public/data");
const json = (name) => JSON.parse(readFileSync(resolve(DATA_DIR, name), "utf-8"));

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// ── Indicator catalogue ─────────────────────────────────────
const INDICATORS = [
  // Secteurs
  { code: "primaire_brute", label: "Secteur primaire (brut)", unit: "indice base 100", category: "secteurs" },
  { code: "secondaire_brute", label: "Secteur secondaire (brut)", unit: "indice base 100", category: "secteurs" },
  { code: "tertiaire_brute", label: "Secteur tertiaire (brut)", unit: "indice base 100", category: "secteurs" },
  { code: "commerce_brute", label: "Commerce (brut)", unit: "indice base 100", category: "secteurs" },
  // Production
  { code: "or", label: "Production aurifère", unit: "kg", category: "production" },
  { code: "ciment_production", label: "Ciment — production", unit: "kt", category: "production" },
  { code: "ciment_ventes_locales", label: "Ciment — ventes locales", unit: "kt", category: "production" },
  { code: "ciment_exportations", label: "Ciment — exportations", unit: "kt", category: "production" },
  { code: "peche_total", label: "Pêche — débarquements totaux", unit: "tonnes", category: "production" },
  { code: "peche_industrielle", label: "Pêche — industrielle", unit: "tonnes", category: "production" },
  { code: "peche_artisanale", label: "Pêche — artisanale", unit: "tonnes", category: "production" },
  { code: "peche_export_vol", label: "Pêche — exportations volume", unit: "tonnes", category: "production" },
  // Environnement international
  { code: "brent", label: "Brent (pétrole)", unit: "$/baril", category: "environnement" },
  { code: "eur_usd", label: "Taux de change EUR/USD", unit: "ratio", category: "environnement" },
  { code: "usd_cfa", label: "Taux de change USD/CFA", unit: "FCFA", category: "environnement" },
  // Finances
  { code: "recettes_fiscales", label: "Recettes fiscales", unit: "Mds FCFA", category: "finances" },
  { code: "tva", label: "TVA intérieure", unit: "Mds FCFA", category: "finances" },
  { code: "douanes", label: "Recettes douanières", unit: "Mds FCFA", category: "finances" },
  { code: "recettes_non_fiscales", label: "Recettes non fiscales", unit: "Mds FCFA", category: "finances" },
  { code: "masse_salariale", label: "Masse salariale", unit: "Mds FCFA", category: "finances" },
  { code: "effectifs", label: "Effectifs fonction publique", unit: "personnes", category: "finances" },
  // Transport
  { code: "maritime_embarquements", label: "Trafic maritime — embarquements", unit: "milliers tonnes", category: "transport" },
  { code: "maritime_debarquements", label: "Trafic maritime — débarquements", unit: "milliers tonnes", category: "transport" },
  { code: "aerien_mouvements", label: "Transport aérien — mouvements", unit: "nombre", category: "transport" },
  { code: "aerien_passagers", label: "Transport aérien — passagers", unit: "nombre", category: "transport" },
  { code: "aerien_fret", label: "Transport aérien — fret", unit: "tonnes", category: "transport" },
  // Commerce extérieur
  { code: "import_riz", label: "Importations — riz", unit: "milliers tonnes", category: "echanges" },
  { code: "import_ble", label: "Importations — blé", unit: "milliers tonnes", category: "echanges" },
  { code: "import_petrole_brut", label: "Importations — pétrole brut", unit: "milliers tonnes", category: "echanges" },
  { code: "import_hydrocarbures", label: "Importations — hydrocarbures raffinés", unit: "milliers tonnes", category: "echanges" },
  { code: "export_arachide", label: "Exportations — arachide vol.", unit: "milliers tonnes", category: "echanges" },
  { code: "export_peche", label: "Exportations — pêche", unit: "milliers tonnes", category: "echanges" },
  { code: "arachide_valeur", label: "Arachide — valeur exportation", unit: "Mds FCFA", category: "echanges" },
  // Prix nationaux
  { code: "prix_oignon_local", label: "Prix oignon local", unit: "FCFA/kg", category: "prix" },
  { code: "prix_oignon_importe", label: "Prix oignon importé", unit: "FCFA/kg", category: "prix" },
  { code: "prix_millet_souna", label: "Prix millet souna", unit: "FCFA/kg", category: "prix" },
  { code: "prix_sorgho", label: "Prix sorgho", unit: "FCFA/kg", category: "prix" },
  { code: "prix_mais", label: "Prix maïs", unit: "FCFA/kg", category: "prix" },
  { code: "prix_riz_parfume_luxe", label: "Prix riz parfumé luxe", unit: "FCFA/kg", category: "prix" },
  { code: "prix_riz_parfume_ord", label: "Prix riz parfumé ordinaire", unit: "FCFA/kg", category: "prix" },
  { code: "prix_riz_non_parfume", label: "Prix riz non parfumé", unit: "FCFA/kg", category: "prix" },
  { code: "prix_riz_indien_ord", label: "Prix riz indien ordinaire", unit: "FCFA/kg", category: "prix" },
  { code: "prix_riz_brise_local", label: "Prix riz brisé local", unit: "FCFA/kg", category: "prix" },
];

// Regional price indicators (one per product × region, category = "prix_regional")
const PRIX_PRODUCTS = [
  "oignon_local", "oignon_importe", "millet_souna", "sorgho", "mais",
  "riz_brise_parfume_luxe", "riz_brise_parfume_ordinaire",
  "riz_brise_non_parfume", "riz_brise_indien_ordinaire", "riz_brise_local",
];

const REGIONS = [
  { code: "dakar", label: "Dakar", geoName: "Dakar" },
  { code: "thies", label: "Thiès", geoName: "Thiès" },
  { code: "diourbel", label: "Diourbel", geoName: "Diourbel" },
  { code: "louga", label: "Louga", geoName: "Louga" },
  { code: "saint_louis", label: "Saint-Louis", geoName: "Saint-Louis" },
  { code: "matam", label: "Matam", geoName: "Matam" },
  { code: "fatick", label: "Fatick", geoName: "Fatick" },
  { code: "kaolack", label: "Kaolack", geoName: "Kaolack" },
  { code: "tambacounda", label: "Tambacounda", geoName: "Tambacounda" },
  { code: "kolda", label: "Kolda", geoName: "Kolda" },
  { code: "ziguinchor", label: "Ziguinchor", geoName: "Ziguinchor" },
  { code: "kaffrine", label: "Kaffrine", geoName: "Kaffrine" },
  { code: "kedougou", label: "Kédougou", geoName: "Kédougou" },
  { code: "sedhiou", label: "Sédhiou", geoName: "Sédhiou" },
];

// Map region label from JSON → region code
const REGION_KEY_MAP = {
  "Dakar": "dakar", "Thiès": "thies", "Diourbel": "diourbel",
  "Louga": "louga", "St louis": "saint_louis", "Matam": "matam",
  "Fatick": "fatick", "Kaolack": "kaolack", "Tamba": "tambacounda",
  "Kolda": "kolda", "Ziguinchor": "ziguinchor", "Prix Moyen": null,
};

// ── Helpers ──────────────────────────────────────────────────
function flatSeries(data) {
  // { "2006-01-01": { "value": 123, ... }, ... } → [{ date, value }]
  return Object.entries(data)
    .filter(([, v]) => v?.value != null)
    .map(([d, v]) => ({ date: d, value: v.value }));
}

async function insertBatch(rows) {
  if (!rows.length) return 0;
  // Batch in chunks of 500 (Neon HTTP has payload limits)
  let total = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    await db.insert(observations).values(chunk).onConflictDoNothing();
    total += chunk.length;
  }
  return total;
}

// ── Main ─────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Starting seed...\n");

  // 1. Create tables via raw SQL (DDL)
  console.log("📐 Creating tables...");
  await sql`
    CREATE TABLE IF NOT EXISTS indicators (
      id SERIAL PRIMARY KEY,
      code VARCHAR(80) UNIQUE NOT NULL,
      label VARCHAR(200) NOT NULL,
      unit VARCHAR(50),
      category VARCHAR(50)
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS regions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      label VARCHAR(100) NOT NULL,
      geo_name VARCHAR(100)
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS observations (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      indicator_id INT REFERENCES indicators(id) NOT NULL,
      region_id INT REFERENCES regions(id),
      value DOUBLE PRECISION
    )`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS obs_unique
    ON observations (date, indicator_id, COALESCE(region_id, -1))`;
  await sql`
    CREATE TABLE IF NOT EXISTS ingestions (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255),
      records_inserted INT,
      run_at TIMESTAMP DEFAULT NOW()
    )`;

  // 2. Seed indicators
  console.log(`📊 Inserting ${INDICATORS.length} indicators...`);
  for (const ind of INDICATORS) {
    await db.insert(indicators).values(ind).onConflictDoNothing();
  }

  // 3. Seed regions
  console.log(`🗺️  Inserting ${REGIONS.length} regions...`);
  for (const reg of REGIONS) {
    await db.insert(regions).values(reg).onConflictDoNothing();
  }

  // Build lookup maps: code → id
  const allInd = await db.select().from(indicators);
  const indMap = Object.fromEntries(allInd.map((r) => [r.code, r.id]));

  const allReg = await db.select().from(regions);
  const regMap = Object.fromEntries(allReg.map((r) => [r.code, r.id]));

  let totalRows = 0;

  // 4. Sectors
  console.log("📈 Seeding sectors...");
  const sectors = json("sectors.json");
  for (const key of ["primaire_brute", "secondaire_brute", "tertiaire_brute", "commerce_brute"]) {
    const rows = flatSeries(sectors[key]).map((r) => ({
      date: r.date, indicatorId: indMap[key], regionId: null, value: r.value,
    }));
    totalRows += await insertBatch(rows);
  }

  // 5. Or
  console.log("🥇 Seeding or...");
  const orData = json("or.json");
  totalRows += await insertBatch(
    flatSeries(orData).map((r) => ({ date: r.date, indicatorId: indMap["or"], regionId: null, value: r.value }))
  );

  // 6. Ciment
  console.log("🏗️  Seeding ciment...");
  const ciment = json("ciment.json");
  for (const [jsonKey, code] of [["production", "ciment_production"], ["ventes_locales", "ciment_ventes_locales"], ["exportations", "ciment_exportations"]]) {
    totalRows += await insertBatch(
      flatSeries(ciment[jsonKey]).map((r) => ({ date: r.date, indicatorId: indMap[code], regionId: null, value: r.value }))
    );
  }

  // 7. Brent + Change
  console.log("🛢️  Seeding brent & change...");
  totalRows += await insertBatch(
    flatSeries(json("brent.json")).map((r) => ({ date: r.date, indicatorId: indMap["brent"], regionId: null, value: r.value }))
  );
  const change = json("change.json");
  for (const code of ["eur_usd", "usd_cfa"]) {
    totalRows += await insertBatch(
      flatSeries(change[code]).map((r) => ({ date: r.date, indicatorId: indMap[code], regionId: null, value: r.value }))
    );
  }

  // 8. Recettes fiscales + Finances détail
  console.log("💰 Seeding finances...");
  totalRows += await insertBatch(
    flatSeries(json("recettes_fiscales.json")).map((r) => ({ date: r.date, indicatorId: indMap["recettes_fiscales"], regionId: null, value: r.value }))
  );
  const fin = json("finances.json");
  for (const code of ["tva", "douanes", "recettes_non_fiscales", "masse_salariale", "effectifs"]) {
    totalRows += await insertBatch(
      flatSeries(fin[code]).map((r) => ({ date: r.date, indicatorId: indMap[code], regionId: null, value: r.value }))
    );
  }

  // 9. Transport
  console.log("✈️  Seeding transport...");
  const maritime = json("trafic_maritime.json");
  for (const [jsonKey, code] of [["embarquements_total", "maritime_embarquements"], ["debarquements_total", "maritime_debarquements"]]) {
    totalRows += await insertBatch(
      flatSeries(maritime[jsonKey]).map((r) => ({ date: r.date, indicatorId: indMap[code], regionId: null, value: r.value }))
    );
  }
  const aerien = json("transport_aerien.json");
  for (const [jsonKey, code] of [["mouvements", "aerien_mouvements"], ["passagers", "aerien_passagers"], ["fret", "aerien_fret"]]) {
    totalRows += await insertBatch(
      flatSeries(aerien[jsonKey]).map((r) => ({ date: r.date, indicatorId: indMap[code], regionId: null, value: r.value }))
    );
  }

  // 10. Pêche
  console.log("🐟 Seeding pêche...");
  const peche = json("peche.json");
  for (const [jsonKey, code] of [
    ["debarquements_total", "peche_total"], ["debarquements_industrielle", "peche_industrielle"],
    ["debarquements_artisanale", "peche_artisanale"], ["exportations_volume", "peche_export_vol"],
  ]) {
    totalRows += await insertBatch(
      flatSeries(peche[jsonKey]).map((r) => ({ date: r.date, indicatorId: indMap[code], regionId: null, value: r.value }))
    );
  }

  // 11. Échanges
  console.log("🔄 Seeding échanges...");
  const ech = json("echanges.json");
  for (const [jsonKey, code] of [
    ["riz", "import_riz"], ["ble", "import_ble"],
    ["petrole_brut", "import_petrole_brut"], ["hydrocarbures_raffines", "import_hydrocarbures"],
  ]) {
    totalRows += await insertBatch(
      flatSeries(ech.imports[jsonKey]).map((r) => ({ date: r.date, indicatorId: indMap[code], regionId: null, value: r.value }))
    );
  }
  for (const [jsonKey, code] of [["arachide", "export_arachide"], ["peche", "export_peche"]]) {
    totalRows += await insertBatch(
      flatSeries(ech.exports[jsonKey]).map((r) => ({ date: r.date, indicatorId: indMap[code], regionId: null, value: r.value }))
    );
  }
  totalRows += await insertBatch(
    flatSeries(ech.arachide_valeur).map((r) => ({ date: r.date, indicatorId: indMap["arachide_valeur"], regionId: null, value: r.value }))
  );

  // 12. Prix nationaux
  console.log("🏷️  Seeding prix nationaux...");
  const prix = json("prix_vivriers.json");
  const prixCodeMap = {
    oignon_local: "prix_oignon_local", oignon_importe: "prix_oignon_importe",
    millet_souna: "prix_millet_souna", sorgho: "prix_sorgho", mais: "prix_mais",
    riz_brise_parfume_luxe: "prix_riz_parfume_luxe", riz_brise_parfume_ordinaire: "prix_riz_parfume_ord",
    riz_brise_non_parfume: "prix_riz_non_parfume", riz_brise_indien_ordinaire: "prix_riz_indien_ord",
    riz_brise_local: "prix_riz_brise_local",
  };
  for (const [jsonKey, code] of Object.entries(prixCodeMap)) {
    if (!prix[jsonKey]) continue;
    totalRows += await insertBatch(
      flatSeries(prix[jsonKey]).map((r) => ({ date: r.date, indicatorId: indMap[code], regionId: null, value: r.value }))
    );
  }

  // 13. Prix régionaux
  console.log("🗺️  Seeding prix régionaux...");
  const regPrix = json("prix_regionaux.json");
  // Insert regional price indicators dynamically
  for (const prod of PRIX_PRODUCTS) {
    const code = `prix_reg_${prod}`;
    await db.insert(indicators).values({
      code, label: `Prix régional — ${prod.replace(/_/g, " ")}`, unit: "FCFA/kg", category: "prix_regional",
    }).onConflictDoNothing();
  }
  // Refresh indicator map
  const allInd2 = await db.select().from(indicators);
  const indMap2 = Object.fromEntries(allInd2.map((r) => [r.code, r.id]));

  for (const [blockLabel, blockData] of Object.entries(regPrix)) {
    // Extract a date from the block label: "Janvier 2019" → "2019-01-01"
    const dateMatch = blockLabel.match(/(\w+)\s+(\d{4})/);
    if (!dateMatch) continue;
    const monthNames = { janvier: "01", "février": "02", mars: "03", avril: "04", mai: "05", juin: "06",
      juillet: "07", "août": "08", septembre: "09", octobre: "10", novembre: "11", "décembre": "12" };
    const mm = monthNames[dateMatch[1].toLowerCase()];
    if (!mm) continue;
    const dateStr = `${dateMatch[2]}-${mm}-01`;

    for (const [regionLabel, products] of Object.entries(blockData)) {
      const regionCode = REGION_KEY_MAP[regionLabel];
      if (regionCode === undefined) continue; // skip unknown
      const rId = regionCode ? regMap[regionCode] : null;

      const rows = [];
      for (const prod of PRIX_PRODUCTS) {
        const val = products[prod];
        if (val == null) continue;
        rows.push({ date: dateStr, indicatorId: indMap2[`prix_reg_${prod}`], regionId: rId, value: val });
      }
      totalRows += await insertBatch(rows);
    }
  }

  // 14. Log ingestion
  await db.insert(ingestions).values({ filename: "seed.mjs (bulk from JSON)", recordsInserted: totalRows });

  console.log(`\n✅ Seed complete: ${totalRows.toLocaleString()} observations inserted.`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
