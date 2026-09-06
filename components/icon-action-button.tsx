"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IconActionButtonProps = {
  label: string;
  icon: LucideIcon;
  variant?: "outline" | "ghost" | "destructive";
  disabled?: boolean;
};

export function IconActionButton({
  label,
  icon: Icon,
  variant = "ghost",
  disabled = false,
}: IconActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={200}
        nativeButton={false}
        render={<span className="inline-flex" />}
      >
        <Button
          type="submit"
          size="icon-sm"
          variant={variant}
          disabled={disabled}
          aria-label={label}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
