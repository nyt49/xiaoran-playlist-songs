-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Owner allowlist (emails approved to become admin)
CREATE TABLE public.admin_allowlist (
  email text PRIMARY KEY CHECK (email = lower(email) AND position('@' in email) > 1),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_allowlist TO authenticated;
GRANT ALL ON public.admin_allowlist TO service_role;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read the allowlist"
ON public.admin_allowlist FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Grant admin when a confirmed user's email is on the allowlist
CREATE OR REPLACE FUNCTION public.grant_admin_if_allowlisted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL
     AND NEW.email_confirmed_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.admin_allowlist a WHERE a.email = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block sign-up or sign-in because of role assignment
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_grant_admin
AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_if_allowlisted();

-- When an email is added to the allowlist later, grant existing confirmed accounts
CREATE OR REPLACE FUNCTION public.grant_admin_on_allowlist_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id, 'admin'::public.app_role
  FROM auth.users u
  WHERE lower(u.email) = NEW.email AND u.email_confirmed_at IS NOT NULL
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_allowlist_insert_grant_admin
AFTER INSERT ON public.admin_allowlist
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_on_allowlist_insert();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (char_length(btrim(name)) BETWEEN 1 AND 20),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can add categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Songs
CREATE TABLE public.songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  artist text NOT NULL CHECK (char_length(btrim(artist)) BETWEEN 1 AND 120),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX songs_category_idx ON public.songs (category_id);
CREATE INDEX songs_sort_idx ON public.songs (sort_order);
GRANT SELECT ON public.songs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.songs TO authenticated;
GRANT ALL ON public.songs TO service_role;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view songs"
ON public.songs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can add songs"
ON public.songs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update songs"
ON public.songs FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete songs"
ON public.songs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER songs_set_updated_at
BEFORE UPDATE ON public.songs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed starter categories
INSERT INTO public.categories (name, sort_order) VALUES
  ('華語流行', 1),
  ('韓語流行', 2),
  ('團體/偶像', 3),
  ('動畫/影視', 4),
  ('其他', 5);

-- Seed the 64 songs exactly as supplied (uncategorized)
INSERT INTO public.songs (sort_order, title, artist) VALUES
  (1, '愛ㄚ愛ㄚ', 'BY2'),
  (2, '致愛', '鹿晗'),
  (3, '我們的明天', '鹿晗'),
  (4, '淋雨一直走', '張韶涵'),
  (5, '愛情闖進門', 'BY2'),
  (6, 'Mr.Chu', 'Apink'),
  (7, '離開的一路上', '理想混蛋'),
  (8, '告白氣球', '周杰倫'),
  (9, '有點甜', '汪蘇瀧 / BY2'),
  (10, '七彩的微風', '真珠美人魚'),
  (11, '天空海', '威神V'),
  (12, '愛不釋手', '威神V'),
  (13, '這時煙火', '威神V'),
  (14, '泡泡糖', 'NCT DREAM'),
  (15, 'Love More', 'Bii 畢書盡'),
  (16, '我們青春', 'TFBOYS'),
  (17, '小城夏天', 'LBI利比'),
  (18, '時間煮雨', '郁可唯'),
  (19, '一笑傾城', '汪蘇瀧'),
  (20, '寵愛', 'TFBOYS'),
  (21, '青春修煉手冊', 'TFBOYS'),
  (22, '我看過', '周星星'),
  (23, '女孩', '韋禮安'),
  (24, '戀愛ing', '五月天'),
  (25, 'Honey', '郭書瑤'),
  (26, 'Whatever', 'PiXXiE'),
  (27, '座位', '姚曉棠'),
  (28, '我還是愛著你', 'MP魔幻力量'),
  (29, '想見你', '八三夭'),
  (30, '如果可以', '韋禮安'),
  (31, 'Beatbox', 'NCT DREAM'),
  (32, '湊熱鬧', 'By2'),
  (33, '喜歡你', '陳潔怡'),
  (34, '十二月的奇蹟', 'EXO'),
  (35, 'Without you', 'NCT U'),
  (36, '蝴蝶少女', 'EXO'),
  (37, '為心導航', 'EXO'),
  (38, '唯一', '告五人'),
  (39, '彼得潘', 'EXO'),
  (40, '歐若拉', '張韶涵'),
  (41, '你並不懂我', 'By2'),
  (42, '新少女祈禱', 'By2'),
  (43, '你不會一輩子的愛上我', 'Tyson Yoshi'),
  (44, '百年孤寂', '王菲'),
  (45, '日不落', '蔡依林'),
  (46, '囂張', 'en'),
  (47, '有沒有', 'By2'),
  (48, '無垢', '李浩瑋'),
  (49, '真心話', '李浩瑋'),
  (50, '小幸運', '田馥甄'),
  (51, '星空', '五月天'),
  (52, '童話', '光良'),
  (53, '天機', 'MP魔幻力量/阿信'),
  (54, '勢在必行', '陳勢安/畢書盡'),
  (55, '初雪', 'EXO'),
  (56, '心花開', '李千娜'),
  (57, '介意', '白峻嘉'),
  (58, '太陽與地球', '盧廣仲'),
  (59, '我喜歡你', '芒果醬'),
  (60, '沒理由', 'BY2'),
  (61, '雨愛', '楊丞琳'),
  (62, '舅媽', '巴大雄'),
  (63, '不靈不靈', '很美味'),
  (64, '每天在擔心', '翁祥');