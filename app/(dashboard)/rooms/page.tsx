import Link from "next/link";
import { BedDouble, Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth/rbac";
import { listRooms } from "@/lib/actions/rooms";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RoomStatusBadge } from "@/components/shared/status-badge";
import { RoomStatusSelect } from "@/components/rooms/room-status-select";
import { Button } from "@/components/ui/button";
import { formatTHB } from "@/lib/format";

export const dynamic = "force-dynamic";

type RoomRow = {
  id: string;
  room_number: string;
  floor: string | null;
  status: string;
  notes: string | null;
  is_active: boolean;
  room_type:
    | {
        id: string;
        name: string;
        slug: string;
        base_price: number;
        max_occupancy: number;
      }
    | { id: string; name: string; slug: string; base_price: number; max_occupancy: number }[]
    | null;
};

function pickType(t: RoomRow["room_type"]) {
  if (!t) return null;
  return Array.isArray(t) ? t[0] : t;
}

export default async function RoomsPage() {
  const user = await requireAuth();
  const { data, error } = await listRooms();
  const rooms = ((data as RoomRow[] | null) ?? []) as RoomRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ห้องพัก"
        description="ภาพรวมสถานะห้องทุกห้อง — เปลี่ยนสถานะได้ทันที"
        actions={
          user.profile.role === "admin" && (
            <Button render={<Link href="/rooms/types" />}>
              <Plus className="size-4" /> จัดการประเภทห้อง
            </Button>
          )
        }
      />

      {error && (
        <div className="text-destructive text-sm">เกิดข้อผิดพลาด: {error}</div>
      )}

      {rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="ยังไม่มีห้องพัก"
          description="เพิ่มประเภทห้องและห้องในเมนูประเภทห้อง"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((r) => {
            const type = pickType(r.room_type);
            return (
              <div
                key={r.id}
                className="bg-card rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      ห้อง
                    </p>
                    <p className="font-serif text-3xl">{r.room_number}</p>
                    {r.floor && (
                      <p className="text-muted-foreground text-xs">
                        ชั้น {r.floor}
                      </p>
                    )}
                  </div>
                  <RoomStatusBadge status={r.status} />
                </div>

                {type && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="font-medium">{type.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatTHB(type.base_price)} / คืน · พัก{" "}
                      {type.max_occupancy} คน
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <RoomStatusSelect roomId={r.id} current={r.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
