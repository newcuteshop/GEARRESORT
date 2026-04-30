"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./command-palette";

export function CommandPaletteTrigger() {
  return (
    <>
      <CommandPalette />
      <DesktopSearchHint />
    </>
  );
}

function DesktopSearchHint() {
  const [hover, setHover] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden gap-2 sm:flex"
      onClick={() => {
        const evt = new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          metaKey: true,
          bubbles: true,
        });
        window.dispatchEvent(evt);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Search className="size-4" />
      <span className="text-muted-foreground">ค้นหา</span>
      <kbd
        className={
          "bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px] " +
          (hover ? "border-border border" : "")
        }
      >
        ⌘K
      </kbd>
    </Button>
  );
}
