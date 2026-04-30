"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { guestSchema } from "@/lib/validations/guest";

type ActionResult<T = unknown> = { data?: T; error?: string };

export async function listGuests(search?: string) {
  const supabase = await createClient();
  let q = supabase
    .from("guests")
    .select(
      "id, full_name, email, phone, guest_type, total_stays, total_spent, last_stay_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`full_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }

  const { data, error } = await q;
  if (error) return { error: error.message };
  return { data };
}

export async function getGuest(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function getGuestBookings(guestId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_code, status, check_in_date, check_out_date, grand_total, room:rooms(room_number)",
    )
    .eq("guest_id", guestId)
    .order("check_in_date", { ascending: false });
  if (error) return { error: error.message };
  return { data };
}

function parseFormData(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    cleaned[k] = v === "" ? null : v;
  }
  if (!cleaned.nationality) cleaned.nationality = "TH";
  if (!cleaned.guest_type) cleaned.guest_type = "regular";
  return cleaned;
}

export async function createGuest(formData: FormData): Promise<ActionResult> {
  const parsed = guestSchema.safeParse(parseFormData(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/guests");
  return { data: { id: data.id } };
}

export async function updateGuest(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = guestSchema.partial().safeParse(parseFormData(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/guests");
  revalidatePath(`/guests/${id}`);
  return { data: { ok: true } };
}

export async function deleteGuest(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/guests");
  return { data: { ok: true } };
}
