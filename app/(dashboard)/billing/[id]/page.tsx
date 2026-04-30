import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/rbac";
import {
  getInvoice,
  listInvoiceItems,
  listPayments,
} from "@/lib/actions/billing";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { PaymentForm } from "@/components/billing/payment-form";
import {
  InvoiceItemForm,
  DeleteItemButton,
} from "@/components/billing/invoice-item-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTHB, formatDateFull, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { id: string };

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "เงินสด",
  transfer: "โอนเงิน",
  credit_card: "บัตรเครดิต",
  qr_code: "QR Code",
  other: "อื่นๆ",
};

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function InvoiceDetailPage(props: {
  params: Promise<Params>;
}) {
  await requireRole(["admin", "receptionist"]);
  const { id } = await props.params;
  const [{ data: invoice, error }, { data: items }, { data: payments }] =
    await Promise.all([
      getInvoice(id),
      listInvoiceItems(id),
      listPayments(id),
    ]);
  if (error || !invoice) notFound();

  const booking = pickOne(
    invoice.booking as
      | {
          id: string;
          booking_code: string;
          check_in_date: string;
          check_out_date: string;
          guest: { id: string; full_name: string; phone: string | null; email: string | null } | { id: string; full_name: string; phone: string | null; email: string | null }[] | null;
          room: { room_number: string; room_type: { name: string } | { name: string }[] | null } | { room_number: string; room_type: { name: string } | { name: string }[] | null }[] | null;
        }
      | null,
  );
  const guest = pickOne(booking?.guest ?? null);
  const room = pickOne(booking?.room ?? null);
  const roomType = pickOne(room?.room_type ?? null);

  const balance = Math.max(
    0,
    Number(invoice.total ?? 0) - Number(invoice.paid_amount ?? 0),
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/billing" />}>
        <ArrowLeft className="size-4" /> กลับ
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            ใบแจ้งหนี้
          </p>
          <h1 className="font-serif text-3xl">{invoice.invoice_number}</h1>
          <PaymentStatusBadge status={invoice.payment_status} />
        </div>
        {balance > 0 && (
          <PaymentForm invoiceId={invoice.id} balance={balance} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">การจอง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {booking ? (
              <>
                <Link
                  href={`/bookings/${booking.id}`}
                  className="font-medium hover:underline"
                >
                  {booking.booking_code}
                </Link>
                <p className="text-muted-foreground">
                  {formatDateFull(booking.check_in_date)} →{" "}
                  {formatDateFull(booking.check_out_date)}
                </p>
                <p className="text-muted-foreground">
                  ห้อง {room?.room_number ?? "—"}
                  {roomType ? ` · ${roomType.name}` : ""}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">แขก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {guest ? (
              <>
                <Link
                  href={`/guests/${guest.id}`}
                  className="font-medium hover:underline"
                >
                  {guest.full_name}
                </Link>
                <p className="text-muted-foreground">{guest.phone ?? ""}</p>
                <p className="text-muted-foreground">{guest.email ?? ""}</p>
              </>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">รายการ</CardTitle>
          <InvoiceItemForm invoiceId={invoice.id} />
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รายการ</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead className="text-right">ราคา/หน่วย</TableHead>
                <TableHead className="text-right">รวม</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  ค่าห้องพัก {roomType?.name ?? ""}
                </TableCell>
                <TableCell className="text-right">1</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right">
                  {formatTHB(Number(invoice.subtotal ?? 0) - (items ?? []).reduce((a, it) => a + Number(it.amount ?? 0), 0))}
                </TableCell>
                <TableCell />
              </TableRow>
              {(items ?? []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.description}</TableCell>
                  <TableCell className="text-right">
                    {Number(it.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatTHB(Number(it.unit_price))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatTHB(Number(it.amount ?? 0))}
                  </TableCell>
                  <TableCell>
                    <DeleteItemButton itemId={it.id} invoiceId={invoice.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">สรุป</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="รวม" value={formatTHB(Number(invoice.subtotal ?? 0))} />
          <Row
            label="ส่วนลด"
            value={`- ${formatTHB(Number(invoice.discount ?? 0))}`}
          />
          <Row label="ภาษี" value={formatTHB(Number(invoice.tax ?? 0))} />
          <div className="border-t pt-2">
            <Row
              label="รวมทั้งสิ้น"
              value={formatTHB(Number(invoice.total ?? 0))}
              bold
            />
          </div>
          <Row
            label="ชำระแล้ว"
            value={formatTHB(Number(invoice.paid_amount ?? 0))}
          />
          <Row label="คงเหลือ" value={formatTHB(balance)} bold />
        </CardContent>
      </Card>

      <PageHeader title="ประวัติการชำระเงิน" />
      {(payments ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">ยังไม่มีการชำระเงิน</p>
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>วิธี</TableHead>
                <TableHead>เลขอ้างอิง</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead>สลิป</TableHead>
                <TableHead>ผู้บันทึก</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments ?? []).map((p) => {
                const recorder = pickOne(p.recorder ?? null) as
                  | { full_name: string }
                  | null;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(p.paid_at ?? p.created_at)}
                    </TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.reference_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTHB(Number(p.amount))}
                    </TableCell>
                    <TableCell>{p.slip_url ? "📎" : "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {recorder?.full_name ?? "—"}
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

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
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
