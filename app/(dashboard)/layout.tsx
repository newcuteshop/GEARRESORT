import { requireAuth } from "@/lib/auth/rbac";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="bg-surface min-h-screen">
      {/* Sidebar + Topbar จะถูกแทนใน Phase 4 */}
      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
