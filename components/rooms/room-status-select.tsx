"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROOM_STATUS_LABEL } from "@/lib/constants";
import { updateRoomStatus } from "@/lib/actions/rooms";

const STATUSES = [
  "available",
  "occupied",
  "cleaning",
  "maintenance",
  "out_of_service",
] as const;

export function RoomStatusSelect({
  roomId,
  current,
}: {
  roomId: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={current}
      onValueChange={(next) => {
        if (!next || next === current) return;
        startTransition(async () => {
          const res = await updateRoomStatus(
            roomId,
            next as (typeof STATUSES)[number],
          );
          if (res.error) toast.error(res.error);
          else toast.success("อัปเดตสถานะเรียบร้อย");
        });
      }}
      disabled={pending}
    >
      <SelectTrigger className="w-full sm:w-44">
        <SelectValue placeholder="เลือกสถานะ" />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {ROOM_STATUS_LABEL[s] ?? s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
