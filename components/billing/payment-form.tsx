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
import { Textarea } from "@/components/ui/textarea";
import { recordPayment, uploadPaymentSlip } from "@/lib/actions/billing";

export function PaymentForm({
  invoiceId,
  balance,
}: {
  invoiceId: string;
  balance: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState("transfer");
  const [file, setFile] = useState<File | null>(null);

  function action(formData: FormData) {
    formData.set("invoice_id", invoiceId);
    formData.set("method", method);

    startTransition(async () => {
      let slipPath: string | null = null;
      if (file) {
        const up = await uploadPaymentSlip(invoiceId, file);
        if (up.error) {
          toast.error(up.error);
          return;
        }
        slipPath = up.data?.path ?? null;
      }
      if (slipPath) formData.set("slip_url", slipPath);
      const res = await recordPayment(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("บันทึกการชำระเงินแล้ว");
      setOpen(false);
      setFile(null);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" /> บันทึกการชำระเงิน
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>บันทึกการชำระเงิน</DialogTitle>
          <DialogDescription>
            ยอดคงเหลือ: <span className="font-semibold">{balance.toLocaleString()}</span> บาท
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">จำนวนเงิน</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={1}
              step="0.01"
              required
              defaultValue={balance > 0 ? balance : ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label>วิธีชำระ</Label>
            <Select value={method} onValueChange={(v) => v && setMethod(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">เงินสด</SelectItem>
                <SelectItem value="transfer">โอนเงิน</SelectItem>
                <SelectItem value="credit_card">บัตรเครดิต</SelectItem>
                <SelectItem value="qr_code">QR Code</SelectItem>
                <SelectItem value="other">อื่นๆ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reference_number">เลขอ้างอิง</Label>
            <Input id="reference_number" name="reference_number" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slip">สลิป (ภาพ, สูงสุด 5MB)</Label>
            <Input
              id="slip"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="text-muted-foreground text-xs">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea id="notes" name="notes" rows={2} />
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
