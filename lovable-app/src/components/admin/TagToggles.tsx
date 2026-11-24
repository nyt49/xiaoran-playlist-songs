import { Check } from "lucide-react";
import type { Category } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Multi-select label chips: each song can carry any number of labels. */
export function TagToggles({
  categories,
  value,
  onChange,
  disabled,
  label,
  tone = "cherry",
}: {
  categories: Category[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  label: string;
  tone?: "cherry" | "butter";
}) {
  if (categories.length === 0) {
    return <p className="text-xs text-muted-foreground">這一組還沒有標籤。</p>;
  }
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const on = value.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(on ? value.filter((id) => id !== c.id) : [...value, c.id])}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              on
                ? tone === "butter"
                  ? "border-butter-deep bg-butter-deep text-foreground shadow-soft"
                  : "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-border bg-card text-foreground hover:border-blush-deep hover:bg-secondary",
            )}
          >
            {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            {c.name}
          </button>
        );
      })}
    </div>
  );
}