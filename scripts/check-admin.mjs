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

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data, error } = await admin
  .from("profiles")
  .select("id, email, full_name, role, is_active");
if (error) {
  console.error(error);
  process.exit(1);
}
console.log("Profiles:");
for (const p of data) {
  console.log(`  ${p.email}  role=${p.role}  active=${p.is_active}  name=${p.full_name}`);
}
