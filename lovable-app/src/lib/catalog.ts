// Pure catalog helpers shared by the public site and the admin dashboard.
// "Categories" are labels (標籤) in two independent groups — 語言 (language) and
// 類型 (genre). A song can carry any number of labels from either group.

export type LabelKind = "language" | "genre";

export const LABEL_KINDS: { kind: LabelKind; title: string }[] = [
  { kind: "language", title: "語言" },
  { kind: "genre", title: "類型" },
];

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  kind: LabelKind;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  tag_ids: string[];
  sort_order: number;
};

export type Catalog = {
  songs: Song[];
  categories: Category[];
};

/** Filter value meaning "songs with no label yet". */
export const UNCATEGORIZED = "__uncategorized";

/** null = all songs, UNCATEGORIZED = no label, otherwise a label id. */
export type CategoryFilter = string | null;

export function normalizeText(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

export function matchesQuery(song: Pick<Song, "title" | "artist">, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  const compactQ = q.replace(/\s/g, "");
  const haystacks = [normalizeText(song.title), normalizeText(song.artist)];
  return haystacks.some((h) => h.includes(q) || h.replace(/\s/g, "").includes(compactQ));
}

// ---- Artists (歌手標籤): derived from the artist credit, independent of song labels ----

/** Separators between artists in a joint credit, e.g. "汪蘇瀧 / BY2", "MP魔幻力量/阿信". */
const ARTIST_SEPARATOR = /\s*(?:\/|／|、|&|＆|,|，)\s*/;
const ARTIST_SEPARATOR_CAPTURE = /(\s*(?:\/|／|、|&|＆|,|，)\s*)/;

/** Individual artists in a credit, exactly as written. */
export function splitArtists(credit: string): string[] {
  return credit
    .split(ARTIST_SEPARATOR)
    .map((a) => a.trim())
    .filter(Boolean);
}

/** Case/width-insensitive key so "BY2" and "By2" filter together; display text is never changed. */
export function artistKey(name: string): string {
  return normalizeText(name);
}

/** The credit split into artist parts and the original separators, for rendering it unchanged. */
export function artistSegments(credit: string): { text: string; key: string | null }[] {
  return credit
    .split(ARTIST_SEPARATOR_CAPTURE)
    .filter((part) => part !== "")
    .map((part) =>
      ARTIST_SEPARATOR.test(part) && splitArtists(part).length === 0
        ? { text: part, key: null }
        : { text: part, key: artistKey(part) },
    );
}

export type ArtistOption = { key: string; name: string; count: number };

/** Artist filter options built from every song's credit, most songs first. */
export function buildArtistOptions(songs: Pick<Song, "artist">[]): ArtistOption[] {
  const map = new Map<string, { names: Map<string, number>; count: number; first: number }>();
  songs.forEach((song, index) => {
    for (const name of new Set(splitArtists(song.artist))) {
      const key = artistKey(name);
      const entry = map.get(key) ?? { names: new Map(), count: 0, first: index };
      entry.count += 1;
      entry.names.set(name, (entry.names.get(name) ?? 0) + 1);
      map.set(key, entry);
    }
  });
  return [...map.entries()]
    .map(([key, e]) => {
      // Show the spelling used most often (earliest wins a tie).
      const name = [...e.names.entries()].reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
      return { key, name, count: e.count, first: e.first };
    })
    .sort((a, b) => b.count - a.count || a.first - b.first)
    .map(({ key, name, count }) => ({ key, name, count }));
}

export function songHasArtist(song: Pick<Song, "artist">, key: string): boolean {
  return splitArtists(song.artist).some((a) => artistKey(a) === key);
}

/** One label filter: `value` is null (any), UNCATEGORIZED (none from `groupIds`) or a label id. */
export type LabelFilter = { value: CategoryFilter | CategoryFilter[]; groupIds: string[] };

export function labelsOfKind(categories: Category[], kind: LabelKind): Category[] {
  return categories.filter((c) => c.kind === kind).sort((a, b) => a.sort_order - b.sort_order);
}

export function labelFilter(
  categories: Category[],
  kind: LabelKind,
  value: CategoryFilter | CategoryFilter[],
): LabelFilter {
  return { value, groupIds: labelsOfKind(categories, kind).map((c) => c.id) };
}

function passesLabelFilter(song: Pick<Song, "tag_ids">, f: LabelFilter): boolean {
  // A list is a multi-select within one group: selected values use OR semantics.
  if (Array.isArray(f.value)) {
    if (f.value.length === 0) return true;
    return f.value.some((value) => {
      if (value === null) return true;
      if (value === UNCATEGORIZED) return !song.tag_ids.some((id) => f.groupIds.includes(id));
      return song.tag_ids.includes(value);
    });
  }
  if (f.value === null) return true;
  if (f.value === UNCATEGORIZED) return !song.tag_ids.some((id) => f.groupIds.includes(id));
  return song.tag_ids.includes(f.value);
}

/** Search, artist and each label group filter independently; a song must pass all of them. */
export function filterSongs(
  songs: Song[],
  {
    query = "",
    artist = null,
    labels = [],
  }: { query?: string; artist?: string | null; labels?: LabelFilter[] },
): Song[] {
  return songs.filter((song) => {
    if (artist && !songHasArtist(song, artist)) return false;
    if (!labels.every((f) => passesLabelFilter(song, f))) return false;
    return matchesQuery(song, query);
  });
}

/** Songs with no label from the given group. */
export function countUnlabeled(songs: Pick<Song, "tag_ids">[], groupIds: string[]): number {
  return songs.filter((s) => !s.tag_ids.some((id) => groupIds.includes(id))).length;
}

/** Picks one song uniformly from the list. Repeats across picks are allowed. */
export function pickRandomSong<T>(songs: readonly T[], rng: () => number = Math.random): T | null {
  if (songs.length === 0) return null;
  const index = Math.min(songs.length - 1, Math.floor(rng() * songs.length));
  return songs[index] ?? null;
}

/** Songs per label; a multi-label song counts once under each of its labels. */
export function countByCategory(songs: Song[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const s of songs) {
    if (s.tag_ids.length === 0) {
      counts.set(UNCATEGORIZED, (counts.get(UNCATEGORIZED) ?? 0) + 1);
    }
    for (const id of new Set(s.tag_ids)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Label names for a song, in the labels' display order. */
export function tagNames(song: Pick<Song, "tag_ids">, categories: Category[]): string[] {
  return categories.filter((c) => song.tag_ids.includes(c.id)).map((c) => c.name);
}

export type SongLabels = { language: string[]; genre: string[] };

/** A song's labels split by group, for showing 語言 and 類型 separately. */
export function songLabels(song: Pick<Song, "tag_ids">, categories: Category[]): SongLabels {
  return {
    language: tagNames(song, labelsOfKind(categories, "language")),
    genre: tagNames(song, labelsOfKind(categories, "genre")),
  };
}

/** Count title characters for display sorting; English-only titles ignore whitespace. */
export function titleCharacterCount(title: string): number {
  const normalized = /^[\x00-\x7F\s]*$/.test(title) ? title.replace(/\s+/g, "") : title;
  return Array.from(normalized).length;
}

/** Stable frontend sort by title length; the original song records are never changed. */
export function sortSongsByTitleLength<T extends Pick<Song, "title">>(items: readonly T[]): T[] {
  return items
    .map((song, index) => ({ song, index }))
    .sort((a, b) => titleCharacterCount(a.song.title) - titleCharacterCount(b.song.title) || a.index - b.index)
    .map(({ song }) => song);
}

export function nextSortOrder(songs: Pick<Song, "sort_order">[]): number {
  return songs.reduce((max, s) => Math.max(max, s.sort_order), 0) + 1;
}

/** Which label links to add and remove to go from `current` to `next`. */
export function diffTags(current: string[], next: string[]): { add: string[]; remove: string[] } {
  const cur = new Set(current);
  const nxt = new Set(next);
  return {
    add: [...nxt].filter((id) => !cur.has(id)),
    remove: [...cur].filter((id) => !nxt.has(id)),
  };
}