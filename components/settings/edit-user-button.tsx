"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
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
import { updateUser } from "@/lib/actions/users";

export function EditUserButton({
  userId,
  currentName,
  currentPhone,
  currentUsername,
}: {
  userId: string;
  currentName: string;
  currentPhone: string;
  currentUsername: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function action(formData: FormData) {
    startTransition(async () => {
      const res = await updateUser(userId, formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("บันทึกแล้ว");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <Pencil className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แก้ไขผู้ใช้</DialogTitle>
          <DialogDescription>เปลี่ยนชื่อ เบอร์ หรือชื่อผู้ใช้</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={currentName}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">เบอร์โทร</Label>
            <Input id="phone" name="phone" defaultValue={currentPhone} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">ผู้ใช้</Label>
            <Input
              id="username"
              name="username"
              defaultValue={currentUsername}
            />
            <p className="text-muted-foreground text-[11px]">
              เว้นว่างถ้าไม่ต้องการเปลี่ยน
            </p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>
              ยกเลิก
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
