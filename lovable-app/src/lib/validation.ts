import { z } from "zod";

export const songSchema = z.object({
  title: z.string().trim().min(1, "請輸入歌名").max(120, "歌名最多 120 個字"),
  artist: z.string().trim().min(1, "請輸入歌手").max(120, "歌手最多 120 個字"),
  tag_ids: z.array(z.string().uuid()),
});

export const categorySchema = z
  .string()
  .trim()
  .min(1, "請輸入標籤名稱")
  .max(20, "標籤名稱最多 20 個字");