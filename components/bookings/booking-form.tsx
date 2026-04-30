"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestForm } from "@/components/guests/guest-form";
import { createBooking, listAvailableRooms } from "@/lib/actions/bookings";
import { formatTHB, calcNights } from "@/lib/format";
import { VAT_RATE } from "@/lib/constants";

type Guest = { id: string; full_name: string; phone: string | null };

type RoomOption = {
  id: string;
  room_number: string;
  floor: string | null;
  status: string;
  busy?: boolean;
  room_type:
    | { id: string; name: string; base_price: number; max_occupancy: number }
    | { id: string; name: string; base_price: number; max_occupancy: number }[]
    | null;
};

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () =>
  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function pickType(t: RoomOption["room_type"]) {
  if (!t) return null;
  return Array.isArray(t) ? t[0] : t;
}

export function BookingForm({
  guests,
  initialGuestId,
}: {
  guests: Guest[];
  initialGuestId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [guestId, setGuestId] = useState<string>(initialGuestId ?? "");
  const [checkIn, setCheckIn] = useState<string>(today());
  const [checkOut, setCheckOut] = useState<string>(tomorrow());
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [applyVat, setApplyVat] = useState<boolean>(false);
  const [source, setSource] = useState<string>("walk_in");
  const [notes, setNotes] = useState<string>("");
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
      setRoomOptions([]);
      return;
    }
    setLoadingRooms(true);
    listAvailableRooms({ check_in_date: checkIn, check_out_date: checkOut })
      .then((res) => {
        if (res.error) toast.error(res.error);
        else setRoomOptions((res.data as RoomOption[]) ?? []);
      })
      .finally(() => setLoadingRooms(false));
  }, [checkIn, checkOut]);

  const selectedRoom = roomOptions.find((r) => r.id === roomId) ?? null;
  const selectedType = pickType(selectedRoom?.room_type ?? null);

  const pricing = useMemo(() => {
    const nights =
      checkIn && checkOut && new Date(checkOut) > new Date(checkIn)
        ? calcNights(checkIn, checkOut)
        : 0;
    const base = Number(selectedType?.base_price ?? 0);
    const subtotal = base * nights;
    const taxableBase = Math.max(0, subtotal - discount);
    const tax = applyVat ? Math.round(taxableBase * VAT_RATE) : 0;
    const grand = taxableBase + tax;
    return { nights, subtotal, tax, grand, base };
  }, [checkIn, checkOut, selectedType, discount, applyVat]);

  function action(formData: FormData) {
    if (!guestId) {
      toast.error("กรุณาเลือกแขก");
      return;
    }
    if (!roomId) {
      toast.error("กรุณาเลือกห้อง");
      return;
    }
    formData.set("guest_id", guestId);
    formData.set("room_id", roomId);
    formData.set("check_in_date", checkIn);
    formData.set("check_out_date", checkOut);
    formData.set("num_adults", String(adults));
    formData.set("num_children", String(children));
    formData.set("discount_amount", String(discount));
    formData.set("apply_vat", applyVat ? "true" : "false");
    formData.set("source", source);
    formData.set("notes", notes);

    startTransition(async () => {
      const res = await createBooking(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("สร้างการจองแล้ว");
      const id =
        res.data && typeof res.data === "object"
          ? (res.data as { id?: string }).id
          : undefined;
      router.push(id ? `/bookings/${id}` : "/bookings");
    });
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. เลือกแขก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label>แขก</Label>
                <Select
                  value={guestId}
                  onValueChange={(v) => v && setGuestId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกแขก" />
                  </SelectTrigger>
                  <SelectContent>
                    {guests.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.full_name}
                        {g.phone ? ` · ${g.phone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <GuestForm redirectAfter={false} triggerLabel="เพิ่มแขกใหม่" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. วันที่และจำนวนคน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="check_in_date">วันเข้าพัก</Label>
                <Input
                  type="date"
                  id="check_in_date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="check_out_date">วันออก</Label>
                <Input
                  type="date"
                  id="check_out_date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="num_adults">ผู้ใหญ่</Label>
                <Input
                  type="number"
                  id="num_adults"
                  min={1}
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="num_children">เด็ก</Label>
                <Input
                  type="number"
                  id="num_children"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              3. เลือกห้อง{" "}
              {loadingRooms && (
                <span className="text-muted-foreground ml-2 text-xs">
                  กำลังโหลด...
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roomOptions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                เลือกวันที่เพื่อตรวจห้องที่ว่าง
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {roomOptions.map((r) => {
                  const t = pickType(r.room_type);
                  const disabled = r.busy;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setRoomId(r.id)}
                      className={
                        "flex flex-col items-start rounded-lg border p-3 text-left transition-colors " +
                        (roomId === r.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted ") +
                        (disabled ? " cursor-not-allowed opacity-50" : "")
                      }
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-serif text-lg">
                          {r.room_number}
                        </span>
                        {disabled && (
                          <span className="text-destructive text-xs">
                            ไม่ว่าง
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {t?.name ?? ""} · {formatTHB(t?.base_price ?? 0)} / คืน
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">เพิ่มเติม</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>ช่องทาง</Label>
                <Select value={source} onValueChange={(v) => v && setSource(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk_in">หน้าที่พัก</SelectItem>
                    <SelectItem value="phone">โทรศัพท์</SelectItem>
                    <SelectItem value="website">เว็บไซต์</SelectItem>
                    <SelectItem value="agoda">Agoda</SelectItem>
                    <SelectItem value="booking">Booking.com</SelectItem>
                    <SelectItem value="other">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discount_amount">ส่วนลด (฿)</Label>
                <Input
                  type="number"
                  id="discount_amount"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={applyVat}
                onCheckedChange={(v) => setApplyVat(!!v)}
              />
              คิดภาษีมูลค่าเพิ่ม 7%
            </label>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-3">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle className="text-base">สรุปราคา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="ห้องที่เลือก" value={selectedRoom?.room_number ?? "—"} />
            <Row
              label={`ราคา/คืน × ${pricing.nights} คืน`}
              value={formatTHB(pricing.subtotal)}
            />
            <Row label="ส่วนลด" value={`- ${formatTHB(discount)}`} />
            {applyVat && (
              <Row label="VAT 7%" value={formatTHB(pricing.tax)} />
            )}
            <div className="border-t pt-3">
              <Row
                label="รวมทั้งสิ้น"
                value={formatTHB(pricing.grand)}
                bold
              />
            </div>
            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? "กำลังบันทึก..." : "บันทึกการจอง"}
            </Button>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={
        "flex items-center justify-between " +
        (bold ? "text-base font-semibold" : "")
      }
    >
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
