import Link from "next/link";
import { Users } from "lucide-react";
import { requireMenu } from "@/lib/auth/rbac";
import { listGuests } from "@/lib/actions/guests";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GuestTypeBadge } from "@/components/shared/status-badge";
import { GuestForm } from "@/components/guests/guest-form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTHB, formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string };

export default async function GuestsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  await requireMenu("guests");
  const sp = await props.searchParams;
  const { data, error } = await listGuests(sp.q);
  const guests = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ลูกค้า"
        description="ฐานข้อมูลแขก ประวัติการเข้าพัก และคำขอพิเศษ"
        actions={<GuestForm redirectAfter />}
      />

      <form className="max-w-md">
        <Input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="ค้นหา ชื่อ / อีเมล / เบอร์โทร"
        />
      </form>

      {error && (
        <div className="text-destructive text-sm">เกิดข้อผิดพลาด: {error}</div>
      )}

      {guests.length === 0 ? (
        <EmptyState
          icon={Users}
          title={sp.q ? "ไม่พบลูกค้าตามคำค้นหา" : "ยังไม่มีลูกค้า"}
          description={sp.q ? undefined : "เริ่มต้นด้วยการเพิ่มลูกค้าคนแรก"}
        />
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>ติดต่อ</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead className="text-right">ครั้งที่เข้าพัก</TableHead>
                <TableHead className="text-right">ใช้จ่ายรวม</TableHead>
                <TableHead>เข้าพักล่าสุด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((g) => (
                <TableRow
                  key={g.id}
                  className="cursor-pointer"
                  onClick={undefined}
                >
                  <TableCell>
                    <Link
                      href={`/guests/${g.id}`}
                      className="font-medium hover:underline"
                    >
                      {g.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{g.phone ?? "—"}</div>
                    <div className="text-muted-foreground text-xs">
                      {g.email ?? ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <GuestTypeBadge type={g.guest_type ?? "regular"} />
                  </TableCell>
                  <TableCell className="text-right">
                    {g.total_stays ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatTHB(Number(g.total_spent ?? 0))}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {g.last_stay_at ? formatDateShort(g.last_stay_at) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
