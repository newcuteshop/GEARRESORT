"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_dashboard_stats")
    .select("*")
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function getTodaySchedule() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_code, status, check_in_date, check_out_date, num_adults, num_children, guest:guests(full_name), room:rooms(room_number)",
    )
    .or(`check_in_date.eq.${today},check_out_date.eq.${today}`)
    .not("status", "in", "(cancelled,no_show)")
    .order("check_in_date");
  if (error) return { error: error.message };
  return { data };
}

export async function getRecentBookings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_code, status, check_in_date, check_out_date, grand_total, created_at, guest:guests(full_name), room:rooms(room_number)",
    )
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) return { error: error.message };
  return { data };
}

export async function getRevenue7d() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const { data, error } = await supabase
    .from("bookings")
    .select("created_at, grand_total, status")
    .gte("created_at", since)
    .not("status", "in", "(cancelled,no_show)");
  if (error) return { error: error.message };

  const byDay = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    byDay.set(d, 0);
  }
  for (const row of data ?? []) {
    const day = String(row.created_at).slice(0, 10);
    if (byDay.has(day)) byDay.set(day, (byDay.get(day) ?? 0) + Number(row.grand_total ?? 0));
  }
  return {
    data: Array.from(byDay.entries()).map(([date, total]) => ({ date, total })),
  };
}

export async function getRoomStatusBreakdown() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("status")
    .eq("is_active", true);
  if (error) return { error: error.message };
  const counts: Record<string, number> = {
    available: 0,
    occupied: 0,
    cleaning: 0,
    maintenance: 0,
    out_of_service: 0,
  };
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return { data: counts };
}
