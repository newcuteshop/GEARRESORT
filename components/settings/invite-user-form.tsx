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
import { inviteUser } from "@/lib/actions/users";

export function InviteUserForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState("receptionist");

  function action(formData: FormData) {
    formData.set("role", role);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มผู้ใช้</DialogTitle>
          <DialogDescription>
            ตั้งรหัสชั่วคราว ให้ผู้ใช้เปลี่ยนเองหลัง login ครั้งแรก
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
            <Input id="full_name" name="full_name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">รหัสผ่านชั่วคราว</Label>
            <Input
              id="password"
              name="password"
              type="text"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label>บทบาท</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v)}>
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
