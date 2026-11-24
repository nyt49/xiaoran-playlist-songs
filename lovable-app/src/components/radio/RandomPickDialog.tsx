import { useCallback, useEffect, useRef, useState } from "react";
import { Shuffle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cherry } from "@/components/radio/Cherry";
import { pickRandomSong, type Song, type SongLabels } from "@/lib/catalog";
import { LabelChips } from "@/components/radio/LabelChips";

const SHUFFLE_MS = 900;
const TICK_MS = 75;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RandomPickDialog({
  open,
  onOpenChange,
  songs,
  labelsOf,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songs: Song[];
  labelsOf: (song: Song) => SongLabels;
}) {
  const [shown, setShown] = useState<Song | null>(null);
  const [tuning, setTuning] = useState(false);
  const [round, setRound] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const spin = useCallback(() => {
    clearTimers();
    const final = pickRandomSong(songs);
    if (!final) {
      setShown(null);
      return;
    }
    if (prefersReducedMotion()) {
      setShown(final);
      setTuning(false);
      setRound((r) => r + 1);
      return;
    }
    setTuning(true);
    const ticks = Math.floor(SHUFFLE_MS / TICK_MS);
    for (let i = 0; i < ticks; i++) {
      timers.current.push(
        window.setTimeout(() => setShown(pickRandomSong(songs)), i * TICK_MS + (i * i) / 2),
      );
    }
    timers.current.push(
      window.setTimeout(() => {
        setShown(final);
        setTuning(false);
        setRound((r) => r + 1);
      }, SHUFFLE_MS + (ticks * ticks) / 2),
    );
  }, [songs]);

  useEffect(() => {
    if (open) spin();
    return clearTimers;
  }, [open, spin]);

  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border-blush-deep/60 bg-card-glow p-0">
        <div className="relative px-6 pt-8 pb-6 text-center sm:px-8">
          <div aria-hidden="true" className="paper-dots absolute inset-0 opacity-60" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-[11px] font-medium tracking-airy text-primary shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-on-air" />
              {tuning ? "TUNING…" : "NOW ON AIR"}
            </p>
            <DialogTitle className="mt-4 font-serif text-sm font-medium text-muted-foreground">
              今天為你點播的是
            </DialogTitle>

            <div className="mt-5 flex justify-center">
              <Cherry className="h-14 w-14" sway={!tuning} />
            </div>

            <div aria-live="polite" aria-atomic="true" className="mt-4 min-h-[112px]">
              {shown ? (
                <div key={tuning ? "t" : `r-${round}`} className={tuning ? "opacity-60" : "animate-pop-in"}>
                  <p className="font-serif text-[28px] leading-tight font-semibold text-foreground text-balance sm:text-3xl">
                    {shown.title}
                  </p>
                  <DialogDescription className="mt-2 text-base text-muted-foreground">
                    {shown.artist}
                  </DialogDescription>
                  {!tuning && (
                    <div className="mt-3">
                      <LabelChips labels={labelsOf(shown)} size="md" align="center" />
                    </div>
                  )}
                </div>
              ) : (
                <DialogDescription className="pt-6 text-muted-foreground">
                  歌單還是空的，先去收藏幾首歌吧 🍒
                </DialogDescription>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-card/70 px-6 py-4 sm:flex-row sm:justify-center sm:px-8">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            收下這首
          </Button>
          <Button variant="cherry" onClick={spin} disabled={tuning || songs.length === 0}>
            <Shuffle />
            再抽一首
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}