"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ROOM_STATUS_LABEL } from "@/lib/constants";

const COLORS: Record<string, string> = {
  available: "hsl(142 71% 45%)",
  occupied: "hsl(199 89% 48%)",
  cleaning: "hsl(38 92% 50%)",
  maintenance: "hsl(0 72% 51%)",
  out_of_service: "hsl(215 16% 60%)",
};

export function RoomStatusDonut({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const data = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([status, value]) => ({
      status,
      label: ROOM_STATUS_LABEL[status] ?? status,
      value,
    }));

  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
        ยังไม่มีห้อง
      </div>
    );
  }

  return (
    <div className="grid h-64 grid-cols-2 items-center gap-3">
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.status} fill={COLORS[d.status] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, name) => [`${Number(v ?? 0)} ห้อง`, String(name)]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(214 32% 91%)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-serif text-2xl">{total}</p>
          <p className="text-muted-foreground text-xs">ห้องทั้งหมด</p>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: COLORS[d.status] ?? "#94a3b8" }}
            />
            <span className="text-muted-foreground flex-1">{d.label}</span>
            <span className="font-medium">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
