import type { CSSProperties } from "react";
import { artistSegments, type Song, type SongLabels } from "@/lib/catalog";
import { LabelChips } from "@/components/radio/LabelChips";
import { cn } from "@/lib/utils";

export function SongCard({
  song,
  number,
  labels,
  activeArtist = null,
  onArtistClick,
  style,
}: {
  song: Song;
  number: number;
  labels: SongLabels;
  activeArtist?: string | null;
  onArtistClick?: (key: string) => void;
  style?: CSSProperties;
}) {
  return (
    <li
      style={style}
      className="group animate-rise-in relative flex gap-4 rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-blush-deep hover:shadow-card sm:px-5"
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary font-display text-secondary-foreground transition-colors group-hover:bg-accent"
      >
        <span className="text-[9px] leading-none tracking-airy opacity-70">NO.</span>
        <span className="text-lg leading-tight font-semibold lining-nums tabular-nums">
          {String(number).padStart(2, "0")}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-serif text-[17px] leading-snug font-semibold text-foreground">{song.title}</h3>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          <span className="sr-only">歌手：</span>
          {artistSegments(song.artist).map((seg, i) => {
            const key = seg.key;
            return key && onArtistClick ? (
              <button
                key={i}
                type="button"
                onClick={() => onArtistClick(key)}
                aria-label={activeArtist === key ? `取消只看 ${seg.text}` : `只看 ${seg.text} 的歌`}
                aria-pressed={activeArtist === key}
                className={cn(
                  "cursor-pointer rounded underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  activeArtist === key && "font-medium text-primary",
                )}
              >
                {seg.text}
              </button>
            ) : (
              <span key={i}>{seg.text}</span>
            );
          })}
        </p>
        <div className="mt-2.5">
          <LabelChips labels={labels} />
        </div>
      </div>
    </li>
  );
}