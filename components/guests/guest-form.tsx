"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { createGuest, updateGuest } from "@/lib/actions/guests";

type Guest = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  id_card_number: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  address: string | null;
  guest_type: string;
  vip_notes: string | null;
  special_requests: string | null;
};

export function GuestForm({
  existing,
  redirectAfter,
  triggerLabel,
}: {
  existing?: Guest;
  redirectAfter?: boolean;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [guestType, setGuestType] = useState(existing?.guest_type ?? "regular");
  const isEdit = !!existing;

  function action(formData: FormData) {
    formData.set("guest_type", guestType);
    startTransition(async () => {
      const res = isEdit
        ? await updateGuest(existing.id, formData)
        : await createGuest(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "อัปเดตข้อมูลแล้ว" : "เพิ่มลูกค้าแล้ว");
      setOpen(false);
      if (!isEdit && redirectAfter && res.data && typeof res.data === "object") {
        const id = (res.data as { id?: string }).id;
        if (id) router.push(`/guests/${id}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={isEdit ? "outline" : "default"}
            size={isEdit ? "sm" : "default"}
          >
            {isEdit ? (
              <>
                <Pencil className="size-4" /> {triggerLabel ?? "แก้ไข"}
              </>
            ) : (
              <>
                <Plus className="size-4" /> {triggerLabel ?? "เพิ่มลูกค้า"}
              </>
            )}
          </Button>
        }
      />
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้า"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลแขก</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
              <Input
                id="full_name"
                name="full_name"
                required
                defaultValue={existing?.full_name ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทลูกค้า</Label>
              <Select
                value={guestType}
                onValueChange={(v) => v && setGuestType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">ทั่วไป</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="corporate">องค์กร</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">เบอร์โทร</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={existing?.phone ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={existing?.email ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="id_card_number">เลขบัตร/พาสปอร์ต</Label>
              <Input
                id="id_card_number"
                name="id_card_number"
                defaultValue={existing?.id_card_number ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nationality">สัญชาติ</Label>
              <Input
                id="nationality"
                name="nationality"
                defaultValue={existing?.nationality ?? "TH"}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">ที่อยู่</Label>
            <Textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={existing?.address ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="special_requests">คำขอพิเศษ</Label>
            <Textarea
              id="special_requests"
              name="special_requests"
              rows={2}
              defaultValue={existing?.special_requests ?? ""}
            />
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
