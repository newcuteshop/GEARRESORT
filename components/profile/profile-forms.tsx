"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, updatePassword } from "@/lib/actions/profile";

export function ProfileForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const [pending, startTransition] = useTransition();
  function action(formData: FormData) {
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res.error) toast.error(res.error);
      else toast.success("บันทึกแล้ว");
    });
  }
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaultName}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">เบอร์โทร</Label>
        <Input id="phone" name="phone" defaultValue={defaultPhone} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  function action(formData: FormData) {
    startTransition(async () => {
      const res = await updatePassword(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("เปลี่ยนรหัสผ่านแล้ว");
      const form = document.getElementById("password-form") as HTMLFormElement;
      form?.reset();
    });
  }
  return (
    <form id="password-form" action={action} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="password">รหัสผ่านใหม่</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={6}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
      </Button>
    </form>
  );
}
