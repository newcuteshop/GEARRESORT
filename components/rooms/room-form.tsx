"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { createRoom } from "@/lib/actions/rooms";

export function RoomForm({
  roomTypes,
}: {
  roomTypes: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [typeId, setTypeId] = useState<string>(roomTypes[0]?.id ?? "");

  function action(formData: FormData) {
    if (!typeId) {
      toast.error("กรุณาเลือกประเภทห้อง");
      return;
    }
    formData.set("room_type_id", typeId);
    startTransition(async () => {
      const res = await createRoom(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("เพิ่มห้องเรียบร้อย");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" /> เพิ่มห้อง
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มห้องใหม่</DialogTitle>
          <DialogDescription>
            ระบุเลขห้อง ชั้น และเลือกประเภทห้อง
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="room_number">เลขห้อง</Label>
              <Input id="room_number" name="room_number" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="floor">ชั้น</Label>
              <Input id="floor" name="floor" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>ประเภทห้อง</Label>
            <Select
              value={typeId}
              onValueChange={(v) => v && setTypeId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input type="hidden" name="status" value="available" />
          <input type="hidden" name="is_active" value="true" />

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
