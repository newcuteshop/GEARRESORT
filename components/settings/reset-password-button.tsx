"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetUserPassword } from "@/lib/actions/users";

export function ResetPasswordButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!password) {
      toast.error("กรุณาระบุรหัสผ่านใหม่");
      return;
    }
    startTransition(async () => {
      const res = await resetUserPassword(userId, password);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("รีเซ็ตรหัสผ่านแล้ว");
      setOpen(false);
      setPassword("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <KeyRound className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
          <DialogDescription>
            ตั้งรหัสใหม่ให้ <span className="font-medium">{userName}</span>{" "}
            (ใส่กี่ตัวก็ได้)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="new-pass">รหัสผ่านใหม่</Label>
          <Input
            id="new-pass"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" type="button" />}>
            ยกเลิก
          </DialogClose>
          <Button onClick={submit} disabled={pending}>
            {pending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
