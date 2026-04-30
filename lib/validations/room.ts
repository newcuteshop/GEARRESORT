import { z } from "zod";

export const roomTypeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/i, "ใช้ได้เฉพาะ a-z 0-9 และเครื่องหมาย -"),
  description: z.string().max(1000).optional().nullable(),
  base_price: z.coerce.number().min(0),
  max_occupancy: z.coerce.number().int().min(1).default(2),
  bed_type: z.string().max(50).optional().nullable(),
  size_sqm: z.coerce.number().min(0).optional().nullable(),
  amenities: z.array(z.string()).default([]),
  is_active: z.coerce.boolean().default(true),
});

export type RoomTypeInput = z.infer<typeof roomTypeSchema>;

export const roomSchema = z.object({
  room_number: z.string().min(1).max(20),
  room_type_id: z.string().uuid(),
  floor: z.string().max(20).optional().nullable(),
  status: z
    .enum(["available", "occupied", "cleaning", "maintenance", "out_of_service"])
    .default("available"),
  notes: z.string().max(500).optional().nullable(),
  is_active: z.coerce.boolean().default(true),
});

export type RoomInput = z.infer<typeof roomSchema>;
