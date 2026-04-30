import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, Crown } from "lucide-react";
import { requireRole } from "@/lib/auth/rbac";
import { getGuest, getGuestBookings } from "@/lib/actions/guests";
import { PageHeader } from "@/components/shared/page-header";
import { GuestTypeBadge, BookingStatusBadge } from "@/components/shared/status-badge";
import { GuestForm } from "@/components/guests/guest-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB, formatDateShort, initialsFromName } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { id: string };

type Booking = {
  id: string;
  booking_code: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  grand_total: number;
  room: { room_number: string } | { room_number: string }[] | null;
};

function pickRoom(r: Booking["room"]) {
  if (!r) return null;
  return Array.isArray(r) ? r[0] : r;
}

export default async function GuestProfilePage(props: {
  params: Promise<Params>;
}) {
  await requireRole(["admin", "receptionist"]);
  const { id } = await props.params;
  const [{ data: guest, error }, { data: bookingsRaw }] = await Promise.all([
    getGuest(id),
    getGuestBookings(id),
  ]);
  if (error || !guest) notFound();
  const bookings = (bookingsRaw ?? []) as Booking[];
  const isVip = guest.guest_type === "vip";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/guests" />}>
        <ArrowLeft className="size-4" /> กลับ
      </Button>

      <div
        className={
          "bg-card rounded-2xl border p-6 shadow-sm" +
          (isVip ? " border-l-4 border-l-amber-400" : "")
        }
      >
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
            {initialsFromName(guest.full_name) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-2xl">{guest.full_name}</h1>
              {isVip && <Crown className="size-5 text-amber-500" />}
              <GuestTypeBadge type={guest.guest_type ?? "regular"} />
            </div>
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
              {guest.phone && <span>📞 {guest.phone}</span>}
              {guest.email && <span>✉️ {guest.email}</span>}
              {guest.nationality && <span>🌐 {guest.nationality}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <GuestForm existing={guest} triggerLabel="แก้ไข" />
            <Button render={<Link href={`/bookings/new?guestId=${guest.id}`} />}>
              <CalendarPlus className="size-4" /> จองใหม่
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              ครั้งที่เข้าพัก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-2xl">{guest.total_stays ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              ใช้จ่ายรวม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-2xl">
              {formatTHB(Number(guest.total_spent ?? 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              เข้าพักล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-lg">
              {guest.last_stay_at ? formatDateShort(guest.last_stay_at) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {(guest.address || guest.special_requests || guest.vip_notes) && (
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลเพิ่มเติม</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {guest.address && (
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">ที่อยู่</div>
                <p>{guest.address}</p>
              </div>
            )}
            {guest.special_requests && (
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">คำขอพิเศษ</div>
                <p>{guest.special_requests}</p>
              </div>
            )}
            {guest.vip_notes && (
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">VIP Notes</div>
                <p>{guest.vip_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <PageHeader title="ประวัติการจอง" />
      {bookings.length === 0 ? (
        <p className="text-muted-foreground text-sm">ยังไม่มีประวัติการจอง</p>
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ห้อง</TableHead>
                <TableHead>เข้าพัก</TableHead>
                <TableHead>ออก</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">รวม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => {
                const room = pickRoom(b.room);
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Link
                        href={`/bookings/${b.id}`}
                        className="font-medium hover:underline"
                      >
                        {b.booking_code}
                      </Link>
                    </TableCell>
                    <TableCell>{room?.room_number ?? "—"}</TableCell>
                    <TableCell>{formatDateShort(b.check_in_date)}</TableCell>
                    <TableCell>{formatDateShort(b.check_out_date)}</TableCell>
                    <TableCell>
                      <BookingStatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTHB(Number(b.grand_total))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
