"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import { listBookingsForCalendar } from "@/lib/actions/bookings";
import { Loader2 } from "lucide-react";

const STATUS_BG: Record<string, string> = {
  pending: "#fbbf24",
  confirmed: "#0ea5e9",
  checked_in: "#10b981",
  checked_out: "#94a3b8",
  cancelled: "#f43f5e",
  no_show: "#a3a3a3",
};

type Booking = {
  id: string;
  booking_code: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  guest: { full_name: string } | { full_name: string }[] | null;
  room: { id: string; room_number: string } | { id: string; room_number: string }[] | null;
};

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export function BookingCalendar() {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<{ id: string; title: string }[]>(
    [],
  );
  const [events, setEvents] = useState<
    {
      id: string;
      resourceId: string;
      title: string;
      start: string;
      end: string;
      backgroundColor: string;
      borderColor: string;
    }[]
  >([]);

  async function load(from: Date, to: Date) {
    setLoading(true);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    const res = await listBookingsForCalendar(fromStr, toStr);
    if (res.data) {
      const { bookings, rooms } = res.data;
      setResources(
        rooms.map((r) => ({ id: r.id, title: `ห้อง ${r.room_number}` })),
      );
      setEvents(
        (bookings as Booking[]).map((b) => {
          const guest = pickOne(b.guest);
          const room = pickOne(b.room);
          const color = STATUS_BG[b.status] ?? "#0ea5e9";
          return {
            id: b.id,
            resourceId: room?.id ?? "",
            title: `${b.booking_code} · ${guest?.full_name ?? ""}`,
            start: b.check_in_date,
            end: b.check_out_date,
            backgroundColor: color,
            borderColor: color,
          };
        }),
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    const start = new Date();
    start.setDate(1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    load(start, end);
  }, []);

  return (
    <div className="bg-card relative rounded-2xl border p-3 shadow-sm">
      {loading && (
        <div className="bg-background/40 absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
          <Loader2 className="text-primary size-6 animate-spin" />
        </div>
      )}
      <FullCalendar
        ref={calendarRef}
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        initialView="resourceTimelineMonth"
        height="auto"
        schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "resourceTimelineWeek,resourceTimelineMonth",
        }}
        buttonText={{
          today: "วันนี้",
          month: "เดือน",
          week: "สัปดาห์",
        }}
        locale="th"
        firstDay={1}
        resourceAreaHeaderContent="ห้องพัก"
        resourceAreaWidth="120px"
        resources={resources}
        events={events}
        editable={false}
        nowIndicator
        datesSet={(arg) => load(arg.start, arg.end)}
        eventClick={(arg) => router.push(`/bookings/${arg.event.id}`)}
        dateClick={(arg) => {
          const dateStr =
            arg.date instanceof Date
              ? arg.date.toISOString().slice(0, 10)
              : "";
          router.push(`/bookings/new?date=${dateStr}`);
        }}
      />
    </div>
  );
}
