export const APP_NAME = "GEARRESORT";
export const APP_TAGLINE = "ระบบจัดการรีสอร์ท";
export const VAT_RATE = 0.07;

export const ROOM_STATUS_STYLE: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  occupied: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  cleaning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  maintenance: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  out_of_service: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export const ROOM_STATUS_LABEL: Record<string, string> = {
  available: "ว่าง",
  occupied: "มีผู้เข้าพัก",
  cleaning: "กำลังทำความสะอาด",
  maintenance: "ซ่อมบำรุง",
  out_of_service: "ปิดใช้งาน",
};

export const BOOKING_STATUS_STYLE: Record<
  string,
  { label: string; class: string }
> = {
  pending: {
    label: "รอยืนยัน",
    class: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    class: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  },
  checked_in: {
    label: "Check-in",
    class: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  checked_out: {
    label: "Check-out",
    class: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  },
  cancelled: {
    label: "ยกเลิก",
    class: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  },
  no_show: {
    label: "No Show",
    class: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200",
  },
};

export const PAYMENT_STATUS_STYLE: Record<
  string,
  { label: string; class: string }
> = {
  unpaid: { label: "ยังไม่ชำระ", class: "bg-rose-50 text-rose-700" },
  partial: { label: "ชำระบางส่วน", class: "bg-amber-50 text-amber-700" },
  paid: { label: "ชำระแล้ว", class: "bg-emerald-50 text-emerald-700" },
  refunded: { label: "คืนเงิน", class: "bg-slate-100 text-slate-600" },
};

export const formatTHB = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
