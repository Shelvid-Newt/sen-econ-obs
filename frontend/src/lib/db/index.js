import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

/**
 * Serverless-friendly DB connection.
 * Neon HTTP driver: one roundtrip per query, no persistent connection.
 * Perfect for Vercel serverless functions.
 */
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
