"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServer } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserWithRole } from "@/lib/actions/auth";
import { toLoginEmail } from "@/lib/auth/username";
import type { MenuKey } from "@/lib/actions/auth";

type ActionResult<T = unknown> = { data?: T; error?: string };

const ALL_MENUS: MenuKey[] = [
  "dashboard",
  "bookings",
  "rooms",
  "rooms_types",
  "guests",
  "billing",
  "housekeeping",
  "settings",
];

export async function listUsers() {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, phone, role, is_active, permissions, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };
  return { data };
}

export async function inviteUser(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentUserWithRole();
  if (me?.profile.role !== "admin") return { error: "เฉพาะผู้ดูแลระบบ" };

  const usernameRaw = String(formData.get("email") ?? "").trim();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "receptionist");
  const password = String(formData.get("password") ?? "");
  const permsRaw = formData.getAll("permissions").map((v) => String(v));
  const permissions = permsRaw.filter((p) =>
    ALL_MENUS.includes(p as MenuKey),
  );

  if (!usernameRaw || !full_name || !password)
    return { error: "กรอกข้อมูลให้ครบ" };

  const email = toLoginEmail(usernameRaw);

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
      permissions,
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

export async function setUserPermissions(
  id: string,
  permissions: MenuKey[],
): Promise<ActionResult> {
  const me = await getCurrentUserWithRole();
  if (me?.profile.role !== "admin") return { error: "เฉพาะผู้ดูแลระบบ" };
  const cleaned = permissions.filter((p) => ALL_MENUS.includes(p));
  const supabase = await createServer();
  const { error } = await supabase
    .from("profiles")
    .update({ permissions: cleaned })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: { ok: true } };
}

export async function resetUserPassword(
  id: string,
  password: string,
): Promise<ActionResult> {
  const me = await getCurrentUserWithRole();
  if (me?.profile.role !== "admin") return { error: "เฉพาะผู้ดูแลระบบ" };
  if (!password) return { error: "กรุณาระบุรหัสผ่านใหม่" };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };
  return { data: { ok: true } };
}

export async function updateUser(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const me = await getCurrentUserWithRole();
  if (me?.profile.role !== "admin") return { error: "เฉพาะผู้ดูแลระบบ" };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const usernameRaw = String(formData.get("username") ?? "").trim();
  if (!full_name) return { error: "กรุณาระบุชื่อ" };

  const supabase = await createServer();
  const update: Record<string, unknown> = { full_name, phone };
  if (usernameRaw) {
    update.email = toLoginEmail(usernameRaw);
  }
  const { error } = await supabase.from("profiles").update(update).eq("id", id);
  if (error) return { error: error.message };

  // ถ้าเปลี่ยน username ก็อัปเดตใน auth.users ด้วย
  if (usernameRaw) {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(id, {
      email: toLoginEmail(usernameRaw),
    });
  }

  revalidatePath("/settings");
  return { data: { ok: true } };
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const me = await getCurrentUserWithRole();
  if (me?.profile.role !== "admin") return { error: "เฉพาะผู้ดูแลระบบ" };
  if (me.id === id) return { error: "ลบบัญชีของตัวเองไม่ได้" };

  const admin = createAdminClient();
  // FK on profiles uses ON DELETE CASCADE จาก auth.users → ลบ profile อัตโนมัติ
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { data: { ok: true } };
}
