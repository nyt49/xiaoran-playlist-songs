CREATE TABLE public.song_categories (
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (song_id, category_id)
);
CREATE INDEX song_categories_category_idx ON public.song_categories (category_id);

GRANT SELECT ON public.song_categories TO anon;
GRANT SELECT, INSERT, DELETE ON public.song_categories TO authenticated;
GRANT ALL ON public.song_categories TO service_role;
ALTER TABLE public.song_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view song labels"
ON public.song_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can add song labels"
ON public.song_categories FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can remove song labels"
ON public.song_categories FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON COLUMN public.songs.category_id IS 'DEPRECATED: replaced by public.song_categories (multi-label)';