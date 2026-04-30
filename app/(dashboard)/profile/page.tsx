import { requireAuth } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm, PasswordForm } from "@/components/profile/profile-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireAuth();
  return (
    <div className="space-y-6">
      <PageHeader
        title="โปรไฟล์ของฉัน"
        description="แก้ไขข้อมูลส่วนตัวและเปลี่ยนรหัสผ่าน"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลส่วนตัว</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              defaultName={user.profile.full_name}
              defaultPhone={user.profile.phone ?? ""}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">เปลี่ยนรหัสผ่าน</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
