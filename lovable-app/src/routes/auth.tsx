import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cherry } from "@/components/radio/Cherry";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "管理員登入 · RAN's Little Radio" },
      { name: "description", content: "RAN's Little Radio 的私人歌單管理後台。" },
      { property: "og:title", content: "管理員登入 · RAN's Little Radio" },
      { property: "og:description", content: "RAN's Little Radio 的私人歌單管理後台。" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

const credentialsSchema = z.object({
  email: z.string().trim().email("請輸入有效的 Email"),
  password: z.string().min(8, "密碼至少需要 8 個字元"),
});

const supabaseConfigured = Boolean(
  import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
);

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string | undefined; password?: string | undefined }>({});
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/admin", replace: true });
    }).catch(() => {
      // A missing or expired session simply leaves the user on the login page.
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/admin", replace: true });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) {
      toast.error("後台資料庫尚未連線");
      return;
    }
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({ email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          toast.error(
            error.message.includes("Email not confirmed")
              ? "請先到信箱完成 Email 驗證。"
              : "Email 或密碼不正確",
          );
          return;
        }
        navigate({ to: "/admin", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) navigate({ to: "/admin", replace: true });
        else setCheckEmail(true);
      }
    } catch {
      toast.error("登入暫時無法完成，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-blush-wash">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/"><ArrowLeft /> 回到歌單</Link>
        </Button>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
        <div className="rounded-3xl border border-border/70 bg-card p-7 shadow-lift sm:p-9">
          <div className="text-center">
            <Cherry className="mx-auto h-12 w-12" sway />
            <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">小橪的管理後台</h1>
            <p className="mt-2 text-sm text-muted-foreground">登入後就能管理歌曲和標籤 🍒</p>
          </div>

          {!supabaseConfigured ? (
            <div className="mt-7 rounded-2xl bg-secondary/80 p-5 text-center">
              <p className="font-medium text-foreground">後台正在準備連線</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                管理畫面已經準備好，目前還差資料庫連線設定。完成後，就能新增、修改和刪除歌曲，也能自己管理標籤。
              </p>
              <p className="mt-3 text-xs text-muted-foreground">公開歌單不受影響。</p>
            </div>
          ) : checkEmail ? (
            <div role="status" className="mt-7 rounded-2xl bg-secondary p-5 text-center text-sm text-secondary-foreground">
              已寄出確認信到 <span className="font-semibold">{email}</span>，請到信箱完成驗證，再回來登入 🍒
              <Button variant="link" className="mt-2" onClick={() => { setCheckEmail(false); setMode("signin"); }}>
                回到登入
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-7 grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && <p id="email-error" className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">密碼</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                {errors.password && <p id="password-error" className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <Button type="submit" variant="cherry" size="lg" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
                {mode === "signin" ? "登入後台" : "建立帳號"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {mode === "signin" ? "還沒有帳號？" : "已經有帳號？"}
                <button
                  type="button"
                  onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrors({}); }}
                  className="ml-1 cursor-pointer font-medium text-primary underline-offset-4 hover:underline"
                >
                  {mode === "signin" ? "建立帳號" : "返回登入"}
                </button>
              </p>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground/80">
                只有獲得小橪授權的帳號可以進入管理後台。
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
