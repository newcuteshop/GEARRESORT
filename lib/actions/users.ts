"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServer } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserWithRole } from "@/lib/actions/auth";

type ActionResult<T = unknown> = { data?: T; error?: string };

export async function listUsers() {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, is_active, created_at")
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };
  return { data };
}

export async function inviteUser(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentUserWithRole();
  if (me?.profile.role !== "admin") return { error: "เฉพาะผู้ดูแลระบบ" };

  const email = String(formData.get("email") ?? "").trim();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "receptionist");
  const password = String(formData.get("password") ?? "");

  if (!email || !full_name || !password)
    return { error: "กรอกข้อมูลให้ครบ" };
  if (password.length < 6) return { error: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" };

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });
  if (error) return { error: error.message };

  await admin.from("profiles").upsert(
    {
      id: created.user.id,
      email,
      full_name,
      role: role as "admin" | "receptionist" | "housekeeping",
      is_active: true,
    },
    { onConflict: "id" },
  );

  revalidatePath("/settings");
  return { data: { ok: true } };
}

export async function setUserActive(
  id: string,
  is_active: boolean,
): Promise<ActionResult> {
  const me = await getCurrentUserWithRole();
  if (me?.profile.role !== "admin") return { error: "เฉพาะผู้ดูแลระบบ" };
  const supabase = await createServer();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: { ok: true } };
}

export async function setUserRole(
  id: string,
  role: "admin" | "receptionist" | "housekeeping",
): Promise<ActionResult> {
  const me = await getCurrentUserWithRole();
  if (me?.profile.role !== "admin") return { error: "เฉพาะผู้ดูแลระบบ" };
  const supabase = await createServer();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: { ok: true } };
}
