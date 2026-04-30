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
