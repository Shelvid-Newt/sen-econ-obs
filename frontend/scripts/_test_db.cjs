const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
sql`SELECT 1 as ok`
  .then((r) => console.log("✅ Connected to Neon:", JSON.stringify(r)))
  .catch((e) => console.error("❌ Connection failed:", e.message));
