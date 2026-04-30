"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { inviteUser } from "@/lib/actions/users";
import { NAV_ITEMS } from "@/components/layout/sidebar-nav";
import type { MenuKey } from "@/lib/actions/auth";

const DEFAULT_PERMS: Record<string, MenuKey[]> = {
  admin: NAV_ITEMS.map((it) => it.key),
  receptionist: [
    "dashboard",
    "bookings",
    "rooms",
    "guests",
    "billing",
    "housekeeping",
  ],
  housekeeping: ["dashboard", "rooms", "housekeeping"],
};

export function InviteUserForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<"admin" | "receptionist" | "housekeeping">(
    "receptionist",
  );
  const [perms, setPerms] = useState<MenuKey[]>(DEFAULT_PERMS.receptionist);

  function toggle(key: MenuKey, on: boolean) {
    setPerms((prev) =>
      on ? Array.from(new Set([...prev, key])) : prev.filter((k) => k !== key),
    );
  }

  function changeRole(r: string) {
    const next = r as "admin" | "receptionist" | "housekeeping";
    setRole(next);
    setPerms(DEFAULT_PERMS[next] ?? []);
  }

  function action(formData: FormData) {
    formData.set("role", role);
    perms.forEach((p) => formData.append("permissions", p));
    startTransition(async () => {
      const res = await inviteUser(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("เพิ่มผู้ใช้แล้ว");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus className="size-4" /> เพิ่มผู้ใช้
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>เพิ่มผู้ใช้</DialogTitle>
          <DialogDescription>
            ตั้งชื่อผู้ใช้ + รหัสชั่วคราว และเลือกเมนูที่เข้าถึงได้
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">ผู้ใช้</Label>
              <Input
                id="email"
                name="email"
                type="text"
                required
                placeholder="เช่น staff01"
              />
              <p className="text-muted-foreground text-[11px]">
                ใช้ตัวอะไรก็ได้ — ระบบจะแปลงเป็นอีเมลภายในให้อัตโนมัติ
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
              <Input id="full_name" name="full_name" required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="password">รหัสผ่านชั่วคราว</Label>
              <Input
                id="password"
                name="password"
                type="text"
                required
              />
              <p className="text-muted-foreground text-[11px]">
                ใส่กี่ตัวก็ได้
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>บทบาท (ตั้งสิทธิเริ่มต้น)</Label>
              <Select value={role} onValueChange={(v) => v && changeRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  <SelectItem value="receptionist">พนักงานต้อนรับ</SelectItem>
                  <SelectItem value="housekeeping">แม่บ้าน</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>สิทธิเข้าถึงเมนู</Label>
            <p className="text-muted-foreground text-[11px]">
              {role === "admin"
                ? "ผู้ดูแลระบบเห็นทุกเมนูเสมอ ไม่สามารถปิดได้"
                : "เลือกเมนูที่ผู้ใช้คนนี้เข้าถึงได้"}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NAV_ITEMS.map((item) => {
                const checked =
                  role === "admin" ? true : perms.includes(item.key);
                return (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={role === "admin"}
                      onCheckedChange={(v) => toggle(item.key, !!v)}
                    />
                    <item.icon className="size-3.5" />
                    {item.label}
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>
              ยกเลิก
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "กำลังเพิ่ม..." : "เพิ่ม"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
