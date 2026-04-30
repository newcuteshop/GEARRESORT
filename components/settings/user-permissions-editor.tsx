"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NAV_ITEMS } from "@/components/layout/sidebar-nav";
import type { MenuKey } from "@/lib/actions/auth";
import { setUserPermissions } from "@/lib/actions/users";

export function UserPermissionsEditor({
  userId,
  role,
  current,
}: {
  userId: string;
  role: string;
  current: MenuKey[];
}) {
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState<MenuKey[]>(current);
  const [pending, startTransition] = useTransition();

  const isAdmin = role === "admin";
  const enabledCount = isAdmin ? NAV_ITEMS.length : perms.length;

  function toggle(key: MenuKey, on: boolean) {
    setPerms((prev) =>
      on ? Array.from(new Set([...prev, key])) : prev.filter((k) => k !== key),
    );
  }

  function save() {
    startTransition(async () => {
      const res = await setUserPermissions(userId, perms);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("บันทึกสิทธิแล้ว");
      setOpen(false);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <Shield className="size-3.5" />
            {isAdmin ? "ทุกเมนู" : `${enabledCount} / ${NAV_ITEMS.length}`}
          </Button>
        }
      />
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">สิทธิเข้าถึงเมนู</p>
            {isAdmin && (
              <p className="text-muted-foreground text-xs">
                ผู้ดูแลระบบเข้าถึงทุกเมนูเสมอ
              </p>
            )}
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const checked = isAdmin ? true : perms.includes(item.key);
              return (
                <label
                  key={item.key}
                  className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={checked}
                    disabled={isAdmin}
                    onCheckedChange={(v) => toggle(item.key, !!v)}
                  />
                  <Icon className="size-3.5" />
                  <span className="flex-1">{item.label}</span>
                </label>
              );
            })}
          </div>
          {!isAdmin && (
            <Button
              size="sm"
              className="w-full"
              onClick={save}
              disabled={pending}
            >
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
