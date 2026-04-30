import {
  format,
  formatDistanceToNow,
  differenceInCalendarDays,
} from "date-fns";
import { th } from "date-fns/locale";

export const formatTHB = (amount: number | null | undefined) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

export const formatNumber = (n: number | null | undefined) =>
  new Intl.NumberFormat("th-TH").format(n ?? 0);

export const formatDateShort = (d: string | Date) =>
  format(typeof d === "string" ? new Date(d) : d, "dd MMM yy", { locale: th });

export const formatDateFull = (d: string | Date) =>
  format(typeof d === "string" ? new Date(d) : d, "dd MMMM yyyy", {
    locale: th,
  });

export const formatDateTime = (d: string | Date) =>
  format(typeof d === "string" ? new Date(d) : d, "dd MMM yy HH:mm", {
    locale: th,
  });

export const formatRelative = (d: string | Date) =>
  formatDistanceToNow(typeof d === "string" ? new Date(d) : d, {
    addSuffix: true,
    locale: th,
  });

export const calcNights = (checkIn: string | Date, checkOut: string | Date) =>
  Math.max(
    1,
    differenceInCalendarDays(
      typeof checkOut === "string" ? new Date(checkOut) : checkOut,
      typeof checkIn === "string" ? new Date(checkIn) : checkIn,
    ),
  );

export const initialsFromName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

const HUE_PALETTE = [200, 240, 280, 320, 20, 60, 140, 180];

export const colorFromName = (name: string) => {
  const hash = Array.from(name).reduce(
    (acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0,
    7,
  );
  return HUE_PALETTE[Math.abs(hash) % HUE_PALETTE.length];
};
