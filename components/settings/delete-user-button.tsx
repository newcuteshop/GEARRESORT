"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteUser } from "@/lib/actions/users";

export function DeleteUserButton({
  userId,
  userName,
  disabled,
}: {
  userId: string;
  userName: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteUser(userId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("ลบผู้ใช้แล้ว");
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบผู้ใช้</AlertDialogTitle>
          <AlertDialogDescription>
            ยืนยันลบ <span className="font-medium">{userName}</span>{" "}
            ออกจากระบบ? การกระทำนี้ย้อนกลับไม่ได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant="ghost" type="button" />}>
            ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction
            render={
              <Button
                variant="destructive"
                disabled={pending}
                onClick={confirmDelete}
              />
            }
          >
            {pending ? "กำลังลบ..." : "ลบเลย"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
