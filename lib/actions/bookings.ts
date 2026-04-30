"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/actions/auth";
import { bookingSchema } from "@/lib/validations/booking";
import { calcNights } from "@/lib/format";
import { VAT_RATE } from "@/lib/constants";

type ActionResult<T = unknown> = { data?: T; error?: string };

export async function listBookings(filter?: {
  status?: string;
  from?: string;
  to?: string;
}) {
  const supabase = await createClient();
  let q = supabase
    .from("bookings")
    .select(
      "id, booking_code, status, check_in_date, check_out_date, num_adults, num_children, grand_total, created_at, guest:guests(id, full_name, phone), room:rooms(id, room_number, room_type:room_types(name))",
    )
    .order("check_in_date", { ascending: false })
    .limit(200);

  if (filter?.status) q = q.eq("status", filter.status);
  if (filter?.from) q = q.gte("check_in_date", filter.from);
  if (filter?.to) q = q.lte("check_out_date", filter.to);

  const { data, error } = await q;
  if (error) return { error: error.message };
  return { data };
}

export async function listBookingsForCalendar(from: string, to: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_code, status, check_in_date, check_out_date, guest:guests(full_name), room:rooms(id, room_number)",
    )
    .gte("check_out_date", from)
    .lte("check_in_date", to)
    .not("status", "in", "(cancelled,no_show)")
    .order("check_in_date");
  if (error) return { error: error.message };

  const { data: rooms, error: rErr } = await supabase
    .from("rooms")
    .select("id, room_number")
    .eq("is_active", true)
    .order("room_number");
  if (rErr) return { error: rErr.message };

  return { data: { bookings: data ?? [], rooms: rooms ?? [] } };
}

export async function getBooking(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, guest:guests(*), room:rooms(id, room_number, floor, room_type:room_types(id, name, base_price, max_occupancy))",
    )
    .eq("id", id)
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function getBookingInvoice(bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, payment_status, total, paid_amount")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (error) return { error: error.message };
  return { data };
}

export async function listAvailableRooms(input: {
  check_in_date: string;
  check_out_date: string;
  excludeBookingId?: string;
}) {
  const supabase = await createClient();
  const { data: rooms, error: roomsErr } = await supabase
    .from("rooms")
    .select(
      "id, room_number, floor, status, room_type:room_types(id, name, base_price, max_occupancy)",
    )
    .eq("is_active", true)
    .order("room_number");
  if (roomsErr) return { error: roomsErr.message };

  const { data: overlapping, error: bErr } = await supabase
    .from("bookings")
    .select("id, room_id")
    .not("status", "in", "(cancelled,no_show,checked_out)")
    .lt("check_in_date", input.check_out_date)
    .gt("check_out_date", input.check_in_date);
  if (bErr) return { error: bErr.message };

  const busyRoomIds = new Set(
    (overlapping ?? [])
      .filter((b) => b.id !== input.excludeBookingId)
      .map((b) => b.room_id),
  );

  return {
    data: (rooms ?? []).map((r) => ({
      ...r,
      busy: busyRoomIds.has(r.id),
    })),
  };
}

function calcPricing(
  basePrice: number,
  checkIn: string,
  checkOut: string,
  discount: number,
  applyVat: boolean,
) {
  const nights = calcNights(checkIn, checkOut);
  const subtotal = basePrice * nights;
  const taxableBase = Math.max(0, subtotal - discount);
  const tax = applyVat ? Math.round(taxableBase * VAT_RATE) : 0;
  return { nights, subtotal, tax, grand: taxableBase + tax };
}

export async function createBooking(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = bookingSchema.safeParse({
    ...raw,
    apply_vat: raw.apply_vat === "on" || raw.apply_vat === "true",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const user = await getCurrentUserWithRole();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const supabase = await createClient();

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select("room_type:room_types(base_price)")
    .eq("id", parsed.data.room_id)
    .single();
  if (roomErr || !room) return { error: "ไม่พบห้อง" };
  const roomType = Array.isArray(room.room_type)
    ? room.room_type[0]
    : room.room_type;
  const basePrice = Number(roomType?.base_price ?? 0);

  const { subtotal, tax, grand } = calcPricing(
    basePrice,
    parsed.data.check_in_date,
    parsed.data.check_out_date,
    parsed.data.discount_amount,
    parsed.data.apply_vat,
  );

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      guest_id: parsed.data.guest_id,
      room_id: parsed.data.room_id,
      check_in_date: parsed.data.check_in_date,
      check_out_date: parsed.data.check_out_date,
      num_adults: parsed.data.num_adults,
      num_children: parsed.data.num_children,
      notes: parsed.data.notes,
      source: parsed.data.source,
      total_amount: subtotal,
      discount_amount: parsed.data.discount_amount,
      tax_amount: tax,
      grand_total: grand,
      status: "pending",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("invoices").insert({
    booking_id: booking.id,
    subtotal,
    discount: parsed.data.discount_amount,
    tax,
    total: grand,
    payment_status: "unpaid",
  });

  revalidatePath("/bookings");
  revalidatePath("/");
  return { data: { id: booking.id } };
}

export async function updateBooking(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = bookingSchema.safeParse({
    ...raw,
    apply_vat: raw.apply_vat === "on" || raw.apply_vat === "true",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("room_type:room_types(base_price)")
    .eq("id", parsed.data.room_id)
    .single();
  const roomType = Array.isArray(room?.room_type)
    ? room?.room_type[0]
    : room?.room_type;
  const basePrice = Number(roomType?.base_price ?? 0);

  const { subtotal, tax, grand } = calcPricing(
    basePrice,
    parsed.data.check_in_date,
    parsed.data.check_out_date,
    parsed.data.discount_amount,
    parsed.data.apply_vat,
  );

  const { error } = await supabase
    .from("bookings")
    .update({
      guest_id: parsed.data.guest_id,
      room_id: parsed.data.room_id,
      check_in_date: parsed.data.check_in_date,
      check_out_date: parsed.data.check_out_date,
      num_adults: parsed.data.num_adults,
      num_children: parsed.data.num_children,
      notes: parsed.data.notes,
      source: parsed.data.source,
      total_amount: subtotal,
      discount_amount: parsed.data.discount_amount,
      tax_amount: tax,
      grand_total: grand,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase
    .from("invoices")
    .update({ subtotal, discount: parsed.data.discount_amount, tax, total: grand })
    .eq("booking_id", id);

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
  return { data: { id } };
}

export async function updateBookingStatus(
  id: string,
  next:
    | "pending"
    | "confirmed"
    | "checked_in"
    | "checked_out"
    | "cancelled"
    | "no_show",
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, room_id, guest_id, grand_total")
    .eq("id", id)
    .single();
  if (fetchErr || !existing) return { error: "ไม่พบการจอง" };

  const update: Record<string, unknown> = { status: next };
  if (next === "checked_in") update.actual_check_in_at = new Date().toISOString();
  if (next === "checked_out") update.actual_check_out_at = new Date().toISOString();

  const { error } = await supabase.from("bookings").update(update).eq("id", id);
  if (error) return { error: error.message };

  if (next === "checked_in") {
    await supabase
      .from("rooms")
      .update({ status: "occupied" })
      .eq("id", existing.room_id);
  }
  if (next === "checked_out") {
    await supabase
      .from("rooms")
      .update({ status: "cleaning" })
      .eq("id", existing.room_id);

    await supabase.from("housekeeping_tasks").insert({
      room_id: existing.room_id,
      task_type: "cleaning",
      priority: "high",
      status: "pending",
      notes: "ทำความสะอาดหลังเช็คเอาท์",
    });

    if (existing.guest_id) {
      const { data: g } = await supabase
        .from("guests")
        .select("total_stays, total_spent")
        .eq("id", existing.guest_id)
        .single();
      await supabase
        .from("guests")
        .update({
          total_stays: (g?.total_stays ?? 0) + 1,
          total_spent:
            Number(g?.total_spent ?? 0) + Number(existing.grand_total ?? 0),
          last_stay_at: new Date().toISOString(),
        })
        .eq("id", existing.guest_id);
    }
  }

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
  revalidatePath("/rooms");
  revalidatePath("/");
  return { data: { ok: true } };
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/bookings");
  return { data: { ok: true } };
}
