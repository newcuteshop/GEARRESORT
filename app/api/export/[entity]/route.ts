import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n"))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return "﻿" + lines.join("\n");
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ entity: string }> },
) {
  const { entity } = await ctx.params;
  const supabase = await createClient();

  // RLS เป็นตัวควบคุมว่า user คนนี้ดูได้หรือไม่
  let rows: Record<string, unknown>[] = [];
  let filename = "export.csv";

  if (entity === "bookings") {
    const { data } = await supabase
      .from("bookings")
      .select(
        "booking_code, status, check_in_date, check_out_date, num_adults, num_children, total_amount, discount_amount, tax_amount, grand_total, source, notes, created_at, guest:guests(full_name, phone, email), room:rooms(room_number)",
      )
      .order("created_at", { ascending: false });
    rows = (data ?? []).map((b) => {
      const guest = Array.isArray(b.guest) ? b.guest[0] : b.guest;
      const room = Array.isArray(b.room) ? b.room[0] : b.room;
      return {
        booking_code: b.booking_code,
        status: b.status,
        guest_name: guest?.full_name ?? "",
        guest_phone: guest?.phone ?? "",
        guest_email: guest?.email ?? "",
        room_number: room?.room_number ?? "",
        check_in: b.check_in_date,
        check_out: b.check_out_date,
        adults: b.num_adults,
        children: b.num_children,
        total: b.total_amount,
        discount: b.discount_amount,
        tax: b.tax_amount,
        grand_total: b.grand_total,
        source: b.source,
        notes: b.notes ?? "",
        created_at: b.created_at,
      };
    });
    filename = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (entity === "guests") {
    const { data } = await supabase
      .from("guests")
      .select(
        "full_name, email, phone, id_card_number, nationality, address, guest_type, total_stays, total_spent, last_stay_at, created_at",
      )
      .order("created_at", { ascending: false });
    rows = (data ?? []) as Record<string, unknown>[];
    filename = `guests-${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (entity === "invoices") {
    const { data } = await supabase
      .from("invoices")
      .select(
        "invoice_number, total, paid_amount, payment_status, due_date, created_at, booking:bookings(booking_code, guest:guests(full_name))",
      )
      .order("created_at", { ascending: false });
    rows = (data ?? []).map((inv) => {
      const booking = Array.isArray(inv.booking) ? inv.booking[0] : inv.booking;
      const guest = Array.isArray(booking?.guest)
        ? booking?.guest[0]
        : booking?.guest;
      return {
        invoice_number: inv.invoice_number,
        booking_code: booking?.booking_code ?? "",
        guest_name: guest?.full_name ?? "",
        total: inv.total,
        paid_amount: inv.paid_amount,
        payment_status: inv.payment_status,
        due_date: inv.due_date,
        created_at: inv.created_at,
      };
    });
    filename = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    return new Response("Unknown entity", { status: 404 });
  }

  const csv = toCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
