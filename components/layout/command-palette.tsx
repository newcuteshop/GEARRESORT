"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  BedDouble,
  Users,
  Receipt,
  Sparkles,
  Settings,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { quickSearch } from "@/lib/actions/search";

const NAV_ITEMS = [
  { label: "ภาพรวม", href: "/", icon: LayoutDashboard },
  { label: "สร้างการจองใหม่", href: "/bookings/new", icon: Plus, primary: true },
  { label: "การจอง", href: "/bookings", icon: CalendarDays },
  { label: "ห้องพัก", href: "/rooms", icon: BedDouble },
  { label: "ลูกค้า", href: "/guests", icon: Users },
  { label: "ใบแจ้งหนี้", href: "/billing", icon: Receipt },
  { label: "แม่บ้าน", href: "/housekeeping", icon: Sparkles },
  { label: "ตั้งค่า", href: "/settings", icon: Settings },
];

type SearchData = {
  bookings: { id: string; booking_code: string; status: string; guest: { full_name: string } | { full_name: string }[] | null; room: { room_number: string } | { room_number: string }[] | null }[];
  guests: { id: string; full_name: string; phone: string | null; email: string | null }[];
  rooms: { id: string; room_number: string; status: string }[];
};

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchData>({
    bookings: [],
    guests: [],
    rooms: [],
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ bookings: [], guests: [], rooms: [] });
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await quickSearch(query);
        if (res.data) setResults(res.data as SearchData);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="ค้นหาด่วน"
      description="พิมพ์เพื่อค้นหา หรือเลือกเมนู"
    >
      <CommandInput
        placeholder="ค้นหาห้อง / รหัสการจอง / ชื่อแขก..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>ไม่พบผลลัพธ์</CommandEmpty>

        {!query.trim() && (
          <CommandGroup heading="เมนู">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => go(item.href)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {results.bookings.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="การจอง">
              {results.bookings.map((b) => {
                const guest = pickOne(b.guest);
                const room = pickOne(b.room);
                return (
                  <CommandItem
                    key={b.id}
                    onSelect={() => go(`/bookings/${b.id}`)}
                  >
                    <CalendarDays className="size-4" />
                    <span>{b.booking_code}</span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      ห้อง {room?.room_number ?? "—"} · {guest?.full_name ?? "—"}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {results.guests.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="ลูกค้า">
              {results.guests.map((g) => (
                <CommandItem
                  key={g.id}
                  onSelect={() => go(`/guests/${g.id}`)}
                >
                  <Users className="size-4" />
                  <span>{g.full_name}</span>
                  <span className="text-muted-foreground ml-auto text-xs">
                    {g.phone ?? g.email ?? ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.rooms.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="ห้องพัก">
              {results.rooms.map((r) => (
                <CommandItem key={r.id} onSelect={() => go(`/rooms`)}>
                  <BedDouble className="size-4" />
                  <span>ห้อง {r.room_number}</span>
                  <span className="text-muted-foreground ml-auto text-xs">
                    {r.status}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
