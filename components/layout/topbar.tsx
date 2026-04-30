import { LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/lib/actions/auth";
import type { Role } from "@/lib/auth/rbac";
import { MobileNav } from "./mobile-nav";

const ROLE_LABEL: Record<Role, string> = {
  admin: "ผู้ดูแลระบบ",
  receptionist: "พนักงานต้อนรับ",
  housekeeping: "แม่บ้าน",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function Topbar({
  fullName,
  email,
  role,
}: {
  fullName: string;
  email: string;
  role: Role;
}) {
  return (
    <header className="bg-background/85 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
      <MobileNav role={role} />
      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-auto gap-2 rounded-full p-1.5"
              aria-label="เมนูผู้ใช้"
            />
          }
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {initials(fullName) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left leading-tight sm:block">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="text-muted-foreground text-[11px]">
              {ROLE_LABEL[role]}
            </p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-muted-foreground truncate text-xs font-normal">
                {email}
              </p>
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {ROLE_LABEL[role]}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <UserIcon className="size-4" /> โปรไฟล์
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action={logoutAction}>
            <DropdownMenuItem
              variant="destructive"
              render={<button type="submit" className="w-full" />}
            >
              <LogOut className="size-4" /> ออกจากระบบ
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
