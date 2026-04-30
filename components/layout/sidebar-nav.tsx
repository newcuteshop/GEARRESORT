"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Layers,
  Users,
  Receipt,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth/rbac";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

const NAV: NavItem[] = [
  { label: "ภาพรวม", href: "/", icon: LayoutDashboard, roles: ["admin", "receptionist", "housekeeping"] },
  { label: "การจอง", href: "/bookings", icon: CalendarDays, roles: ["admin", "receptionist"] },
  { label: "ห้องพัก", href: "/rooms", icon: BedDouble, roles: ["admin", "receptionist", "housekeeping"] },
  { label: "ประเภทห้อง", href: "/rooms/types", icon: Layers, roles: ["admin"] },
  { label: "ลูกค้า", href: "/guests", icon: Users, roles: ["admin", "receptionist"] },
  { label: "ใบแจ้งหนี้", href: "/billing", icon: Receipt, roles: ["admin", "receptionist"] },
  { label: "แม่บ้าน", href: "/housekeeping", icon: Sparkles, roles: ["admin", "receptionist", "housekeeping"] },
  { label: "ตั้งค่า", href: "/settings", icon: Settings, roles: ["admin"] },
];

export function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();

  const items = NAV.filter((item) => item.roles.includes(role));

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {isActive && (
              <span className="bg-primary absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full" />
            )}
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
