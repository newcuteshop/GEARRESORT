import { requireAuth } from "@/lib/auth/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">{APP_NAME}</p>
        <h1 className="font-serif text-3xl">
          สวัสดี, {user.profile.full_name}
        </h1>
        <p className="text-muted-foreground text-sm">
          บทบาท: <span className="font-medium">{user.profile.role}</span>
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>🎉 ระบบพร้อมใช้งาน — Phase 1 เสร็จสมบูรณ์</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            โครงสร้างพื้นฐาน, Supabase clients, middleware,
            และ design tokens พร้อมแล้ว
          </p>
          <p>
            ขั้นถัดไป: รัน{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              02_DATABASE_SCHEMA.sql
            </code>{" "}
            ที่ Supabase SQL Editor แล้วเข้าสู่ Phase 4 (Modules)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
