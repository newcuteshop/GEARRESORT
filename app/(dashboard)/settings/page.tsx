import { requireRole } from "@/lib/auth/rbac";
import { listUsers } from "@/lib/actions/users";
import { PageHeader } from "@/components/shared/page-header";
import { InviteUserForm } from "@/components/settings/invite-user-form";
import {
  UserRoleSelect,
  UserActiveSwitch,
} from "@/components/settings/user-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateShort } from "@/lib/format";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireRole(["admin"]);
  const { data: users, error } = await listUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="ตั้งค่า"
        description="จัดการผู้ใช้และข้อมูลรีสอร์ท"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลรีสอร์ท</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="ชื่อรีสอร์ท" value={APP_NAME} />
          <Field label="VAT" value="7%" />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">ผู้ใช้งานระบบ</h2>
        <InviteUserForm />
      </div>

      {error && (
        <div className="text-destructive text-sm">เกิดข้อผิดพลาด: {error}</div>
      )}

      <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead>บทบาท</TableHead>
              <TableHead>เปิดใช้งาน</TableHead>
              <TableHead>เพิ่มเมื่อ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users ?? []).map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {u.email}
                </TableCell>
                <TableCell>
                  <UserRoleSelect userId={u.id} current={u.role} />
                </TableCell>
                <TableCell>
                  <UserActiveSwitch userId={u.id} active={u.is_active} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDateShort(u.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
