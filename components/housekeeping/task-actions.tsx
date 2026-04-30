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
import { updateTaskStatus, assignTask } from "@/lib/actions/housekeeping";

const TASK_STATUS_LABEL: Record<string, string> = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังทำ",
  done: "เสร็จแล้ว",
  blocked: "ติดขัด",
};

export function TaskStatusSelect({
  taskId,
  current,
}: {
  taskId: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={current}
      onValueChange={(next) => {
        if (!next || next === current) return;
        startTransition(async () => {
          const res = await updateTaskStatus(
            taskId,
            next as "pending" | "in_progress" | "done" | "blocked",
          );
          if (res.error) toast.error(res.error);
          else toast.success("อัปเดตสถานะแล้ว");
        });
      }}
      disabled={pending}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(TASK_STATUS_LABEL).map(([k, v]) => (
          <SelectItem key={k} value={k}>
            {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TaskAssignSelect({
  taskId,
  current,
  staff,
}: {
  taskId: string;
  current: string | null;
  staff: { id: string; full_name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={current ?? "__unassigned__"}
      onValueChange={(next) => {
        if (!next) return;
        const value = next === "__unassigned__" ? null : next;
        startTransition(async () => {
          const res = await assignTask(taskId, value);
          if (res.error) toast.error(res.error);
          else toast.success("มอบหมายแล้ว");
        });
      }}
      disabled={pending}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__unassigned__">ยังไม่มอบหมาย</SelectItem>
        {staff.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
