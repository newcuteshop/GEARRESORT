"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar-nav";
import { APP_NAME } from "@/lib/constants";
import type { Role } from "@/lib/auth/rbac";

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="เปิดเมนู"
            className="lg:hidden"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3"
            >
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
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 py-3">
          <SidebarNav role={role} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
