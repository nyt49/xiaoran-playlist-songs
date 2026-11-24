import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { Search, Shuffle, X, RadioTower, ChevronDown, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Cherry } from "@/components/radio/Cherry";
import { SongCard } from "@/components/radio/SongCard";
import { RandomPickDialog } from "@/components/radio/RandomPickDialog";
import { catalogQueryOptions } from "@/lib/catalog.functions";
import {
  LABEL_KINDS,
  UNCATEGORIZED,
  buildArtistOptions,
  countByCategory,
  countUnlabeled,
  filterSongs,
  labelFilter,
  labelsOfKind,
  songLabels,
  type CategoryFilter,
  type LabelKind,
  type Song,
} from "@/lib/catalog";
import { FilterChip } from "@/components/radio/FilterChip";
import { cn } from "@/lib/utils";

const TITLE = "RAN's Little Radio 🍒 小橪的私房歌單";
const DESCRIPTION = "把喜歡的歌，收藏成日常 🍒 搜尋、分類瀏覽，或隨機抽一首小橪收藏的歌。";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  pendingComponent: HomeSkeleton,
  errorComponent: HomeError,
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(catalogQueryOptions());
  const { songs, categories } = data;

  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<CategoryFilter>(null);
  const [genre, setGenre] = useState<CategoryFilter>(null);
  const selected: Record<LabelKind, CategoryFilter> = { language, genre };
  const setSelected: Record<LabelKind, (v: CategoryFilter) => void> = { language: setLanguage, genre: setGenre };
  const [artist, setArtist] = useState<string | null>(null);
  const [showAllArtists, setShowAllArtists] = useState(false);
  const [randomOpen, setRandomOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const numberOf = useMemo(() => new Map(songs.map((s, i) => [s.id, i + 1])), [songs]);
  const counts = useMemo(() => countByCategory(songs), [songs]);

  const visible = useMemo(
    () =>
      filterSongs(songs, {
        query: deferredQuery,
        artist,
        labels: [labelFilter(categories, "language", language), labelFilter(categories, "genre", genre)],
      }),
    [songs, categories, deferredQuery, artist, language, genre],
  );
  const artistOptions = useMemo(() => buildArtistOptions(songs), [songs]);
  const activeArtist = artistOptions.find((a) => a.key === artist) ?? null;
  const ARTIST_PREVIEW = 14;
  const shownArtists = showAllArtists ? artistOptions : artistOptions.slice(0, ARTIST_PREVIEW);
  if (activeArtist && !shownArtists.includes(activeArtist)) shownArtists.push(activeArtist);

  const pickArtist = (key: string) => {
    setArtist((cur) => (cur === key ? null : key));
    document.getElementById("songs-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const clearAll = () => {
    setQuery("");
    setLanguage(null);
    setGenre(null);
    setArtist(null);
  };

  const labelsOf = (song: Song) => songLabels(song, categories);
  const filterName = (v: CategoryFilter) =>
    v === null ? null : v === UNCATEGORIZED ? "未標記" : (categoryName.get(v) ?? null);
  const activeParts = [filterName(language), filterName(genre), activeArtist?.name ?? null].filter(
    (x): x is string => x !== null,
  );
  const activeCategoryLabel = activeParts.length ? activeParts.join(" · ") : "全部";
  const isFiltering = query.trim() !== "" || language !== null || genre !== null || artist !== null;

  const groups = LABEL_KINDS.map(({ kind, title }) => {
    const list = labelsOfKind(categories, kind);
    const unlabeled = countUnlabeled(songs, list.map((c) => c.id));
    return {
      kind,
      title,
      chips: [
        { value: null as CategoryFilter, label: "全部", count: songs.length },
        ...list.map((c) => ({ value: c.id as CategoryFilter, label: c.name, count: counts.get(c.id) ?? 0 })),
        ...(unlabeled > 0 && unlabeled < songs.length
          ? [{ value: UNCATEGORIZED as CategoryFilter, label: "未標記", count: unlabeled }]
          : []),
      ],
    };
  });

  return (
    <div className="relative min-h-dvh">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-blush-wash" />
      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <div className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
          <Cherry className="h-6 w-6" />
          <span className="font-display text-lg italic">RAN's Radio</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-[11px] font-medium tracking-airy text-primary shadow-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-on-air" aria-hidden="true" />
          ON AIR
        </span>
      </header>

      <main className="relative mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        {/* Hero */}
        <section className="relative pt-12 pb-10 text-center sm:pt-16 sm:pb-12">
          <Cherry className="absolute top-7 left-1 h-9 w-9 opacity-80 sm:top-8 sm:left-10" sway />
          <Cherry className="absolute top-9 right-3 h-7 w-7 rotate-12 opacity-60 sm:top-24 sm:right-16" sway />

          <p className="flex items-center justify-center gap-2 text-[11px] font-medium tracking-airy text-muted-foreground sm:text-xs">
            <RadioTower className="h-3.5 w-3.5" aria-hidden="true" />
            FM 0520 · 小橪的私房頻道
          </p>
          <h1 className="mt-4 font-display text-[44px] leading-[1.02] font-semibold text-foreground sm:text-7xl">
            RAN's Little <span className="italic text-primary">Radio</span>
          </h1>
          <p className="mt-4 font-serif text-base text-secondary-foreground sm:text-lg">
            把喜歡的歌，收藏成日常 🍒
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              variant="cherry"
              size="xl"
              onClick={() => setRandomOpen(true)}
              disabled={songs.length === 0}
              className="min-w-[220px]"
            >
              <Shuffle />
              隨機點一首
            </Button>
            <p className="text-xs text-muted-foreground">
              從全部 <span className="font-semibold text-foreground">{songs.length}</span> 首收藏中，為你抽一首
            </p>
          </div>
        </section>

        {/* Search */}
        <section aria-label="搜尋" className="sticky top-0 z-20 -mx-5 bg-background/85 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:rounded-b-3xl sm:px-8">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋歌名或歌手…"
              aria-label="搜尋歌名或歌手"
              className="h-12 rounded-full pr-11 pl-11 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="清除搜尋"
                className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        {/* Two independent filters: song labels and artists */}
        <section aria-label="篩選" className="mt-2 grid gap-4">
          {groups.map((g) => (
            <div key={g.kind}>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-airy text-muted-foreground">
                <span
                  aria-hidden="true"
                  className={g.kind === "language" ? "h-2.5 w-2.5 rounded-full border border-butter-deep bg-butter" : "h-2.5 w-2.5 rounded-full bg-blush-deep"}
                />
                {g.title}
              </p>
              <div
                role="radiogroup"
                aria-label={`依${g.title}篩選`}
                className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
              >
                {g.chips.map((chip) => (
                  <FilterChip
                    key={chip.value ?? "all"}
                    tone={g.kind === "language" ? "butter" : "cherry"}
                    active={selected[g.kind] === chip.value}
                    label={chip.label}
                    count={chip.count}
                    onClick={() => setSelected[g.kind](chip.value)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-airy text-muted-foreground">
              <Mic2 className="h-3.5 w-3.5" aria-hidden="true" /> 歌手
            </p>
            <div
              role="radiogroup"
              aria-label="依歌手篩選"
              className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              <FilterChip
                tone="cocoa"
                active={artist === null}
                label="所有歌手"
                count={artistOptions.length}
                onClick={() => setArtist(null)}
              />
              {shownArtists.map((a) => (
                <FilterChip
                  key={a.key}
                  tone="cocoa"
                  active={artist === a.key}
                  label={a.name}
                  count={a.count}
                  onClick={() => setArtist(artist === a.key ? null : a.key)}
                />
              ))}
              {artistOptions.length > ARTIST_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setShowAllArtists((v) => !v)}
                  aria-expanded={showAllArtists}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 py-2 text-sm text-primary transition-colors hover:bg-secondary"
                >
                  {showAllArtists ? "收合" : `更多歌手 +${artistOptions.length - ARTIST_PREVIEW}`}
                  <ChevronDown className={showAllArtists ? "h-4 w-4 rotate-180 transition-transform" : "h-4 w-4 transition-transform"} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Results */}
        <section aria-labelledby="songs-heading" className="mt-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="songs-heading" className="scroll-mt-24 font-serif text-lg font-semibold text-foreground">
              {activeCategoryLabel}
              <span className="ml-2 text-sm font-normal text-muted-foreground">收藏</span>
            </h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {isFiltering ? (
                <>
                  找到 <span className="font-semibold text-foreground tabular-nums">{visible.length}</span> /{" "}
                  {songs.length} 首
                  <button
                    type="button"
                    onClick={clearAll}
                    className="ml-2 cursor-pointer rounded-full px-2 py-0.5 text-primary underline-offset-4 hover:underline"
                  >
                    清除篩選
                  </button>
                </>
              ) : (
                <>
                  共 <span className="font-semibold text-foreground tabular-nums">{songs.length}</span> 首歌
                </>
              )}
            </p>
          </div>

          {songs.length === 0 ? (
            <EmptyState title="歌單還在準備中" body="小橪正在挑選喜歡的歌，晚點再來聽聽看吧 🍒" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="沒有找到符合的歌"
              body={query.trim() ? `找不到和「${query.trim()}」有關的歌名或歌手。` : "目前沒有符合這些篩選條件的歌。"}
              action={
                <Button
                  variant="soft"
                  onClick={clearAll}
                >
                  看看全部的歌
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((song, i) => (
                <SongCard
                  key={song.id}
                  song={song}
                  number={numberOf.get(song.id) ?? i + 1}
                  labels={labelsOf(song)}
                  activeArtist={artist}
                  onArtistClick={pickArtist}
                  style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="relative border-t border-border/60 bg-card/50">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <p className="flex items-center gap-1.5">
            <Cherry className="h-4 w-4" /> RAN's Little Radio · 只收藏，不播放
          </p>
          <Link to="/auth" className="rounded-full px-2 py-1 transition-colors hover:text-secondary-foreground">
            管理員登入
          </Link>
        </div>
      </footer>

      <RandomPickDialog open={randomOpen} onOpenChange={setRandomOpen} songs={songs} labelsOf={labelsOf} />
    </div>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-blush-deep bg-card/70 px-6 py-14 text-center">
      <Cherry className="h-12 w-12 opacity-80" sway />
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="min-h-dvh bg-blush-wash">
      <div className="mx-auto max-w-5xl px-5 pt-24 sm:px-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-4 w-40 rounded-full bg-secondary" />
          <Skeleton className="h-14 w-72 rounded-2xl bg-secondary" />
          <Skeleton className="h-5 w-52 rounded-full bg-secondary" />
          <Skeleton className="mt-4 h-14 w-56 rounded-full bg-accent" />
        </div>
        <Skeleton className="mt-12 h-12 w-full rounded-full bg-card" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="載入中" role="status">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeError({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-blush-wash px-5">
      <div className="max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-card">
        <Cherry className="mx-auto h-12 w-12" />
        <h1 className="mt-4 font-serif text-xl font-semibold text-foreground">收訊有點不穩</h1>
        <p className="mt-2 text-sm text-muted-foreground">暫時讀不到歌單，請稍後再試一次。</p>
        <Button variant="cherry" className="mt-6" onClick={() => {
            reset();
            router.invalidate();
          }}>
          重新整理
        </Button>
      </div>
    </div>
  );
}