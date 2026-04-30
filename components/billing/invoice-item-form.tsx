"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addInvoiceItem, deleteInvoiceItem } from "@/lib/actions/billing";

export function InvoiceItemForm({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function action(formData: FormData) {
    formData.set("invoice_id", invoiceId);
    startTransition(async () => {
      const res = await addInvoiceItem(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("เพิ่มรายการแล้ว");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Plus className="size-4" /> เพิ่มรายการ
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มรายการในใบแจ้งหนี้</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="description">รายการ</Label>
            <Input
              id="description"
              name="description"
              required
              placeholder="บริการสปา"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">จำนวน</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={0.01}
                step="0.01"
                defaultValue={1}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_price">ราคาต่อหน่วย</Label>
              <Input
                id="unit_price"
                name="unit_price"
                type="number"
                min={0}
                step="0.01"
                required
              />
            </div>
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

export function DeleteItemButton({
  itemId,
  invoiceId,
}: {
  itemId: string;
  invoiceId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      disabled={pending}
      onClick={() => {
        if (!confirm("ลบรายการนี้?")) return;
        startTransition(async () => {
          const res = await deleteInvoiceItem(itemId, invoiceId);
          if (res.error) toast.error(res.error);
          else toast.success("ลบแล้ว");
        });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
