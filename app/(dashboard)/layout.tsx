import { requireAuth } from "@/lib/auth/rbac";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="bg-surface flex min-h-screen">
      <AppSidebar permissions={user.profile.permissions} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          fullName={user.profile.full_name}
          email={user.profile.email}
          role={user.profile.role}
          permissions={user.profile.permissions}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
