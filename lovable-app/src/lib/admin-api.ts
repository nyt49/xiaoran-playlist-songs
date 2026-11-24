// GitHub-backed admin operations. The browser token is held in memory only;
 // the UI stores it in sessionStorage so it is cleared when the tab session ends.
import type { Catalog, LabelKind, Song } from "@/lib/catalog";

const OWNER = "nyt49";
const REPO = "xiaoran-playlist-songs";
const BRANCH = "preview-browser-fix";
const CATALOG_PATH = "lovable-app/public/catalog.json";
const API_ROOT = "https://api.github.com";
let adminToken: string | null = null;

export type SongInput = { title: string; artist: string; tag_ids: string[] };

type GithubFile = { sha: string; content: string; encoding: string };
type GithubUser = { login: string };
type GithubRepo = { permissions?: { push?: boolean } };

export function setGitHubAdminToken(token: string | null) {
  adminToken = token;
}

function headers(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function api<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...headers(token), ...(init?.headers ?? {}) } });
  const payload = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) {
    if (response.status === 401) throw new Error("GitHub Token 無效或已過期，請重新登入。");
    if (response.status === 403) throw new Error("Token 權限不足，請確認已授予此 repo 的 Contents「讀取與寫入」權限。");
    if (response.status === 409 || response.status === 422) throw new Error("GitHub 資料更新衝突，請重新整理後再儲存。");
    throw new Error(payload.message ?? `GitHub 回應錯誤（${response.status}）`);
  }
  return payload as T;
}

function decodeBase64Utf8(value: string): string {
  const binary = atob(value.replace(/\\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const contentUrl = `${API_ROOT}/repos/${OWNER}/${REPO}/contents/${CATALOG_PATH}`;

async function readCatalog(token: string): Promise<{ catalog: Catalog; sha: string }> {
  const file = await api<GithubFile>(`${contentUrl}?ref=${BRANCH}`, token);
  if (file.encoding !== "base64" || !file.content) throw new Error("讀不到 GitHub 歌單資料檔。");
  return { catalog: JSON.parse(decodeBase64Utf8(file.content)) as Catalog, sha: file.sha };
}

async function saveCatalog(token: string, catalog: Catalog, sha: string, message: string) {
  const body = {
    message,
    content: encodeBase64Utf8(JSON.stringify(catalog, null, 2) + "\n"),
    sha,
    branch: BRANCH,
  };
  await api(contentUrl, token, { method: "PUT", body: JSON.stringify(body) });
}

async function mutateCatalog(message: string, mutate: (catalog: Catalog) => void) {
  if (!adminToken) throw new Error("請先使用 GitHub Token 登入後台。");
  const { catalog, sha } = await readCatalog(adminToken);
  mutate(catalog);
  await saveCatalog(adminToken, catalog, sha, message);
}

export async function verifyGitHubToken(token: string): Promise<{ login: string }> {
  const [user, repo] = await Promise.all([
    api<GithubUser>(`${API_ROOT}/user`, token),
    api<GithubRepo>(`${API_ROOT}/repos/${OWNER}/${REPO}`, token),
  ]);
  if (repo.permissions?.push !== true) {
    throw new Error("這組 Token 沒有此歌單 repo 的寫入權限。請建立 Fine-grained Token，並將 Contents 設為 Read and write。");
  }
  await readCatalog(token);
  return { login: user.login };
}

export async function setSongTags(songId: string, _current: string[], next: string[]) {
  await mutateCatalog("Update song labels", (catalog) => {
    const song = catalog.songs.find((item) => item.id === songId);
    if (!song) throw new Error("找不到這首歌曲，請重新整理。");
    song.tag_ids = [...new Set(next)];
  });
}

export async function createSong(input: SongInput & { sort_order: number }) {
  await mutateCatalog(`Add song: ${input.title}`, (catalog) => {
    const song: Song = { ...input, id: crypto.randomUUID(), tag_ids: [...new Set(input.tag_ids)] };
    catalog.songs.push(song);
  });
}

export async function updateSong(id: string, _currentTags: string[], input: SongInput) {
  await mutateCatalog(`Update song: ${input.title}`, (catalog) => {
    const song = catalog.songs.find((item) => item.id === id);
    if (!song) throw new Error("找不到這首歌曲，請重新整理。");
    song.title = input.title;
    song.artist = input.artist;
    song.tag_ids = [...new Set(input.tag_ids)];
  });
}

export async function deleteSong(id: string) {
  await mutateCatalog("Delete song", (catalog) => {
    const index = catalog.songs.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("找不到這首歌曲，請重新整理。");
    catalog.songs.splice(index, 1);
  });
}

export async function createCategory(name: string, sort_order: number, kind: LabelKind) {
  await mutateCatalog(`Add ${kind} label: ${name}`, (catalog) => {
    if (catalog.categories.some((item) => item.kind === kind && item.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("這個標籤已經存在了。");
    }
    catalog.categories.push({ id: crypto.randomUUID(), name, sort_order, kind });
  });
}

export async function renameCategory(id: string, name: string) {
  await mutateCatalog(`Rename label: ${name}`, (catalog) => {
    const category = catalog.categories.find((item) => item.id === id);
    if (!category) throw new Error("找不到這個標籤，請重新整理。");
    if (catalog.categories.some((item) => item.id !== id && item.kind === category.kind && item.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("這個標籤名稱已經存在了。");
    }
    category.name = name;
  });
}

export async function moveCategory(a: { id: string; sort_order: number }, b: { id: string; sort_order: number }) {
  await mutateCatalog("Reorder labels", (catalog) => {
    const first = catalog.categories.find((item) => item.id === a.id);
    const second = catalog.categories.find((item) => item.id === b.id);
    if (!first || !second) throw new Error("找不到標籤，請重新整理。");
    [first.sort_order, second.sort_order] = [b.sort_order, a.sort_order];
  });
}

export async function deleteCategory(id: string) {
  await mutateCatalog("Delete label", (catalog) => {
    if (!catalog.categories.some((item) => item.id === id)) throw new Error("找不到這個標籤，請重新整理。");
    catalog.categories = catalog.categories.filter((item) => item.id !== id);
    for (const song of catalog.songs) song.tag_ids = song.tag_ids.filter((tagId) => tagId !== id);
  });
}
