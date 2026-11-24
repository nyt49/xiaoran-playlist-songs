# RAN's Cherry Songbook 🍒

這個資料夾保存原本 Lovable 專案的完整應用程式原始碼，包含公開歌單、搜尋與篩選、隨機選歌、管理員登入／後台、Supabase 整合、資料庫 migrations 和測試。

> 原本的 GitHub Pages 靜態網站仍保留在儲存庫根目錄。這份應用程式放在 `lovable-app/`，不會覆蓋舊網站。

## 本機開發

需要 Node.js（建議使用目前 LTS）或 Bun。

```bash
cd lovable-app
bun install
cp .env.example .env
bun run dev
```

也可以使用 npm：

```bash
npm install
npm run dev
```

## 環境變數

請將 `.env.example` 複製成 `.env`，再填入自己的 Supabase 專案設定。**不要把真正的 `.env`、service role key 或其他私密金鑰提交到 GitHub。**

- `SUPABASE_URL`：Supabase 專案 URL（伺服器端）
- `SUPABASE_PUBLISHABLE_KEY`：Supabase publishable / anon key（伺服器端）
- `VITE_SUPABASE_URL`：同一個 Supabase URL（瀏覽器端）
- `VITE_SUPABASE_PUBLISHABLE_KEY`：同一個 publishable / anon key（瀏覽器端）
- `SUPABASE_SERVICE_ROLE_KEY`：僅在需要執行管理員伺服器操作時，設定在可信任的伺服器環境；不可放入前端變數
- `SUPABASE_PROJECT_ID`、`VITE_SUPABASE_PROJECT_ID`：Supabase 專案識別碼

## 指令

```bash
bun run dev       # 本機開發
bun run build     # 正式建置
bun run preview   # 預覽建置結果
bun run test      # 執行測試
bun run lint      # ESLint
```

## 部署注意事項

這是使用 TanStack Start 的全端應用程式，並非純靜態 HTML。它使用伺服器端函式及 Supabase，因此**不能只把這個資料夾丟到 GitHub Pages 就期待管理後台和伺服器功能完整運作**。部署時需要支援 TanStack Start／Nitro 的伺服器或 Worker 平台，並在該平台設定環境變數。

本專案的 Vite 設定目前使用 Lovable 提供的 TanStack/Vite 設定套件，且登入頁仍保留 Lovable Cloud OAuth 整合。要完全脫離 Lovable 部署前，需確認該建置套件可在外部環境安裝，並把 OAuth 登入改接到 Supabase 原生 OAuth 或其他身分驗證服務。Supabase 資料庫與 migrations 也需要部署到你要使用的 Supabase 專案。

## 安全

- `.env` 已加入忽略規則，請只提交 `.env.example`。
- 不要將 Supabase service role key 放在 `VITE_*` 變數。
- 資料庫管理權限仍由 Supabase RLS 與 admin role 控制。
