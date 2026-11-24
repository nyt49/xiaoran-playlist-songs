// Admin write operations. They run with the signed-in user's session; the database's
// row-level security rejects them unless that user holds the admin role.
import { supabase } from "@/integrations/supabase/client";
import { diffTags, type LabelKind } from "@/lib/catalog";

export class PermissionError extends Error {
  constructor() {
    super("沒有管理權限，或資料已不存在。");
  }
}

function friendly(error: { code?: string; message: string }): Error {
  if (error.code === "23505") return new Error("這個標籤已經存在了");
  if (error.code === "42501" || /row-level security/i.test(error.message)) return new PermissionError();
  if (error.code === "23514") return new Error("內容長度不符合規定");
  return new Error(error.message);
}

export type SongInput = { title: string; artist: string; tag_ids: string[] };

export async function setSongTags(songId: string, current: string[], next: string[]) {
  const { add, remove } = diffTags(current, next);
  if (remove.length) {
    const { data, error } = await supabase
      .from("song_categories")
      .delete()
      .eq("song_id", songId)
      .in("category_id", remove)
      .select("song_id");
    if (error) throw friendly(error);
    if (!data?.length) throw new PermissionError();
  }
  if (add.length) {
    const { error } = await supabase
      .from("song_categories")
      .insert(add.map((category_id) => ({ song_id: songId, category_id })));
    if (error) throw friendly(error);
  }
}

export async function createSong(input: SongInput & { sort_order: number }) {
  const { tag_ids, ...song } = input;
  const { data, error } = await supabase.from("songs").insert(song).select("id");
  if (error) throw friendly(error);
  const id = data?.[0]?.id;
  if (!id) throw new PermissionError();
  await setSongTags(id, [], tag_ids);
}

export async function updateSong(id: string, currentTags: string[], input: SongInput) {
  const { tag_ids, ...song } = input;
  const { data, error } = await supabase.from("songs").update(song).eq("id", id).select("id");
  if (error) throw friendly(error);
  if (!data?.length) throw new PermissionError();
  await setSongTags(id, currentTags, tag_ids);
}

export async function deleteSong(id: string) {
  const { data, error } = await supabase.from("songs").delete().eq("id", id).select("id");
  if (error) throw friendly(error);
  if (!data?.length) throw new PermissionError();
}

export async function createCategory(name: string, sort_order: number, kind: LabelKind) {
  const { data, error } = await supabase.from("categories").insert({ name, sort_order, kind }).select("id");
  if (error) throw friendly(error);
  if (!data?.length) throw new PermissionError();
}

export async function renameCategory(id: string, name: string) {
  const { data, error } = await supabase.from("categories").update({ name }).eq("id", id).select("id");
  if (error) throw friendly(error);
  if (!data?.length) throw new PermissionError();
}

export async function moveCategory(a: { id: string; sort_order: number }, b: { id: string; sort_order: number }) {
  const first = await supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id).select("id");
  if (first.error) throw friendly(first.error);
  const second = await supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id).select("id");
  if (second.error) throw friendly(second.error);
  if (!first.data?.length || !second.data?.length) throw new PermissionError();
}

export async function deleteCategory(id: string) {
  const { data, error } = await supabase.from("categories").delete().eq("id", id).select("id");
  if (error) throw friendly(error);
  if (!data?.length) throw new PermissionError();
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  return data === true;
}