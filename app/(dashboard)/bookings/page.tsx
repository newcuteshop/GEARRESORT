import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/rbac";
import { listBookings } from "@/lib/actions/bookings";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTHB, formatDateShort, calcNights } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string };

type BookingRow = {
  id: string;
  booking_code: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  num_adults: number;
  num_children: number;
  grand_total: number;
  guest:
    | { id: string; full_name: string; phone: string | null }
    | { id: string; full_name: string; phone: string | null }[]
    | null;
  room:
    | {
        id: string;
        room_number: string;
        room_type: { name: string } | { name: string }[] | null;
      }
    | {
        id: string;
        room_number: string;
        room_type: { name: string } | { name: string }[] | null;
      }[]
    | null;
};

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function BookingsListPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(["admin", "receptionist"]);
  const sp = await props.searchParams;
  const { data, error } = await listBookings({ status: sp.status });
  const bookings = ((data as BookingRow[] | null) ?? []) as BookingRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="การจอง"
        description="รายการจองทั้งหมด — กดเข้าไปเพื่อ check-in / check-out"
        actions={
          <Button render={<Link href="/bookings/new" />}>
            <Plus className="size-4" /> สร้างการจอง
          </Button>
        }
      />

      <form className="flex max-w-xs gap-2">
        <Select name="status" defaultValue={sp.status ?? ""}>
          <SelectTrigger>
            <SelectValue placeholder="กรองตามสถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">ทั้งหมด</SelectItem>
            <SelectItem value="pending">รอยืนยัน</SelectItem>
            <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
            <SelectItem value="checked_in">Check-in</SelectItem>
            <SelectItem value="checked_out">Check-out</SelectItem>
            <SelectItem value="cancelled">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          กรอง
        </Button>
      </form>

      {error && (
        <div className="text-destructive text-sm">เกิดข้อผิดพลาด: {error}</div>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="ยังไม่มีการจอง"
          description="เริ่มต้นด้วยการสร้างการจองแรก"
          action={
            <Button render={<Link href="/bookings/new" />}>
              <Plus className="size-4" /> สร้างการจอง
            </Button>
          }
        />
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>แขก</TableHead>
                <TableHead>ห้อง</TableHead>
                <TableHead>เข้าพัก</TableHead>
                <TableHead>ออก</TableHead>
                <TableHead className="text-right">คืน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">รวม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => {
                const guest = pickOne(b.guest);
                const room = pickOne(b.room);
                const roomType = pickOne(room?.room_type ?? null);
                const nights = calcNights(b.check_in_date, b.check_out_date);
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
                    <TableCell>{guest?.full_name ?? "—"}</TableCell>
                    <TableCell>
                      <div>{room?.room_number ?? "—"}</div>
                      <div className="text-muted-foreground text-xs">
                        {roomType?.name ?? ""}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateShort(b.check_in_date)}</TableCell>
                    <TableCell>{formatDateShort(b.check_out_date)}</TableCell>
                    <TableCell className="text-right">{nights}</TableCell>
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
