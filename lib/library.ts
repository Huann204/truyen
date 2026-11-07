import "server-only";
import { cache } from "react";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Thư viện cá nhân: truyện đã tải về máy bằng scripts/crawl-blogspot.mjs, lưu ở data/library/<slug>/
const ROOT = path.join(process.cwd(), "data", "library");

export type LibChapterMeta = { slug: string; num: number; title: string; words?: number; pages?: number };
export type LibStory = {
  slug: string;
  title: string;
  cover?: string;
  author?: string;
  description?: string;
  status?: string;
  genres?: string[];
  source?: string;
  type: "novel" | "manga";
  chapters: LibChapterMeta[]; // theo thứ tự tăng dần
  updatedAt?: string;
};
export type LibChapter = {
  slug: string;
  num: number;
  title: string;
  mediaType?: "text" | "image";
  paragraphs?: string[];
  pages?: { id: number; url: string }[];
  source?: string;
};

const safe = (s: string) => /^[a-z0-9][a-z0-9._-]*$/i.test(s) && !s.includes("..");

export async function listLibrary(): Promise<LibStory[]> {
  let dirs: string[] = [];
  try {
    dirs = await readdir(ROOT);
  } catch {
    return [];
  }
  const out: LibStory[] = [];
  for (const d of dirs) {
    const s = await getLibStory(d);
    if (s) out.push(s);
  }
  return out.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export const getLibStory = cache(async (slug: string): Promise<LibStory | null> => {
  const s = decodeURIComponent(slug);
  if (!safe(s)) return null;
  try {
    return JSON.parse(await readFile(path.join(ROOT, s, "story.json"), "utf8")) as LibStory;
  } catch {
    return null;
  }
});

export const getLibChapter = cache(async (slug: string, chapter: string): Promise<LibChapter | null> => {
  const s = decodeURIComponent(slug);
  const c = decodeURIComponent(chapter);
  if (!safe(s) || !safe(c)) return null;
  try {
    return JSON.parse(await readFile(path.join(ROOT, s, "chapters", `${c}.json`), "utf8")) as LibChapter;
  } catch {
    return null;
  }
});

// Truyện tải về không có ảnh bìa -> tạo bìa chữ cái đầu bằng SVG
export function placeholderCover(title: string) {
  const initials = title.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#e5484d"/><stop offset="1" stop-color="#fb923c"/></linearGradient></defs>` +
    `<rect width="300" height="400" fill="url(#g)"/><text x="150" y="225" font-family="Arial" font-weight="800" font-size="110" ` +
    `fill="white" fill-opacity=".9" text-anchor="middle">${initials.replace(/[<&]/g, "")}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d").toLowerCase();

// Tìm trong thư viện theo tên (không phân biệt dấu/hoa thường)
export async function searchLibrary(q: string): Promise<LibStory[]> {
  const key = fold(q.trim());
  if (!key) return [];
  return (await listLibrary()).filter((s) => fold(s.title).includes(key) || fold(s.slug).includes(key));
}
