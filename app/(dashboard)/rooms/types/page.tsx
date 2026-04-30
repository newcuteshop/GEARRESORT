import { Layers } from "lucide-react";
import { requireMenu } from "@/lib/auth/rbac";
import { listRoomTypesWithCount, listRoomTypes } from "@/lib/actions/rooms";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RoomTypeForm } from "@/components/rooms/room-type-form";
import { RoomForm } from "@/components/rooms/room-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTHB } from "@/lib/format";

export const dynamic = "force-dynamic";

type RoomTypeRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  max_occupancy: number;
  bed_type: string | null;
  size_sqm: number | null;
  amenities: unknown;
  is_active: boolean;
  rooms?: { count: number }[];
};

export default async function RoomTypesPage() {
  await requireMenu("rooms_types");
  const [{ data: types, error }, { data: typeOptions }] = await Promise.all([
    listRoomTypesWithCount(),
    listRoomTypes(),
  ]);
  const list = ((types as RoomTypeRow[] | null) ?? []) as RoomTypeRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ประเภทห้อง"
        description="กำหนดราคา ขนาด สิ่งอำนวยความสะดวก ของห้องแต่ละประเภท"
        actions={
          <div className="flex gap-2">
            {list.length > 0 && (
              <RoomForm
                roomTypes={(typeOptions ?? []).map((t) => ({
                  id: t.id,
                  name: t.name,
                }))}
              />
            )}
            <RoomTypeForm />
          </div>
        }
      />

      {error && (
        <div className="text-destructive text-sm">เกิดข้อผิดพลาด: {error}</div>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="ยังไม่มีประเภทห้อง"
          description="เริ่มต้นด้วยการเพิ่มประเภทห้องอย่างน้อย 1 ประเภท"
        />
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>ราคา/คืน</TableHead>
                <TableHead>รับสูงสุด</TableHead>
                <TableHead>ขนาด</TableHead>
                <TableHead>เตียง</TableHead>
                <TableHead className="text-right">จำนวนห้อง</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((t) => {
                const count = t.rooms?.[0]?.count ?? 0;
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.name}</div>
                      {t.description && (
                        <p className="text-muted-foreground text-xs">
                          {t.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{formatTHB(t.base_price)}</TableCell>
                    <TableCell>{t.max_occupancy} คน</TableCell>
                    <TableCell>{t.size_sqm ? `${t.size_sqm} ตร.ม.` : "—"}</TableCell>
                    <TableCell>{t.bed_type ?? "—"}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                    <TableCell>
                      <RoomTypeForm existing={t} />
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
