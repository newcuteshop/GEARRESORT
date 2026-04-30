"use server";

import { createClient } from "@/lib/supabase/server";

export async function quickSearch(term: string) {
  const t = term.trim();
  if (!t) return { data: { bookings: [], guests: [], rooms: [] } };
  const supabase = await createClient();
  const like = `%${t}%`;

  const [bookings, guests, rooms] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, booking_code, status, guest:guests(full_name), room:rooms(room_number)",
      )
      .ilike("booking_code", like)
      .limit(5),
    supabase
      .from("guests")
      .select("id, full_name, phone, email")
      .or(`full_name.ilike.${like},phone.ilike.${like},email.ilike.${like}`)
      .limit(5),
    supabase
      .from("rooms")
      .select("id, room_number, status")
      .ilike("room_number", like)
      .limit(5),
  ]);

  return {
    data: {
      bookings: bookings.data ?? [],
      guests: guests.data ?? [],
      rooms: rooms.data ?? [],
    },
  };
}
