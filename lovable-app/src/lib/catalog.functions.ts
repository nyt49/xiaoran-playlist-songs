import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Catalog } from "@/lib/catalog";

// Public, read-only catalog. RLS allows anonymous SELECT only; all writes require the admin role.
export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<Catalog> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Catalog service is not configured");

  const client = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const [songsRes, catsRes] = await Promise.all([
    client
      .from("songs")
      .select("id, title, artist, sort_order, song_categories(category_id)")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .range(0, 4999),
    client
      .from("categories")
      .select("id, name, sort_order, kind")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (songsRes.error) throw new Error(songsRes.error.message);
  if (catsRes.error) throw new Error(catsRes.error.message);

  const songs = (songsRes.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    sort_order: row.sort_order,
    tag_ids: (row.song_categories ?? []).map((link) => link.category_id),
  }));

  const categories = (catsRes.data ?? []).map((c) => ({
    ...c,
    kind: c.kind === "language" ? ("language" as const) : ("genre" as const),
  }));

  return { songs, categories };
});

export const catalogQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog"],
    queryFn: () => getCatalog(),
    staleTime: 30_000,
  });