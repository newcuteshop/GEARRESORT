"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/actions/auth";
import { paymentSchema, invoiceItemSchema } from "@/lib/validations/payment";

type ActionResult<T = unknown> = { data?: T; error?: string };

export async function listInvoices(filter?: { status?: string }) {
  const supabase = await createClient();
  let q = supabase
    .from("invoices")
    .select(
      "id, invoice_number, total, paid_amount, payment_status, due_date, created_at, booking:bookings(id, booking_code, guest:guests(id, full_name), room:rooms(room_number))",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter?.status) q = q.eq("payment_status", filter.status);
  const { data, error } = await q;
  if (error) return { error: error.message };
  return { data };
}

export async function getInvoice(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "*, booking:bookings(*, guest:guests(id, full_name, phone, email), room:rooms(room_number, room_type:room_types(name)))",
    )
    .eq("id", id)
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function listInvoiceItems(invoiceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at");
  if (error) return { error: error.message };
  return { data };
}

export async function listPayments(invoiceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "*, recorder:profiles(full_name)",
    )
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: false });
  if (error) return { error: error.message };
  return { data };
}

export async function addInvoiceItem(formData: FormData): Promise<ActionResult> {
  const parsed = invoiceItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("invoice_items").insert(parsed.data);
  if (error) return { error: error.message };

  // Recalculate invoice totals from items
  const { data: items } = await supabase
    .from("invoice_items")
    .select("amount")
    .eq("invoice_id", parsed.data.invoice_id);
  const itemsSubtotal = (items ?? []).reduce(
    (acc, it) => acc + Number(it.amount ?? 0),
    0,
  );
  const { data: inv } = await supabase
    .from("invoices")
    .select("subtotal, discount, tax, booking:bookings(total_amount)")
    .eq("id", parsed.data.invoice_id)
    .single();
  const booking = Array.isArray(inv?.booking) ? inv?.booking[0] : inv?.booking;
  const baseSubtotal = Number(booking?.total_amount ?? 0);
  const newSubtotal = baseSubtotal + itemsSubtotal;
  const newTotal = Math.max(
    0,
    newSubtotal - Number(inv?.discount ?? 0) + Number(inv?.tax ?? 0),
  );
  await supabase
    .from("invoices")
    .update({ subtotal: newSubtotal, total: newTotal })
    .eq("id", parsed.data.invoice_id);

  revalidatePath(`/billing/${parsed.data.invoice_id}`);
  return { data: { ok: true } };
}

export async function deleteInvoiceItem(
  itemId: string,
  invoiceId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoice_items")
    .delete()
    .eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath(`/billing/${invoiceId}`);
  return { data: { ok: true } };
}

export async function recordPayment(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const user = await getCurrentUserWithRole();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    ...parsed.data,
    recorded_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/billing/${parsed.data.invoice_id}`);
  revalidatePath("/billing");
  return { data: { ok: true } };
}

export async function uploadPaymentSlip(
  invoiceId: string,
  file: File,
): Promise<ActionResult<{ path: string }>> {
  if (!file || file.size === 0) return { error: "ไม่มีไฟล์" };
  if (file.size > 5 * 1024 * 1024) return { error: "ขนาดเกิน 5MB" };
  if (!file.type.startsWith("image/"))
    return { error: "อัปโหลดได้เฉพาะรูปภาพ" };
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${invoiceId}/${Date.now()}.${ext}`;
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("payment-slips")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: error.message };
  return { data: { path } };
}

export async function getSlipSignedUrl(
  path: string,
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("payment-slips")
    .createSignedUrl(path, 60 * 5);
  if (error) return { error: error.message };
  return { data: { url: data.signedUrl } };
}
