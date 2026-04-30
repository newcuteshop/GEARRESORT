import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";
import { APP_NAME } from "@/lib/constants";
import type { Role } from "@/lib/auth/rbac";

export function AppSidebar({ role }: { role: Role }) {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden w-[260px] shrink-0 flex-col border-r lg:flex">
      <Link href="/" className="flex h-16 items-center gap-3 px-6">
        <div className="from-primary flex size-9 items-center justify-center rounded-xl bg-gradient-to-br to-sky-700 text-white">
          <span className="font-serif text-lg leading-none">G</span>
        </div>
        <div className="leading-tight">
          <p className="font-serif text-base">{APP_NAME}</p>
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
            Resort Management
          </p>
        </div>
      </Link>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <SidebarNav role={role} />
      </div>
      <div className="border-sidebar-border border-t px-6 py-3">
        <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
          v1.0 · {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
