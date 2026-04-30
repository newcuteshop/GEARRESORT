import Link from "next/link";
import {
  CalendarCheck,
  CalendarX,
  BedDouble,
  Wallet,
  Plus,
  ArrowRight,
} from "lucide-react";
import { requireAuth } from "@/lib/auth/rbac";
import {
  getDashboardStats,
  getTodaySchedule,
  getRecentBookings,
} from "@/lib/actions/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB, formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

type Stats = {
  todays_checkins: number;
  todays_checkouts: number;
  occupied_rooms: number;
  total_rooms: number;
  todays_revenue: number;
  month_revenue: number;
} | null;

type Schedule = {
  id: string;
  booking_code: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  num_adults: number;
  num_children: number;
  guest: { full_name: string } | { full_name: string }[] | null;
  room: { room_number: string } | { room_number: string }[] | null;
};

type Recent = {
  id: string;
  booking_code: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  grand_total: number;
  guest: { full_name: string } | { full_name: string }[] | null;
  room: { room_number: string } | { room_number: string }[] | null;
};

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const [{ data: statsData }, { data: scheduleData }, { data: recentData }] =
    await Promise.all([
      getDashboardStats(),
      getTodaySchedule(),
      getRecentBookings(),
    ]);
  const stats = (statsData as Stats) ?? null;
  const schedule = (scheduleData as Schedule[] | null) ?? [];
  const recent = (recentData as Recent[] | null) ?? [];

  const occupancy =
    stats && stats.total_rooms > 0
      ? Math.round((stats.occupied_rooms / stats.total_rooms) * 100)
      : 0;

  const today = new Date();
  const hour = today.getHours();
  const greeting =
    hour < 12 ? "สวัสดีตอนเช้า" : hour < 18 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";

  const canBook =
    user.profile.role === "admin" || user.profile.role === "receptionist";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user.profile.full_name}`}
        description="ภาพรวมของวันนี้"
        actions={
          canBook ? (
            <Button render={<Link href="/bookings/new" />}>
              <Plus className="size-4" /> สร้างการจอง
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={CalendarCheck}
          label="Check-in วันนี้"
          value={String(stats?.todays_checkins ?? 0)}
          tone="emerald"
        />
        <StatsCard
          icon={CalendarX}
          label="Check-out วันนี้"
          value={String(stats?.todays_checkouts ?? 0)}
          tone="amber"
        />
        <StatsCard
          icon={BedDouble}
          label="Occupancy"
          value={`${occupancy}%`}
          hint={`${stats?.occupied_rooms ?? 0} / ${stats?.total_rooms ?? 0} ห้อง`}
          tone="primary"
        />
        <StatsCard
          icon={Wallet}
          label="รายได้เดือนนี้"
          value={formatTHB(Number(stats?.month_revenue ?? 0))}
          hint={`วันนี้ ${formatTHB(Number(stats?.todays_revenue ?? 0))}`}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">ตารางวันนี้</CardTitle>
            {canBook && (
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/bookings" />}
              >
                ดูทั้งหมด <ArrowRight className="size-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                ไม่มีตารางสำหรับวันนี้
              </p>
            ) : (
              <ul className="divide-y">
                {schedule.map((b) => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const guest = pickOne(b.guest);
                  const room = pickOne(b.room);
                  const isCheckin = b.check_in_date === todayStr;
                  return (
                    <li key={b.id} className="flex items-center gap-3 py-3">
                      <div
                        className={
                          "flex size-9 shrink-0 items-center justify-center rounded-full " +
                          (isCheckin
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600")
                        }
                      >
                        {isCheckin ? (
                          <CalendarCheck className="size-4" />
                        ) : (
                          <CalendarX className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/bookings/${b.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          ห้อง {room?.room_number ?? "—"} ·{" "}
                          {guest?.full_name ?? "—"}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {isCheckin ? "Check-in" : "Check-out"} ·{" "}
                          {b.num_adults + b.num_children} คน
                        </p>
                      </div>
                      <BookingStatusBadge status={b.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">การจองล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">ยังไม่มีการจอง</p>
            ) : (
              <ul className="divide-y">
                {recent.map((b) => {
                  const guest = pickOne(b.guest);
                  const room = pickOne(b.room);
                  return (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/bookings/${b.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {b.booking_code} · {guest?.full_name ?? "—"}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          ห้อง {room?.room_number ?? "—"} ·{" "}
                          {formatDateShort(b.check_in_date)} →{" "}
                          {formatDateShort(b.check_out_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatTHB(Number(b.grand_total))}
                        </p>
                        <BookingStatusBadge status={b.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
