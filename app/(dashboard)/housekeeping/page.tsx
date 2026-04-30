import { Sparkles } from "lucide-react";
import { requireAuth } from "@/lib/auth/rbac";
import {
  listHousekeepingTasks,
  listStaff,
} from "@/lib/actions/housekeeping";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  TaskStatusSelect,
  TaskAssignSelect,
} from "@/components/housekeeping/task-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

const PRIORITY_STYLE: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  normal: "bg-sky-50 text-sky-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-rose-50 text-rose-700",
};
const PRIORITY_LABEL: Record<string, string> = {
  low: "ต่ำ",
  normal: "ปกติ",
  high: "สูง",
  urgent: "เร่งด่วน",
};

const COLUMNS: { key: string; label: string; tone: string }[] = [
  { key: "pending", label: "รอดำเนินการ", tone: "bg-amber-50" },
  { key: "in_progress", label: "กำลังทำ", tone: "bg-sky-50" },
  { key: "done", label: "เสร็จแล้ว", tone: "bg-emerald-50" },
  { key: "blocked", label: "ติดขัด", tone: "bg-rose-50" },
];

type Task = {
  id: string;
  task_type: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  room: { room_number: string } | { room_number: string }[] | null;
  assignee:
    | { full_name: string }
    | { full_name: string }[]
    | null;
};

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function HousekeepingPage() {
  const user = await requireAuth();
  const [{ data, error }, { data: staffData }] = await Promise.all([
    listHousekeepingTasks(),
    listStaff(),
  ]);
  const allTasks = ((data as Task[] | null) ?? []) as Task[];
  const staff = (staffData ?? [])
    .filter((s) => s.role === "housekeeping" || s.role === "admin")
    .map((s) => ({ id: s.id, full_name: s.full_name }));

  // ถ้าเป็น housekeeping role ให้เห็นเฉพาะของตัวเอง
  const tasks =
    user.profile.role === "housekeeping"
      ? allTasks.filter((t) => t.assigned_to === user.profile.id)
      : allTasks;

  return (
    <div className="space-y-6">
      <PageHeader
        title="แม่บ้าน"
        description="งานทำความสะอาดและบำรุงรักษาห้องพัก"
      />

      {error && (
        <div className="text-destructive text-sm">เกิดข้อผิดพลาด: {error}</div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="ยังไม่มีงาน"
          description="เมื่อมีการ check-out งานทำความสะอาดจะถูกสร้างให้อัตโนมัติ"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="space-y-3">
                <div className={"rounded-xl px-3 py-2 " + col.tone}>
                  <p className="text-sm font-medium">
                    {col.label} ({colTasks.length})
                  </p>
                </div>
                {colTasks.map((t) => {
                  const room = pickOne(t.room);
                  const assignee = pickOne(t.assignee);
                  return (
                    <Card key={t.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="font-serif text-2xl">
                            {room?.room_number ?? "—"}
                          </CardTitle>
                          <span
                            className={
                              "rounded-full px-2 py-0.5 text-xs font-medium " +
                              (PRIORITY_STYLE[t.priority] ?? "bg-muted")
                            }
                          >
                            {PRIORITY_LABEL[t.priority] ?? t.priority}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          งาน: {t.task_type}
                        </p>
                        {t.notes && <p className="text-xs">{t.notes}</p>}
                        <p className="text-muted-foreground text-xs">
                          มอบหมาย: {assignee?.full_name ?? "—"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatRelative(t.created_at)}
                        </p>
                        <div className="flex flex-col gap-2 pt-2">
                          <TaskStatusSelect taskId={t.id} current={t.status} />
                          {user.profile.role !== "housekeeping" && (
                            <TaskAssignSelect
                              taskId={t.id}
                              current={t.assigned_to}
                              staff={staff}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
