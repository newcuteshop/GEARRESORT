import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireMenu } from "@/lib/auth/rbac";
import { getBooking } from "@/lib/actions/bookings";
import { listGuests } from "@/lib/actions/guests";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/bookings/booking-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function EditBookingPage(props: {
  params: Promise<Params>;
}) {
  await requireMenu("bookings");
  const { id } = await props.params;
  const [{ data: booking, error }, { data: guestsData }] = await Promise.all([
    getBooking(id),
    listGuests(),
  ]);
  if (error || !booking) notFound();

  const guests = (guestsData ?? []).map((g) => ({
    id: g.id,
    full_name: g.full_name,
    phone: g.phone,
  }));

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/bookings/${id}`} />}
      >
        <ArrowLeft className="size-4" /> กลับ
      </Button>
      <PageHeader
        title={`แก้ไขการจอง · ${booking.booking_code}`}
        description="แก้ไขข้อมูลการจอง — ราคาจะถูกคำนวณใหม่อัตโนมัติ"
      />
      <BookingForm
        guests={guests}
        existing={{
          id: booking.id,
          guest_id: booking.guest_id,
          room_id: booking.room_id,
          check_in_date: String(booking.check_in_date),
          check_out_date: String(booking.check_out_date),
          num_adults: booking.num_adults,
          num_children: booking.num_children,
          discount_amount: Number(booking.discount_amount ?? 0),
          tax_amount: Number(booking.tax_amount ?? 0),
          source: booking.source,
          notes: booking.notes,
        }}
      />
    </div>
  );
}
