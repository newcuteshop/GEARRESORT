import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt, Pencil } from "lucide-react";
import { requireMenu } from "@/lib/auth/rbac";
import { getBooking, getBookingInvoice } from "@/lib/actions/bookings";
import { PageHeader } from "@/components/shared/page-header";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { BookingActions } from "@/components/bookings/booking-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB, formatDateFull, formatDateTime, calcNights } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { id: string };

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function BookingDetailPage(props: {
  params: Promise<Params>;
}) {
  await requireMenu("bookings");
  const { id } = await props.params;
  const [{ data: booking, error }, { data: invoice }] = await Promise.all([
    getBooking(id),
    getBookingInvoice(id),
  ]);
  if (error || !booking) notFound();

  const guest = pickOne(
    booking.guest as { id: string; full_name: string; phone: string | null; email: string | null } | null,
  );
  const room = pickOne(
    booking.room as
      | {
          id: string;
          room_number: string;
          floor: string | null;
          room_type:
            | { id: string; name: string; base_price: number }
            | { id: string; name: string; base_price: number }[]
            | null;
        }
      | null,
  );
  const roomType = pickOne(room?.room_type ?? null);
  const nights = calcNights(booking.check_in_date, booking.check_out_date);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/bookings" />}>
        <ArrowLeft className="size-4" /> กลับ
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            รหัสการจอง
          </p>
          <h1 className="font-serif text-3xl">{booking.booking_code}</h1>
          <div className="flex items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            {invoice && (
              <PaymentStatusBadge status={invoice.payment_status ?? "unpaid"} />
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!["checked_out", "cancelled", "no_show"].includes(booking.status) && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/bookings/${booking.id}/edit`} />}
            >
              <Pencil className="size-4" /> แก้ไข
            </Button>
          )}
          <BookingActions bookingId={booking.id} status={booking.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">แขก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {guest ? (
              <>
                <Link
                  href={`/guests/${guest.id}`}
                  className="font-medium hover:underline"
                >
                  {guest.full_name}
                </Link>
                <div className="text-muted-foreground text-sm">
                  {guest.phone ?? ""}
                </div>
                <div className="text-muted-foreground text-sm">
                  {guest.email ?? ""}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ห้องพัก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {room ? (
              <>
                <p className="font-serif text-2xl">{room.room_number}</p>
                <p className="text-muted-foreground text-sm">
                  {roomType?.name ?? ""}
                  {room.floor ? ` · ชั้น ${room.floor}` : ""}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายละเอียดการเข้าพัก</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Row label="เข้าพัก" value={formatDateFull(booking.check_in_date)} />
          <Row label="ออก" value={formatDateFull(booking.check_out_date)} />
          <Row label="จำนวนคืน" value={`${nights} คืน`} />
          <Row
            label="จำนวนคน"
            value={`ผู้ใหญ่ ${booking.num_adults} · เด็ก ${booking.num_children}`}
          />
          {booking.actual_check_in_at && (
            <Row
              label="Check-in จริง"
              value={formatDateTime(booking.actual_check_in_at)}
            />
          )}
          {booking.actual_check_out_at && (
            <Row
              label="Check-out จริง"
              value={formatDateTime(booking.actual_check_out_at)}
            />
          )}
          <Row label="ที่มา" value={booking.source ?? "—"} />
          {booking.notes && <Row label="หมายเหตุ" value={booking.notes} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">สรุปยอด</CardTitle>
          {invoice && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/billing/${invoice.id}`} />}
            >
              <Receipt className="size-4" /> ดูใบแจ้งหนี้
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Row label="ค่าห้อง" value={formatTHB(Number(booking.total_amount))} />
          <Row
            label="ส่วนลด"
            value={`- ${formatTHB(Number(booking.discount_amount))}`}
          />
          <Row label="ภาษี" value={formatTHB(Number(booking.tax_amount))} />
          <div className="border-t pt-2">
            <Row
              label="รวมทั้งสิ้น"
              value={formatTHB(Number(booking.grand_total))}
              bold
            />
          </div>
          {invoice && (
            <Row
              label="ชำระแล้ว"
              value={formatTHB(Number(invoice.paid_amount ?? 0))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={
        "flex items-center justify-between gap-3 " +
        (bold ? "text-base font-semibold" : "")
      }
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
