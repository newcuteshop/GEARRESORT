"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { roomSchema, roomTypeSchema } from "@/lib/validations/room";

type ActionResult<T = unknown> = { data?: T; error?: string };

export async function listRooms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "id, room_number, floor, status, notes, is_active, room_type:room_types(id, name, slug, base_price, max_occupancy)",
    )
    .order("room_number");
  if (error) return { error: error.message };
  return { data };
}

export async function listRoomTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_types")
    .select("*")
    .order("base_price");
  if (error) return { error: error.message };
  return { data };
}

export async function listRoomTypesWithCount() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_types")
    .select("*, rooms(count)")
    .order("base_price");
  if (error) return { error: error.message };
  return { data };
}

export async function getRoom(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "id, room_number, floor, status, notes, is_active, room_type_id, room_type:room_types(id, name, slug, base_price, max_occupancy, bed_type, size_sqm, description, amenities)",
    )
    .eq("id", id)
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function updateRoomStatus(
  roomId: string,
  status: "available" | "occupied" | "cleaning" | "maintenance" | "out_of_service",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rooms")
    .update({ status })
    .eq("id", roomId);
  if (error) return { error: error.message };
  revalidatePath("/rooms");
  revalidatePath("/");
  return { data: { ok: true } };
}

export async function createRoom(formData: FormData): Promise<ActionResult> {
  const parsed = roomSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("rooms").insert(parsed.data);
  if (error) return { error: error.message };
  revalidatePath("/rooms");
  return { data: { ok: true } };
}

export async function updateRoom(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = roomSchema.partial().safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("rooms").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/rooms");
  return { data: { ok: true } };
}

export async function deleteRoom(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/rooms");
  return { data: { ok: true } };
}

export async function createRoomType(
  formData: FormData,
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const amenities = String(raw.amenities ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const parsed = roomTypeSchema.safeParse({ ...raw, amenities });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("room_types").insert(parsed.data);
  if (error) return { error: error.message };
  revalidatePath("/rooms/types");
  return { data: { ok: true } };
}

export async function updateRoomType(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const amenities = String(raw.amenities ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const parsed = roomTypeSchema
    .partial()
    .safeParse({ ...raw, amenities });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("room_types")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/rooms/types");
  return { data: { ok: true } };
}

export async function deleteRoomType(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("room_types").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/rooms/types");
  return { data: { ok: true } };
}
