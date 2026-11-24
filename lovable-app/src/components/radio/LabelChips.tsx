import type { SongLabels } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Song labels shown as two visually distinct groups: 語言 (butter) and 類型 (blush). */
export function LabelChips({
  labels,
  size = "sm",
  align = "start",
}: {
  labels: SongLabels;
  size?: "sm" | "md";
  align?: "start" | "center";
}) {
  const chip = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  const empty = labels.language.length === 0 && labels.genre.length === 0;
  if (empty) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5", align === "center" && "justify-center")}>
      {labels.language.length > 0 && (
        <span className="inline-flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-medium tracking-airy text-muted-foreground">語言</span>
          {labels.language.map((t) => (
            <span key={t} className={cn("rounded-full border border-butter-deep bg-butter font-medium text-foreground", chip)}>
              {t}
            </span>
          ))}
        </span>
      )}
      {labels.genre.length > 0 && (
        <span className="inline-flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-medium tracking-airy text-muted-foreground">類型</span>
          {labels.genre.map((t) => (
            <span key={t} className={cn("rounded-full bg-blush font-medium text-secondary-foreground", chip)}>
              {t}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}