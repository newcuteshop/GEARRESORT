"use client";

import { useState } from "react";
import { CalendarRange, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "./booking-calendar";

export function BookingsTabs({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div className="space-y-4">
      <div className="bg-muted inline-flex rounded-lg p-1 text-sm">
        <Button
          size="sm"
          variant={view === "list" ? "default" : "ghost"}
          onClick={() => setView("list")}
        >
          <ListIcon className="size-4" /> รายการ
        </Button>
        <Button
          size="sm"
          variant={view === "calendar" ? "default" : "ghost"}
          onClick={() => setView("calendar")}
        >
          <CalendarRange className="size-4" /> ปฏิทิน
        </Button>
      </div>

      {view === "list" ? children : <BookingCalendar />}
    </div>
  );
}
