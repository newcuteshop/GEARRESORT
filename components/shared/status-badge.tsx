import { cn } from "@/lib/utils";
import {
  ROOM_STATUS_LABEL,
  ROOM_STATUS_STYLE,
  BOOKING_STATUS_STYLE,
  PAYMENT_STATUS_STYLE,
} from "@/lib/constants";

export function RoomStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        ROOM_STATUS_STYLE[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {ROOM_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function BookingStatusBadge({ status }: { status: string }) {
  const meta = BOOKING_STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta?.class ?? "bg-muted text-muted-foreground",
      )}
    >
      {meta?.label ?? status}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const meta = PAYMENT_STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta?.class ?? "bg-muted text-muted-foreground",
      )}
    >
      {meta?.label ?? status}
    </span>
  );
}

const GUEST_TYPE: Record<string, { label: string; class: string }> = {
  regular: { label: "ทั่วไป", class: "bg-slate-100 text-slate-700" },
  vip: {
    label: "VIP",
    class: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  corporate: {
    label: "องค์กร",
    class: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  },
};

export function GuestTypeBadge({ type }: { type: string }) {
  const meta = GUEST_TYPE[type] ?? GUEST_TYPE.regular;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.class,
      )}
    >
      {meta.label}
    </span>
  );
}
