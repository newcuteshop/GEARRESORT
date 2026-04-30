import { z } from "zod";

export const guestSchema = z.object({
  full_name: z.string().min(1, "กรุณาระบุชื่อ").max(200),
  email: z
    .string()
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  phone: z.string().max(40).optional().nullable(),
  id_card_number: z.string().max(40).optional().nullable(),
  nationality: z.string().max(20).default("TH"),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  guest_type: z.enum(["regular", "vip", "corporate"]).default("regular"),
  vip_notes: z.string().max(1000).optional().nullable(),
  special_requests: z.string().max(1000).optional().nullable(),
});

export type GuestInput = z.infer<typeof guestSchema>;
