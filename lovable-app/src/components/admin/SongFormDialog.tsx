import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagToggles } from "@/components/admin/TagToggles";
import { LABEL_KINDS, labelsOfKind, type Category, type Song } from "@/lib/catalog";
import { songSchema } from "@/lib/validation";
import type { SongInput } from "@/lib/admin-api";

export function SongFormDialog({
  open,
  onOpenChange,
  song,
  categories,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song | null;
  categories: Category[];
  onSubmit: (input: SongInput) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string | undefined; artist?: string | undefined }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(song?.title ?? "");
    setArtist(song?.artist ?? "");
    setTagIds(song?.tag_ids ?? []);
    setErrors({});
  }, [open, song]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = songSchema.safeParse({
      title,
      artist,
      tag_ids: categories.filter((c) => tagIds.includes(c.id)).map((c) => c.id),
    });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({ title: f.title?.[0], artist: f.artist?.[0] });
      return;
    }
    setSaving(true);
    try {
      await onSubmit(parsed.data);
      onOpenChange(false);
    } catch {
      // caller shows the error toast
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{song ? "編輯歌曲" : "新增歌曲"} 🍒</DialogTitle>
            <DialogDescription>歌名與歌手會照你輸入的內容保存；標籤可複選，也可以之後再補。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="song-title">歌名</Label>
            <Input
              id="song-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              autoFocus
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "song-title-error" : undefined}
            />
            {errors.title && <p id="song-title-error" className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="song-artist">歌手</Label>
            <Input
              id="song-artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              maxLength={120}
              aria-invalid={!!errors.artist}
              aria-describedby={errors.artist ? "song-artist-error" : undefined}
            />
            {errors.artist && <p id="song-artist-error" className="text-xs text-destructive">{errors.artist}</p>}
          </div>

          {LABEL_KINDS.map(({ kind, title }) => (
            <div key={kind} className="grid gap-2">
              <p className="text-sm font-medium text-foreground">{title}標籤（可複選，選填）</p>
              <TagToggles
                categories={labelsOfKind(categories, kind)}
                value={tagIds}
                onChange={setTagIds}
                label={`${title}標籤`}
                tone={kind === "language" ? "butter" : "cherry"}
              />
            </div>
          ))}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              取消
            </Button>
            <Button type="submit" variant="cherry" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {song ? "儲存變更" : "新增"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}