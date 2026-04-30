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
import type { MenuKey } from "@/lib/actions/auth";

type NavItem = {
  key: MenuKey;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "ภาพรวม", href: "/", icon: LayoutDashboard },
  { key: "bookings", label: "การจอง", href: "/bookings", icon: CalendarDays },
  { key: "rooms", label: "ห้องพัก", href: "/rooms", icon: BedDouble },
  {
    key: "rooms_types",
    label: "ประเภทห้อง",
    href: "/rooms/types",
    icon: Layers,
  },
  { key: "guests", label: "ลูกค้า", href: "/guests", icon: Users },
  { key: "billing", label: "ใบแจ้งหนี้", href: "/billing", icon: Receipt },
  {
    key: "housekeeping",
    label: "แม่บ้าน",
    href: "/housekeeping",
    icon: Sparkles,
  },
  { key: "settings", label: "ตั้งค่า", href: "/settings", icon: Settings },
];

export const ALL_MENU_KEYS = NAV_ITEMS.map((it) => it.key);

export const MENU_LABEL: Record<MenuKey, string> = NAV_ITEMS.reduce(
  (acc, it) => ({ ...acc, [it.key]: it.label }),
  {} as Record<MenuKey, string>,
);

export function SidebarNav({
  permissions,
  onNavigate,
}: {
  permissions: MenuKey[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => permissions.includes(item.key));

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
