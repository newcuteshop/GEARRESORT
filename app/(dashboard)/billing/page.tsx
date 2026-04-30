import Link from "next/link";
import { Receipt } from "lucide-react";
import { requireMenu } from "@/lib/auth/rbac";
import { listInvoices } from "@/lib/actions/billing";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
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
import { Button } from "@/components/ui/button";
import { formatTHB, formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string };

type InvoiceRow = {
  id: string;
  invoice_number: string;
  total: number;
  paid_amount: number;
  payment_status: string;
  due_date: string | null;
  created_at: string;
  booking:
    | {
        id: string;
        booking_code: string;
        guest: { full_name: string } | { full_name: string }[] | null;
        room: { room_number: string } | { room_number: string }[] | null;
      }
    | {
        id: string;
        booking_code: string;
        guest: { full_name: string } | { full_name: string }[] | null;
        room: { room_number: string } | { room_number: string }[] | null;
      }[]
    | null;
};

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function BillingPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  await requireMenu("billing");
  const sp = await props.searchParams;
  const { data, error } = await listInvoices({ status: sp.status });
  const invoices = ((data as InvoiceRow[] | null) ?? []) as InvoiceRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ใบแจ้งหนี้"
        description="รายการใบแจ้งหนี้ทั้งหมด — กดเข้าไปเพื่อบันทึกการชำระเงิน"
      />

      <form className="flex max-w-xs gap-2">
        <Select name="status" defaultValue={sp.status ?? ""}>
          <SelectTrigger>
            <SelectValue placeholder="กรองตามสถานะการชำระ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">ทั้งหมด</SelectItem>
            <SelectItem value="unpaid">ยังไม่ชำระ</SelectItem>
            <SelectItem value="partial">ชำระบางส่วน</SelectItem>
            <SelectItem value="paid">ชำระแล้ว</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          กรอง
        </Button>
      </form>

      {error && (
        <div className="text-destructive text-sm">เกิดข้อผิดพลาด: {error}</div>
      )}

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="ยังไม่มีใบแจ้งหนี้"
          description="ใบแจ้งหนี้จะถูกสร้างอัตโนมัติเมื่อมีการจอง"
        />
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>การจอง</TableHead>
                <TableHead>แขก</TableHead>
                <TableHead>ห้อง</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead className="text-right">ชำระแล้ว</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const booking = pickOne(inv.booking);
                const guest = pickOne(booking?.guest ?? null);
                const room = pickOne(booking?.room ?? null);
                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        href={`/billing/${inv.id}`}
                        className="font-medium hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell>{booking?.booking_code ?? "—"}</TableCell>
                    <TableCell>{guest?.full_name ?? "—"}</TableCell>
                    <TableCell>{room?.room_number ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatTHB(Number(inv.total))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTHB(Number(inv.paid_amount ?? 0))}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={inv.payment_status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateShort(inv.created_at)}
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
