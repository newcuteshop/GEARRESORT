"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps, ReactNode } from "react";

export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: { children: ReactNode; pendingLabel?: string } & ComponentProps<
  typeof Button
>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel ?? "กำลังบันทึก..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
