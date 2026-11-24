import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { createCategory, deleteCategory, moveCategory, renameCategory } from "@/lib/admin-api";
import type { Category, LabelKind } from "@/lib/catalog";
import { categorySchema } from "@/lib/validation";

export function CategoryManager({
  kind,
  title,
  categories,
  counts,
  onChanged,
}: {
  kind: LabelKind;
  title: string;
  categories: Category[];
  counts: Map<string, number>;
  onChanged: () => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string>();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const deleteCount = toDelete ? (counts.get(toDelete.id) ?? 0) : 0;

  async function run(fn: () => Promise<void>, success: string) {
    try {
      await fn();
      await onChanged();
      toast.success(success);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失敗");
      throw e;
    }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    const parsed = categorySchema.safeParse(newName);
    if (!parsed.success) {
      setNewError(parsed.error.issues[0]?.message);
      return;
    }
    setNewError(undefined);
    setAdding(true);
    try {
      const order = categories.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1;
      await run(() => createCategory(parsed.data, order, kind), `已新增${title}標籤「${parsed.data}」`);
      setNewName("");
    } catch {
      /* toast shown */
    } finally {
      setAdding(false);
    }
  }

  async function onRename(cat: Category) {
    const parsed = categorySchema.safeParse(editName);
    if (!parsed.success) {
      setEditError(parsed.error.issues[0]?.message);
      return;
    }
    if (parsed.data === cat.name) {
      setEditingId(null);
      return;
    }
    setBusyId(cat.id);
    try {
      await run(() => renameCategory(cat.id, parsed.data), "標籤名稱已更新");
      setEditingId(null);
    } catch {
      /* toast shown */
    } finally {
      setBusyId(null);
    }
  }

  async function onMove(index: number, dir: -1 | 1) {
    const a = categories[index];
    const b = categories[index + dir];
    if (!a || !b) return;
    setBusyId(a.id);
    try {
      // Normalize when equal so swapping actually changes the order.
      const bOrder = a.sort_order === b.sort_order ? b.sort_order + dir : b.sort_order;
      await run(() => moveCategory(a, { id: b.id, sort_order: bOrder }), "已調整順序");
    } catch {
      /* toast shown */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-labelledby={`labels-${kind}`} className="grid content-start gap-4">
      <h2 id={`labels-${kind}`} className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
        <span
          aria-hidden="true"
          className={kind === "language" ? "h-3 w-3 rounded-full border border-butter-deep bg-butter" : "h-3 w-3 rounded-full bg-blush-deep"}
        />
        {title}標籤
        <span className="text-sm font-normal text-muted-foreground">{categories.length} 個</span>
      </h2>
      <form onSubmit={onAdd} noValidate className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
        <label htmlFor={`new-${kind}`} className="text-sm font-medium text-foreground">
          新增{title}標籤
        </label>
        <div className="mt-2 flex gap-2">
          <Input
            id={`new-${kind}`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={kind === "language" ? "例如：日文" : "例如：夏天"}
            maxLength={20}
            aria-invalid={!!newError}
            aria-describedby={newError ? `new-${kind}-error` : undefined}
          />
          <Button type="submit" variant="cherry" disabled={adding} className="shrink-0">
            {adding ? <Loader2 className="animate-spin" /> : <Plus />}
            新增
          </Button>
        </div>
        {newError && <p id={`new-${kind}-error`} className="mt-1.5 text-xs text-destructive">{newError}</p>}
      </form>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-blush-deep bg-card/70 p-8 text-center text-sm text-muted-foreground">
          這一組還沒有標籤，先新增一個吧 🍒
        </p>
      ) : (
        <ul className="grid gap-2">
          {categories.map((cat, i) => {
            const editing = editingId === cat.id;
            const count = counts.get(cat.id) ?? 0;
            return (
              <li
                key={cat.id}
                className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-soft"
              >
                {editing ? (
                  <form
                    className="flex min-w-0 flex-1 items-start gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void onRename(cat);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={20}
                        autoFocus
                        aria-label={`重新命名「${cat.name}」`}
                        aria-invalid={!!editError}
                        className="h-10"
                      />
                      {editError && <p className="mt-1 text-xs text-destructive">{editError}</p>}
                    </div>
                    <Button type="submit" size="icon" variant="soft" aria-label="儲存名稱" disabled={busyId === cat.id}>
                      {busyId === cat.id ? <Loader2 className="animate-spin" /> : <Check />}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" aria-label="取消" onClick={() => setEditingId(null)}>
                      <X />
                    </Button>
                  </form>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif font-semibold text-foreground">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{count} 首歌</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`將「${cat.name}」往上移`}
                        disabled={i === 0 || busyId !== null}
                        onClick={() => onMove(i, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`將「${cat.name}」往下移`}
                        disabled={i === categories.length - 1 || busyId !== null}
                        onClick={() => onMove(i, 1)}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`重新命名「${cat.name}」`}
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                          setEditError(undefined);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`刪除「${cat.name}」`}
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setToDelete(cat)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`刪除標籤「${toDelete?.name ?? ""}」？`}
        description={
          <p>
            {deleteCount > 0
              ? `有 ${deleteCount} 首歌使用這個標籤，歌曲不會被刪除，只會移除這個標籤。`
              : "目前沒有歌曲使用這個標籤。"}
            此動作無法復原。
          </p>
        }
        onConfirm={async () => {
          if (!toDelete) return;
          const name = toDelete.name;
          await run(() => deleteCategory(toDelete.id), `已刪除「${name}」`);
        }}
      />
    </section>
  );
}