"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = unknown> = { data?: T; error?: string };

export async function listHousekeepingTasks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("housekeeping_tasks")
    .select(
      "*, room:rooms(room_number), assignee:profiles!housekeeping_tasks_assigned_to_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { error: error.message };
  return { data };
}

export async function listStaff() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("is_active", true);
  if (error) return { error: error.message };
  return { data };
}

export async function createTask(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const room_id = formData.get("room_id") as string;
  const task_type = (formData.get("task_type") as string) || "cleaning";
  const priority = (formData.get("priority") as string) || "normal";
  const notes = (formData.get("notes") as string) || null;
  if (!room_id) return { error: "กรุณาเลือกห้อง" };
  const { error } = await supabase
    .from("housekeeping_tasks")
    .insert({ room_id, task_type, priority, status: "pending", notes });
  if (error) return { error: error.message };
  revalidatePath("/housekeeping");
  return { data: { ok: true } };
}

export async function updateTaskStatus(
  id: string,
  status: "pending" | "in_progress" | "done" | "blocked",
): Promise<ActionResult> {
  const supabase = await createClient();
  const update: Record<string, unknown> = { status };
  if (status === "in_progress") update.started_at = new Date().toISOString();
  if (status === "done") update.completed_at = new Date().toISOString();
  const { data: task, error } = await supabase
    .from("housekeeping_tasks")
    .update(update)
    .eq("id", id)
    .select("room_id")
    .single();
  if (error) return { error: error.message };

  // เมื่อทำความสะอาดเสร็จ → set ห้องเป็น available
  if (status === "done" && task?.room_id) {
    await supabase
      .from("rooms")
      .update({ status: "available" })
      .eq("id", task.room_id);
  }

  revalidatePath("/housekeeping");
  revalidatePath("/rooms");
  return { data: { ok: true } };
}

export async function assignTask(
  id: string,
  assigned_to: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("housekeeping_tasks")
    .update({ assigned_to })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/housekeeping");
  return { data: { ok: true } };
}
