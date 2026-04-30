import { z } from "zod";

export const paymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  method: z.enum(["cash", "transfer", "credit_card", "qr_code", "other"]),
  reference_number: z.string().max(100).optional().nullable(),
  slip_url: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const invoiceItemSchema = z.object({
  invoice_id: z.string().uuid(),
  description: z.string().min(1).max(200),
  quantity: z.coerce.number().min(0.01),
  unit_price: z.coerce.number().min(0),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
