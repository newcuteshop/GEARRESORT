"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, LogIn, LogOut, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateBookingStatus } from "@/lib/actions/bookings";

export function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  function dispatch(
    next:
      | "pending"
      | "confirmed"
      | "checked_in"
      | "checked_out"
      | "cancelled"
      | "no_show",
    successMsg: string,
  ) {
    if (next === "cancelled" && !confirm("ยืนยันยกเลิกการจองนี้?")) return;
    startTransition(async () => {
      const res = await updateBookingStatus(bookingId, next);
      if (res.error) toast.error(res.error);
      else toast.success(successMsg);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" && (
        <Button
          onClick={() => dispatch("confirmed", "ยืนยันการจองแล้ว")}
          disabled={pending}
        >
          <CheckCircle2 className="size-4" /> ยืนยันการจอง
        </Button>
      )}
      {(status === "pending" || status === "confirmed") && (
        <Button
          onClick={() => dispatch("checked_in", "Check-in สำเร็จ")}
          disabled={pending}
        >
          <LogIn className="size-4" /> Check-in
        </Button>
      )}
      {status === "checked_in" && (
        <Button
          onClick={() => dispatch("checked_out", "Check-out สำเร็จ")}
          disabled={pending}
        >
          <LogOut className="size-4" /> Check-out
        </Button>
      )}
      {!["checked_out", "cancelled", "no_show"].includes(status) && (
        <Button
          variant="destructive"
          onClick={() => dispatch("cancelled", "ยกเลิกแล้ว")}
          disabled={pending}
        >
          <XCircle className="size-4" /> ยกเลิก
        </Button>
      )}
    </div>
  );
}
