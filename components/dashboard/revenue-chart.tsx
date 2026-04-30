"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Point = { date: string; total: number };

export function RevenueChart({ data }: { data: Point[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "d MMM", { locale: th }),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formatted}
          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(199 89% 48%)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            stroke="hsl(215 16% 47%)"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="hsl(215 16% 47%)"
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
          />
          <Tooltip
            formatter={(v) => [`฿${Number(v ?? 0).toLocaleString()}`, "ยอดจอง"]}
            labelStyle={{ color: "hsl(222 47% 11%)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(214 32% 91%)",
              boxShadow: "0 4px 12px rgba(15,23,42,.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(199 89% 48%)"
            strokeWidth={2}
            fill="url(#rev)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
