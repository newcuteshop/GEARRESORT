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
import { Switch } from "@/components/ui/switch";
import { setUserRole, setUserActive } from "@/lib/actions/users";

const ROLES: { value: "admin" | "receptionist" | "housekeeping"; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "receptionist", label: "Reception" },
  { value: "housekeeping", label: "Housekeeping" },
];

export function UserRoleSelect({
  userId,
  current,
}: {
  userId: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={current}
      onValueChange={(next) => {
        if (!next || next === current) return;
        startTransition(async () => {
          const res = await setUserRole(
            userId,
            next as "admin" | "receptionist" | "housekeeping",
          );
          if (res.error) toast.error(res.error);
          else toast.success("อัปเดตบทบาทแล้ว");
        });
      }}
      disabled={pending}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function UserActiveSwitch({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={active}
      disabled={pending}
      onCheckedChange={(v) => {
        startTransition(async () => {
          const res = await setUserActive(userId, !!v);
          if (res.error) toast.error(res.error);
          else toast.success(v ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว");
        });
      }}
    />
  );
}
