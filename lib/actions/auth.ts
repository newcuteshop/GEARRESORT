"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { toLoginEmail } from "@/lib/auth/username";
import type { Role } from "@/lib/auth/rbac";

const loginSchema = z.object({
  email: z.string().min(1, "กรุณาระบุชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณาระบุรหัสผ่าน"),
});

export async function loginAction(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: toLoginEmail(parsed.data.email),
    password: parsed.data.password,
  });

  if (error) {
    return { error: "ผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  redirect("/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type MenuKey =
  | "dashboard"
  | "bookings"
  | "rooms"
  | "rooms_types"
  | "guests"
  | "billing"
  | "housekeeping"
  | "settings";

export type CurrentUser = {
  id: string;
  email: string | undefined;
  profile: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    role: Role;
    is_active: boolean;
    permissions: MenuKey[];
  };
};

export async function getCurrentUserWithRole(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  // Admin sees everything regardless of permissions array
  const allMenus: MenuKey[] = [
    "dashboard",
    "bookings",
    "rooms",
    "rooms_types",
    "guests",
    "billing",
    "housekeeping",
    "settings",
  ];
  const rawPermissions = (profile.permissions ?? []) as string[];
  const permissions =
    profile.role === "admin"
      ? allMenus
      : (rawPermissions.filter((p) =>
          allMenus.includes(p as MenuKey),
        ) as MenuKey[]);

  return {
    id: user.id,
    email: user.email,
    profile: { ...profile, permissions },
  };
}
