import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/actions/auth";
import type { MenuKey } from "@/lib/actions/auth";

export type Role = "admin" | "receptionist" | "housekeeping";

export async function requireAuth() {
  const user = await getCurrentUserWithRole();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowed: Role[]) {
  const user = await requireAuth();
  if (!allowed.includes(user.profile.role)) {
    redirect("/?error=forbidden");
  }
  return user;
}

export async function requireMenu(menu: MenuKey) {
  const user = await requireAuth();
  if (
    user.profile.role !== "admin" &&
    !user.profile.permissions.includes(menu)
  ) {
    redirect("/?error=forbidden");
  }
  return user;
}

export const can = {
  manageRooms: (role: Role) => role === "admin",
  manageStaff: (role: Role) => role === "admin",
  createBooking: (role: Role) => role === "admin" || role === "receptionist",
  recordPayment: (role: Role) => role === "admin" || role === "receptionist",
  updateRoomStatus: (_role: Role) => true,
  viewReports: (role: Role) => role === "admin",
};
