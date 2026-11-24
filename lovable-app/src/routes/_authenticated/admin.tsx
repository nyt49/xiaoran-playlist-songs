import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ExternalLink, Github, Loader2, LogOut, Pencil, Plus, Search, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Cherry } from "@/components/radio/Cherry";
import { SongFormDialog } from "@/components/admin/SongFormDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { catalogQueryOptions } from "@/lib/catalog.functions";
import {
  setGitHubAdminToken,
  verifyGitHubToken,
  createSong,
  deleteSong,
  setSongTags,
  updateSong,
  type SongInput,
} from "@/lib/admin-api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TagToggles } from "@/components/admin/TagToggles";
import {
  countByCategory,
  filterSongs,
  nextSortOrder,
  type CategoryFilter,
  tagNames,
  LABEL_KINDS,
  labelsOfKind,
  type Song,
} from "@/lib/catalog";

const SESSION_KEY = "ran_radio_github_admin_token";
const ALL = "__all";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "歌單後台 · RAN's Little Radio" },
      { name: "description", content: "小橪的歌單管理後台：新增、編輯、刪除歌曲與管理標籤。" },
      { property: "og:title", content: "歌單後台 · RAN's Little Radio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      setChecking(false);
      return;
    }
    setGitHubAdminToken(stored);
    setToken(stored);
    verifyGitHubToken(stored)
      .then(({ login }) => {
        setOwner(login);
        setConnected(true);
      })
      .catch((e) => {
        window.sessionStorage.removeItem(SESSION_KEY);
        setGitHubAdminToken(null);
        setError(e instanceof Error ? e.message : "GitHub 連線失敗，請重新登入。");
      })
      .finally(() => setChecking(false));
  }, []);

  async function connect(e: FormEvent) {
    e.preventDefault();
    const value = token.trim();
    if (!value) {
      setError("請貼上 GitHub Fine-grained Token。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { login } = await verifyGitHubToken(value);
      window.sessionStorage.setItem(SESSION_KEY, value);
      setGitHubAdminToken(value);
      setOwner(login);
      setConnected(true);
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success("GitHub 已連線，歡迎回來 🍒");
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法連線 GitHub，請檢查 Token 權限。");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    window.sessionStorage.removeItem(SESSION_KEY);
    setGitHubAdminToken(null);
    setToken("");
    setOwner("");
    setConnected(false);
    queryClient.clear();
  }

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-blush-wash px-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> 正在確認 GitHub 連線…</div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex min-h-dvh flex-col bg-blush-wash">
        <div className="mx-auto w-full max-w-md px-5 pt-6">
          <Button asChild variant="ghost" size="sm"><Link to="/">回到歌單</Link></Button>
        </div>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
          <div className="rounded-3xl border border-border/70 bg-card p-7 shadow-lift sm:p-9">
            <div className="text-center">
              <Cherry className="mx-auto h-12 w-12" sway />
              <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">小橪的管理後台</h1>
              <p className="mt-2 text-sm text-muted-foreground">連接 GitHub，就能管理歌曲和標籤 🍒</p>
            </div>
            <form onSubmit={connect} className="mt-7 grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="github-token" className="text-sm font-medium text-foreground">GitHub Fine-grained Token</label>
                <Input
                  id="github-token"
                  type="password"
                  autoComplete="off"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="貼上 ghp_… 或 github_pat_…"
                  aria-label="GitHub Token"
                />
              </div>
              {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" variant="cherry" size="lg" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Github />}
                驗證並進入後台
              </Button>
            </form>
            <div className="mt-5 rounded-2xl bg-secondary/80 p-4 text-sm leading-relaxed text-secondary-foreground">
              <p className="font-medium">只需要設定一次 Token</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
                <li>到 GitHub 建立 Fine-grained Token。</li>
                <li>Repository access 選 Only select repositories，再選 <strong>xiaoran-playlist-songs</strong>。</li>
                <li>Repository permissions 將 <strong>Contents</strong> 設為 <strong>Read and write</strong>。</li>
                <li>建立後把 Token 貼在上方。Token 只存在目前分頁，不會寫進歌單或 GitHub 檔案。</li>
              </ol>
              <a
                href="https://github.com/settings/personal-access-tokens/new"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4"
              >
                前往 GitHub 建立 Token <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">建議設定到期日，並只授權這一個歌單 repo。</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-blush-wash">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Cherry className="h-7 w-7 shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-lg leading-none font-semibold italic text-foreground">RAN's Radio</p>
              <p className="truncate text-[11px] text-muted-foreground">GitHub · @{owner}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm"><Link to="/"><ExternalLink /> <span className="hidden sm:inline">查看前台</span></Link></Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut /> <span className="hidden sm:inline">登出</span></Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 pb-20 sm:px-8">
        <Dashboard />
      </main>
    </div>
  );
}

function Notice({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-border/70 bg-card p-8 text-center shadow-card">
      <div className="flex justify-center">{icon ?? <Cherry className="h-10 w-10" />}</div>
      <h1 className="mt-4 font-serif text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();
  const catalog = useQuery(catalogQueryOptions());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>(ALL);
  const [editing, setEditing] = useState<Song | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Song | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const songs = useMemo(() => catalog.data?.songs ?? [], [catalog.data]);
  const categories = useMemo(() => catalog.data?.categories ?? [], [catalog.data]);
  const counts = useMemo(() => countByCategory(songs), [songs]);
  const numberOf = useMemo(() => new Map(songs.map((s, i) => [s.id, i + 1])), [songs]);
  const categoryFilter: CategoryFilter = filter === ALL ? null : filter;
  const visible = useMemo(
    () => filterSongs(songs, {
      query,
      labels: [{ value: categoryFilter, groupIds: categories.map((c) => c.id) }],
    }),
    [songs, categories, query, categoryFilter],
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["catalog"] });

  async function guarded(fn: () => Promise<void>, success: string) {
    try {
      await fn();
      await refresh();
      toast.success(success);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失敗，請再試一次");
      throw e;
    }
  }

  async function saveSong(input: SongInput) {
    if (editing) {
      await guarded(() => updateSong(editing.id, editing.tag_ids, input), `已更新「${input.title}」`);
    } else {
      await guarded(() => createSong({ ...input, sort_order: nextSortOrder(songs) }), `已新增「${input.title}」🍒`);
    }
  }

  async function quickAssign(song: Song, next: string[]) {
    setSavingId(song.id);
    try {
      await guarded(() => setSongTags(song.id, song.tag_ids, next), "標籤已更新");
    } catch {
      /* toast shown */
    } finally {
      setSavingId(null);
    }
  }

  if (catalog.isPending) {
    return <div className="grid gap-3" role="status" aria-label="載入中">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl bg-card" />)}</div>;
  }
  if (catalog.isError) {
    return <Notice title="讀不到 GitHub 歌單" body="請確認網路正常，或重新整理頁面再試一次。" action={<Button variant="soft" onClick={() => catalog.refetch()}>重試</Button>} />;
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-airy text-primary">STUDIO</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground sm:text-3xl">歌單後台</h1>
          <p className="mt-1 text-sm text-muted-foreground">共 {songs.length} 首歌 · {categories.length} 個標籤</p>
          <p className="mt-1 text-xs text-muted-foreground">按下儲存後會直接更新 GitHub 歌單資料。</p>
        </div>
      </div>

      <Tabs defaultValue="songs">
        <TabsList className="h-11 rounded-full bg-secondary p-1">
          <TabsTrigger value="songs" className="rounded-full px-5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-soft">歌曲</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-full px-5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-soft">標籤</TabsTrigger>
        </TabsList>

        <TabsContent value="songs" className="mt-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋歌名或歌手…" aria-label="搜尋歌名或歌手" className="rounded-full pl-11" />
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-11 rounded-full sm:w-44" aria-label="依標籤篩選"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>全部歌曲（{songs.length}）</SelectItem>
                  {LABEL_KINDS.map(({ kind, title }) => (
                    <SelectGroup key={kind}>
                      <SelectLabel className="text-xs text-muted-foreground">{title}</SelectLabel>
                      {labelsOfKind(categories, kind).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}（{counts.get(c.id) ?? 0}）</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="cherry" className="h-11 shrink-0" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus /> 新增歌曲</Button>
            </div>
          </div>

          <p className="mt-4 mb-2 text-xs text-muted-foreground" aria-live="polite">顯示 {visible.length} / {songs.length} 首</p>
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-blush-deep bg-card/70 p-10 text-center text-sm text-muted-foreground">{songs.length === 0 ? "還沒有歌曲，按「新增歌曲」開始收藏吧 🍒" : "沒有符合條件的歌曲。"}</p>
          ) : (
            <ul className="grid gap-2">
              {visible.map((song) => (
                <li key={song.id} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-soft sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="w-8 shrink-0 text-right font-display text-sm text-muted-foreground lining-nums tabular-nums">{String(numberOf.get(song.id) ?? 0).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="truncate font-serif font-semibold text-foreground">{song.title}</p>
                      <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pl-11 sm:pl-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 max-w-[220px] justify-start" disabled={savingId === song.id} aria-label={`設定「${song.title}」的標籤`}>
                          {savingId === song.id ? <Loader2 className="animate-spin" /> : <Tags />}
                          <span className="truncate">{tagNames(song, categories).join("、")}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72 rounded-2xl bg-card p-4 shadow-lift">
                        <p className="mb-3 text-xs font-medium text-muted-foreground">「{song.title}」的標籤（可複選）</p>
                        <div className="grid gap-3">
                          {LABEL_KINDS.map(({ kind, title }) => (
                            <div key={kind}>
                              <p className="mb-1.5 text-[11px] font-medium tracking-airy text-muted-foreground">{title}</p>
                              <TagToggles categories={labelsOfKind(categories, kind)} value={song.tag_ids} onChange={(next) => quickAssign(song, next)} disabled={savingId === song.id} label={`「${song.title}」的${title}標籤`} tone={kind === "language" ? "butter" : "cherry"} />
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button size="icon-sm" variant="ghost" aria-label={`編輯「${song.title}」`} onClick={() => { setEditing(song); setFormOpen(true); }}><Pencil /></Button>
                    <Button size="icon-sm" variant="ghost" aria-label={`刪除「${song.title}」`} className="hover:bg-destructive/10 hover:text-destructive" onClick={() => setToDelete(song)}><Trash2 /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-5">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-6">
            {LABEL_KINDS.map(({ kind, title }) => (
              <CategoryManager key={kind} kind={kind} title={title} categories={labelsOfKind(categories, kind)} counts={counts} onChanged={refresh} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <SongFormDialog open={formOpen} onOpenChange={setFormOpen} song={editing} categories={categories} onSubmit={saveSong} />
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="確定要刪除這首歌嗎？"
        description={<p>「{toDelete?.title}」— {toDelete?.artist} 將從歌單中移除，所有訪客都會看不到。此動作無法復原。</p>}
        onConfirm={async () => {
          if (!toDelete) return;
          const title = toDelete.title;
          await guarded(() => deleteSong(toDelete.id), `已刪除「${title}」`);
        }}
      />
    </>
  );
}
