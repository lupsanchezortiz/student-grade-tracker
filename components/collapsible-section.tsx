"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  itemCount,
  defaultOpen = false,
  header,
  toolbar,
  children,
}: {
  itemCount: number;
  defaultOpen?: boolean;
  header: ReactNode;
  toolbar: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const itemLabel = itemCount === 1 ? "1 line item" : `${itemCount} line items`;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      {header}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-expanded={open}
          aria-label={open ? `Collapse section, ${itemLabel}` : `Expand section, ${itemLabel}`}
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown className={cn("transition-transform", !open && "-rotate-90")} />
        </Button>
        <span className="text-sm text-muted-foreground">{itemLabel}</span>
        {toolbar}
      </div>
      {open ? children : null}
    </section>
  );
}
