import { describe, expect, it } from "vitest";
import {
  UNCATEGORIZED,
  artistKey,
  artistSegments,
  buildArtistOptions,
  countByCategory,
  countUnlabeled,
  labelFilter,
  songLabels,
  splitArtists,
  diffTags,
  filterSongs,
  nextSortOrder,
  pickRandomSong,
  sortSongsByTitleLength,
  type Category,
  type Song,
} from "@/lib/catalog";
import { categorySchema, songSchema } from "@/lib/validation";

const tags: Category[] = [
  { id: "zh", name: "中文", sort_order: 1, kind: "language" },
  { id: "kr", name: "韓文", sort_order: 2, kind: "language" },
  { id: "sweet", name: "甜歌", sort_order: 1, kind: "genre" },
  { id: "rec", name: "推薦", sort_order: 2, kind: "genre" },
];
const lang = (value: string | null) => labelFilter(tags, "language", value);
const genre = (value: string | null) => labelFilter(tags, "genre", value);

const songs: Song[] = [
  { id: "1", title: "告白氣球", artist: "周杰倫", tag_ids: ["zh", "sweet", "rec"], sort_order: 1 },
  { id: "2", title: "有點甜", artist: "汪蘇瀧 / BY2", tag_ids: [], sort_order: 2 },
  { id: "3", title: "Mr.Chu", artist: "Apink", tag_ids: ["kr", "sweet"], sort_order: 3 },
  { id: "4", title: "初雪", artist: "EXO", tag_ids: [], sort_order: 4 },
  { id: "5", title: "泡泡糖", artist: "NCT", tag_ids: ["kr"], sort_order: 5 },
];

describe("search", () => {
  it("matches song titles", () => {
    expect(filterSongs(songs, { query: "氣球" }).map((s) => s.id)).toEqual(["1"]);
  });

  it("matches artist credits case-insensitively", () => {
    expect(filterSongs(songs, { query: "by2" }).map((s) => s.id)).toEqual(["2"]);
    expect(filterSongs(songs, { query: "apink" }).map((s) => s.id)).toEqual(["3"]);
  });

  it("returns nothing when no title or artist matches", () => {
    expect(filterSongs(songs, { query: "不存在的歌" })).toEqual([]);
  });
});

describe("語言 and 類型 filters", () => {
  it("filter by a 類型 label, including songs that carry several labels", () => {
    expect(filterSongs(songs, { labels: [genre("sweet")] }).map((s) => s.id)).toEqual(["1", "3"]);
    expect(filterSongs(songs, { labels: [genre("rec")] }).map((s) => s.id)).toEqual(["1"]);
  });

  it("filter by a 語言 label", () => {
    expect(filterSongs(songs, { labels: [lang("kr")] }).map((s) => s.id)).toEqual(["3", "5"]);
  });

  it("work independently and combine", () => {
    expect(filterSongs(songs, { labels: [lang("kr"), genre("sweet")] }).map((s) => s.id)).toEqual(["3"]);
    expect(filterSongs(songs, { labels: [lang("zh"), genre(null)] }).map((s) => s.id)).toEqual(["1"]);
  });

  it("未標記 in one group ignores labels from the other group", () => {
    // Song 5 has a 語言 label but no 類型 label.
    expect(filterSongs(songs, { labels: [genre(UNCATEGORIZED)] }).map((s) => s.id)).toEqual(["2", "4", "5"]);
    expect(filterSongs(songs, { labels: [lang(UNCATEGORIZED)] }).map((s) => s.id)).toEqual(["2", "4"]);
  });

  it("show every song when both are 全部", () => {
    expect(filterSongs(songs, { labels: [lang(null), genre(null)] })).toHaveLength(5);
  });

  it("supports multi-select OR within a group and AND across groups", () => {
    expect(filterSongs(songs, { labels: [labelFilter(tags, "language", ["zh", "kr"])] }).map((s) => s.id)).toEqual(["1", "3", "5"]);
    expect(
      filterSongs(songs, {
        labels: [labelFilter(tags, "language", ["zh", "kr"]), labelFilter(tags, "genre", ["sweet", "rec"])],
      }).map((s) => s.id),
    ).toEqual(["1", "3"]);
  });

  it("combines 未標記 with selected labels using OR inside the same group", () => {
    expect(filterSongs(songs, { labels: [labelFilter(tags, "genre", [UNCATEGORIZED, "sweet"])] }).map((s) => s.id))
      .toEqual(["1", "2", "3", "4", "5"]);
  });


  it("split a song's labels into 語言 and 類型 for display", () => {
    expect(songLabels(songs[0]!, tags)).toEqual({ language: ["中文"], genre: ["甜歌", "推薦"] });
    expect(songLabels(songs[1]!, tags)).toEqual({ language: [], genre: [] });
  });

  it("counts a multi-label song once under each label", () => {
    const counts = countByCategory(songs);
    expect(counts.get("sweet")).toBe(2);
    expect(counts.get("kr")).toBe(2);
    expect(countUnlabeled(songs, ["sweet", "rec"])).toBe(3);
  });

  it("works out which labels to add and remove", () => {
    expect(diffTags(["zh", "sweet"], ["sweet", "rec"])).toEqual({ add: ["rec"], remove: ["zh"] });
  });
});

describe("song title display order", () => {
  it("sorts shortest to longest, ignores spaces in English-only titles, and keeps ties stable", () => {
    const input = [
      { title: "Without you" },
      { title: "A B C" },
      { title: "我愛你" },
      { title: "甜" },
      { title: "ABC" },
      { title: "再見" },
    ];
    expect(sortSongsByTitleLength(input).map((song) => song.title)).toEqual([
      "甜",
      "再見",
      "我愛你",
      "A B C",
      "ABC",
      "Without you",
    ]);
  });
});

describe("random pick", () => {
  it("can pick the first and the last song of the full catalog", () => {
    expect(pickRandomSong(songs, () => 0)?.id).toBe("1");
    expect(pickRandomSong(songs, () => 0.9999)?.id).toBe("5");
  });

  it("allows the same song to be picked twice in a row", () => {
    const rng = () => 0.3;
    expect(pickRandomSong(songs, rng)?.id).toBe(pickRandomSong(songs, rng)?.id);
  });

  it("returns null for an empty catalog", () => {
    expect(pickRandomSong([], () => 0.5)).toBeNull();
  });
});

describe("new songs", () => {
  it("are added after the last song in the catalog", () => {
    expect(nextSortOrder(songs)).toBe(6);
    expect(nextSortOrder([])).toBe(1);
  });
});

describe("admin form validation", () => {
  const id = "00000000-0000-4000-8000-000000000001";

  it("requires a title and an artist", () => {
    expect(songSchema.safeParse({ title: " ", artist: "EXO", tag_ids: [] }).success).toBe(false);
    expect(songSchema.safeParse({ title: "初雪", artist: "", tag_ids: [] }).success).toBe(false);
  });

  it("allows a song with no labels or with several labels", () => {
    expect(songSchema.safeParse({ title: "初雪", artist: "EXO", tag_ids: [] }).success).toBe(true);
    expect(songSchema.safeParse({ title: "初雪", artist: "EXO", tag_ids: [id, id.replace("1", "2")] }).success).toBe(true);
  });

  it("keeps the artist credit exactly as typed apart from outer spaces", () => {
    const parsed = songSchema.parse({ title: " 有點甜 ", artist: "汪蘇瀧 / BY2", tag_ids: [] });
    expect(parsed.title).toBe("有點甜");
    expect(parsed.artist).toBe("汪蘇瀧 / BY2");
  });

  it("limits label names to 20 characters", () => {
    expect(categorySchema.safeParse("甜歌").success).toBe(true);
    expect(categorySchema.safeParse("字".repeat(21)).success).toBe(false);
  });
});

describe("artist filter", () => {
  it("splits joint credits into separate artists without changing the spelling", () => {
    expect(splitArtists("汪蘇瀧 / BY2")).toEqual(["汪蘇瀧", "BY2"]);
    expect(splitArtists("MP魔幻力量/阿信")).toEqual(["MP魔幻力量", "阿信"]);
    expect(splitArtists("Bii 畢書盡")).toEqual(["Bii 畢書盡"]);
  });

  it("keeps the full credit text when rendering it", () => {
    expect(artistSegments("汪蘇瀧 / BY2").map((s) => s.text).join("")).toBe("汪蘇瀧 / BY2");
  });

  it("finds a song by any of its credited artists", () => {
    expect(filterSongs(songs, { artist: artistKey("BY2") }).map((s) => s.id)).toEqual(["2"]);
    expect(filterSongs(songs, { artist: artistKey("汪蘇瀧") }).map((s) => s.id)).toEqual(["2"]);
  });

  it("groups BY2 and By2 under one artist option and counts joint songs", () => {
    const options = buildArtistOptions([
      { artist: "BY2" },
      { artist: "By2" },
      { artist: "汪蘇瀧 / BY2" },
      { artist: "EXO" },
    ]);
    expect(options[0]).toEqual({ key: "by2", name: "BY2", count: 3 });
    expect(options.map((o) => o.name)).toEqual(["BY2", "汪蘇瀧", "EXO"]);
  });

  it("combines the artist filter with the label filters", () => {
    expect(filterSongs(songs, { artist: artistKey("Apink"), labels: [genre("sweet")] }).map((s) => s.id)).toEqual(["3"]);
    expect(filterSongs(songs, { artist: artistKey("Apink"), labels: [lang("zh")] })).toEqual([]);
  });

  it("lists NCT only as an artist, never as a 語言 or 類型 label", () => {
    expect(buildArtistOptions(songs).map((o) => o.name)).toContain("NCT");
    const labels = songLabels(songs[4]!, tags);
    expect([...labels.language, ...labels.genre]).not.toContain("NCT");
    expect(filterSongs(songs, { artist: artistKey("NCT") }).map((s) => s.id)).toEqual(["5"]);
    expect(filterSongs(songs, { query: "nct" }).map((s) => s.id)).toEqual(["5"]);
  });
});