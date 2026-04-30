import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/rbac";
import { listGuests } from "@/lib/actions/guests";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/bookings/booking-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SearchParams = { guestId?: string };

export default async function NewBookingPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(["admin", "receptionist"]);
  const sp = await props.searchParams;
  const { data } = await listGuests();
  const guests = (data ?? []).map((g) => ({
    id: g.id,
    full_name: g.full_name,
    phone: g.phone,
  }));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/bookings" />}>
        <ArrowLeft className="size-4" /> กลับ
      </Button>
      <PageHeader
        title="สร้างการจองใหม่"
        description="เลือกแขก ระบุวันที่ เลือกห้อง — ระบบคำนวณราคาให้อัตโนมัติ"
      />
      <BookingForm guests={guests} initialGuestId={sp.guestId} />
    </div>
  );
}
