import { cn } from "@/lib/utils";

export function FilterChip({
  active,
  label,
  count,
  onClick,
  tone = "cherry",
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  tone?: "cherry" | "cocoa" | "butter";
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? tone === "cherry"
            ? "border-primary bg-primary text-primary-foreground shadow-cherry"
            : tone === "butter"
              ? "border-butter-deep bg-butter-deep text-foreground shadow-soft"
              : "border-foreground bg-foreground text-background shadow-soft"
          : "border-border bg-card text-foreground hover:border-blush-deep hover:bg-secondary",
      )}
    >
      {label}
      <span className={cn("text-xs tabular-nums", active ? "opacity-80" : "text-muted-foreground")}>{count}</span>
    </button>
  );
}