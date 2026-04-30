import { z } from "zod";

export const bookingSchema = z
  .object({
    guest_id: z.string().uuid("กรุณาเลือกแขก"),
    room_id: z.string().uuid("กรุณาเลือกห้อง"),
    check_in_date: z.string().min(1, "กรุณาระบุวันเข้าพัก"),
    check_out_date: z.string().min(1, "กรุณาระบุวันออก"),
    num_adults: z.coerce.number().int().min(1).default(1),
    num_children: z.coerce.number().int().min(0).default(0),
    notes: z.string().max(1000).optional().nullable(),
    discount_amount: z.coerce.number().min(0).default(0),
    source: z.string().default("walk_in"),
    apply_vat: z.coerce.boolean().default(false),
  })
  .refine((d) => new Date(d.check_out_date) > new Date(d.check_in_date), {
    message: "วันออกต้องหลังวันเข้าพัก",
    path: ["check_out_date"],
  });

export type BookingInput = z.infer<typeof bookingSchema>;

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
]);
