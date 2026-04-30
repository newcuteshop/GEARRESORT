// Checks whether the resort schema is already applied.
// Reads .env.local and queries information_schema via PostgREST RPC.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = readFileSync(resolve(".env.local"), "utf8")
  .split("\n")
  .filter((l) => l && !l.startsWith("#"))
  .reduce((acc, line) => {
    const idx = line.indexOf("=");
    if (idx > 0) acc[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    return acc;
  }, {});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const expectedTables = [
  "profiles",
  "room_types",
  "rooms",
  "guests",
  "bookings",
  "invoices",
  "payments",
  "housekeeping_tasks",
];

console.log(`Checking schema on ${url} ...\n`);
const results = {};
for (const t of expectedTables) {
  const { error, count } = await admin
    .from(t)
    .select("*", { count: "exact", head: true });
  if (error) {
    results[t] = `MISSING (${error.message})`;
  } else {
    results[t] = `OK (rows=${count ?? "?"})`;
  }
}

for (const [t, status] of Object.entries(results)) {
  console.log(`  ${t.padEnd(22)} ${status}`);
}

const missing = Object.entries(results).filter(([, s]) =>
  s.startsWith("MISSING"),
);
console.log(
  `\n${missing.length === 0 ? "✓ All expected tables present — schema looks applied." : `✗ ${missing.length} table(s) missing — migration not applied yet.`}`,
);
