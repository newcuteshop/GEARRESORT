"use client";

import { useState, useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRoomType, updateRoomType } from "@/lib/actions/rooms";

type RoomType = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  max_occupancy: number;
  bed_type: string | null;
  size_sqm: number | null;
  amenities: unknown;
  is_active: boolean;
};

export function RoomTypeForm({ existing }: { existing?: RoomType }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = !!existing;
  const amenitiesText = Array.isArray(existing?.amenities)
    ? (existing!.amenities as string[]).join(", ")
    : "";

  function action(formData: FormData) {
    startTransition(async () => {
      const res = isEdit
        ? await updateRoomType(existing.id, formData)
        : await createRoomType(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "อัปเดตประเภทห้องแล้ว" : "เพิ่มประเภทห้องแล้ว");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={isEdit ? "ghost" : "default"}
            size={isEdit ? "icon" : "default"}
          >
            {isEdit ? (
              <Pencil className="size-4" />
            ) : (
              <>
                <Plus className="size-4" /> เพิ่มประเภทห้อง
              </>
            )}
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไขประเภทห้อง" : "เพิ่มประเภทห้อง"}
          </DialogTitle>
          <DialogDescription>
            กรอกรายละเอียดประเภทห้อง รวมถึงราคาและจำนวนผู้เข้าพักสูงสุด
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">ชื่อประเภท</Label>
              <Input
                id="name"
                name="name"
                defaultValue={existing?.name ?? ""}
                required
                placeholder="Deluxe Room"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={existing?.slug ?? ""}
                required
                placeholder="deluxe"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={existing?.description ?? ""}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="base_price">ราคา / คืน</Label>
              <Input
                id="base_price"
                name="base_price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={existing?.base_price ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_occupancy">รับสูงสุด (คน)</Label>
              <Input
                id="max_occupancy"
                name="max_occupancy"
                type="number"
                min={1}
                defaultValue={existing?.max_occupancy ?? 2}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="size_sqm">ขนาด (ตร.ม.)</Label>
              <Input
                id="size_sqm"
                name="size_sqm"
                type="number"
                min={0}
                step="0.1"
                defaultValue={existing?.size_sqm ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bed_type">ประเภทเตียง</Label>
              <Input
                id="bed_type"
                name="bed_type"
                defaultValue={existing?.bed_type ?? ""}
                placeholder="King"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amenities">สิ่งอำนวยความสะดวก</Label>
              <Input
                id="amenities"
                name="amenities"
                defaultValue={amenitiesText}
                placeholder="WiFi, แอร์, ทีวี"
              />
            </div>
          </div>
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
