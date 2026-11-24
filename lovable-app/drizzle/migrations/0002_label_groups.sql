ALTER TABLE public.categories ADD COLUMN kind text NOT NULL DEFAULT 'genre';
ALTER TABLE public.categories ADD CONSTRAINT categories_kind_check CHECK (kind IN ('language', 'genre'));
UPDATE public.categories SET kind = 'language' WHERE name IN ('中文', '韓文', '台語');
CREATE INDEX categories_kind_idx ON public.categories (kind, sort_order);