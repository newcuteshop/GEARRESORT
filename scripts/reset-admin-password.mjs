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

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/reset-admin-password.mjs <email> <password>");
  process.exit(1);
}

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: list, error: listErr } = await admin.auth.admin.listUsers();
if (listErr) {
  console.error(listErr);
  process.exit(1);
}
const user = list.users.find((u) => u.email === email);
if (!user) {
  console.error(`User ${email} not found`);
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
});
if (error) {
  console.error(error);
  process.exit(1);
}
console.log(`✓ Password reset for ${email}`);
