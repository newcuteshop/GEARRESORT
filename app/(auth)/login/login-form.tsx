"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";

type State = { error?: string } | undefined;

export function LoginForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    loginAction,
    undefined,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@resort.com"
          autoComplete="email"
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">รหัสผ่าน</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          minLength={6}
          disabled={pending}
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-600 hover:to-sky-700"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            กำลังเข้าสู่ระบบ...
          </>
        ) : (
          "เข้าสู่ระบบ"
        )}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ
      </p>
    </form>
  );
}
