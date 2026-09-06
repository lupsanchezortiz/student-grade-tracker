import { ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <span className="group relative inline-flex">
      <Button
        type="submit"
        size="icon-sm"
        variant={variant}
        disabled={disabled}
        aria-label={label}
      >
        <Icon />
      </Button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
