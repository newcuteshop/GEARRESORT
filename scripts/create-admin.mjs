// Creates the first admin user via Supabase admin API.
// Usage: node scripts/create-admin.mjs <email> <password> <full_name>

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local manually
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
if (!url || !serviceKey) {
  console.error("Missing SUPABASE env in .env.local");
  process.exit(1);
}

const [email, password, ...nameParts] = process.argv.slice(2);
const fullName = nameParts.join(" ");
if (!email || !password || !fullName) {
  console.error(
    'Usage: node scripts/create-admin.mjs <email> <password> "<full name>"',
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`Creating user ${email}...`);
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, role: "admin" },
});

if (createErr) {
  if (createErr.message?.includes("already")) {
    console.log("User already exists — looking up id...");
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list.users.find((u) => u.email === email);
    if (!existing) {
      console.error("Could not find user");
      process.exit(1);
    }
    console.log(`Found existing user: ${existing.id}`);
    var userId = existing.id;
  } else {
    console.error(createErr);
    process.exit(1);
  }
} else {
  var userId = created.user.id;
  console.log(`✓ Created user: ${userId}`);
}

// Ensure profile row exists with role=admin
const { error: upsertErr } = await admin.from("profiles").upsert(
  {
    id: userId,
    email,
    full_name: fullName,
    role: "admin",
    is_active: true,
  },
  { onConflict: "id" },
);

if (upsertErr) {
  console.error("Profile upsert failed:", upsertErr);
  process.exit(1);
}
console.log("✓ Profile set to role=admin");
console.log(`\nLogin at /login with:\n  email:    ${email}\n  password: ${password}`);
