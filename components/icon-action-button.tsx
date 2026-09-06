"use client";

import { ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ICONS = {
  save: Save,
  up: ChevronUp,
  down: ChevronDown,
  remove: Trash2,
} as const;

type IconActionButtonProps = {
  label: string;
  action: keyof typeof ICONS;
  variant?: "outline" | "ghost" | "destructive";
  disabled?: boolean;
};

export function IconActionButton({
  label,
  action,
  variant = "ghost",
  disabled = false,
}: IconActionButtonProps) {
  const Icon = ICONS[action];
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
