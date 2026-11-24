import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cherry } from "@/components/radio/Cherry";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "管理員登入 · RAN's Little Radio" },
      { name: "description", content: "RAN's Little Radio 的管理員登入頁，僅供歌單主人使用。" },
      { property: "og:title", content: "管理員登入 · RAN's Little Radio" },
      { property: "og:description", content: "RAN's Little Radio 的管理員登入頁，僅供歌單主人使用。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const credentialsSchema = z.object({
  email: z.string().trim().email("請輸入有效的 Email"),
  password: z.string().min(8, "密碼至少需要 8 個字元"),
});

function GoogleLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" className="!size-[18px]">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string | undefined; password?: string | undefined }>({});
  const [busy, setBusy] = useState<null | "email" | "google" | "lovable">(null);
  const [checkEmail, setCheckEmail] = useState(false);

  // Already signed in (including after returning from Google) → dashboard
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/admin", replace: true });
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
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({ email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] });
      return;
    }
    setErrors({});
    setBusy("email");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          toast.error(
            error.message.includes("Email not confirmed")
              ? "這個 Email 尚未完成驗證，請先到信箱點擊確認連結。"
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
    } finally {
      setBusy(null);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    setBusy(provider);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (result.error) {
      toast.error("登入沒有完成，請再試一次");
      setBusy(null);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-blush-wash">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft /> 回到歌單
          </Link>
        </Button>
      </div>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
        <div className="rounded-3xl border border-border/70 bg-card p-7 shadow-lift sm:p-9">
          <div className="text-center">
            <Cherry className="mx-auto h-12 w-12" sway />
            <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">小橪的後台</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              只有被授權的歌單主人可以管理歌曲與分類。
            </p>
          </div>

          {checkEmail ? (
            <div role="status" className="mt-8 rounded-2xl bg-secondary p-5 text-center text-sm text-secondary-foreground">
              已寄出確認信到 <span className="font-semibold">{email}</span>，請到信箱點擊連結完成驗證後再回來登入 🍒
              <Button variant="link" className="mt-2" onClick={() => { setCheckEmail(false); setMode("signin"); }}>
                回到登入
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => oauth("google")} disabled={busy !== null}>
                  {busy === "google" ? <Loader2 className="animate-spin" /> : <GoogleLogo />}
                  Continue with Google
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => oauth("lovable")} disabled={busy !== null}>
                  {busy === "lovable" ? <Loader2 className="animate-spin" /> : <LovableMark className="!size-[18px]" />}
                  Continue with Lovable
                </Button>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                或使用 Email
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={onSubmit} noValidate className="grid gap-4">
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
                  {errors.email && (
                    <p id="email-error" className="text-xs text-destructive">{errors.email}</p>
                  )}
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
                  {errors.password && (
                    <p id="password-error" className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" variant="cherry" size="lg" disabled={busy !== null}>
                  {busy === "email" ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
                  {mode === "signin" ? "登入" : "建立帳號"}
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                {mode === "signin" ? "第一次使用？" : "已經有帳號了？"}
                <button
                  type="button"
                  onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrors({}); }}
                  className="ml-1 cursor-pointer font-medium text-primary underline-offset-4 hover:underline"
                >
                  {mode === "signin" ? "建立帳號" : "改為登入"}
                </button>
              </p>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground/80">
                建立帳號不會自動取得管理權限，需由主人授權後才能使用後台。
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}