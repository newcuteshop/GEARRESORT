"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/actions/auth";

type ActionResult<T = unknown> = { data?: T; error?: string };

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentUserWithRole();
  if (!me) return { error: "ไม่ได้เข้าสู่ระบบ" };
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  if (!full_name) return { error: "กรุณาระบุชื่อ" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone })
    .eq("id", me.id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { data: { ok: true } };
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { error: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { data: { ok: true } };
}
