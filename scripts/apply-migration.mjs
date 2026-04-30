// Applies a SQL file to Supabase via the Management API.
// Usage: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-migration.mjs supabase/migrations/0001_initial_schema.sql

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "xlnrlrbymknaytgellsh";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const file = process.argv[2];

if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN env");
  process.exit(1);
}
if (!file) {
  console.error("Usage: node apply-migration.mjs <sql-file>");
  process.exit(1);
}

const sql = readFileSync(resolve(file), "utf8");
console.log(`Applying ${file} (${sql.length} chars) to project ${PROJECT_REF}...`);

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  },
);

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}`);
  console.error(text);
  process.exit(1);
}
console.log("✓ Migration applied");
console.log(text.length > 2000 ? text.slice(0, 2000) + "…" : text);
