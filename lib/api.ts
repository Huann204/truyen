export const API_BASE = process.env.API_BASE_URL || "https://api.khotruyen.site";
import { SHOW_ADULT } from "@/lib/config";

export const SITE_NAME = "KhoTruyện";

export type Taxonomy = { group: string; slug: string; name: string; parentSlug: string | null };
export type Contributor = { role: string; name: string; slug: string };
export type Page = { id: number; index: number; url: string; mimeType?: string };
export type Chapter = {
  id: number;
  slug: string;
  title: string;
  mediaType: "text" | "image";
  num: number;
  numberText: string;
  isNew: boolean;
  date: string;
  publishedAt: string | null;
  updatedAt: string;
  bodyText: string | null;
  bodyHtml: string | null;
  wordCount: number;
  pages: Page[];
};
export type Story = {
  id: number;
  slug: string;
  title: string;
  cover: string;
  author?: string;
  status?: string;
  genres?: string[];
  taxonomies?: Taxonomy[];
  contributors?: Contributor[];
  chapters: Partial<Chapter>[];
  updateTime: string;
  description?: string;
  type?: "manga" | "novel" | string;
  isAdult?: boolean;
  rating?: number;
  votes?: number;
  views?: number;
};
export type Meta = { page: number; perPage: number; total: number; totalPages: number };
export type Section = { id: string; title: string; viewAllUrl: string; cardStyle: string; stories: Story[] };
export type Genre = { name: string; slug: string; group: string; count: number };

export type ListParams = {
  page?: number;
  perPage?: number;
  filter?: string;
  type?: string;
  genres?: string;
  q?: string;
  sort?: string;
};

async function get<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(API_BASE + path, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function qs(p: Record<string, string | number | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "") u.set(k, String(v));
  return u.toString();
}

// Nội dung 18+ chỉ hiện khi SHOW_ADULT=1, mặc định lọc bằng rating=safe
const RATING = SHOW_ADULT ? undefined : "safe";

export async function getStories(p: ListParams = {}) {
  const query = qs({ ...p, rating: RATING, paginated: 1, perPage: p.perPage ?? 24 });
  const r = await get<{ data: Story[]; meta: Meta }>(`/api/stories?${query}`);
  return r ?? { data: [], meta: { page: 1, perPage: 24, total: 0, totalPages: 0 } };
}

export async function searchStories(q: string, page = 1, perPage = 24) {
  const query = qs({ q, page, perPage, rating: RATING, paginated: 1 });
  const r = await get<{ data: Story[]; meta: Meta }>(`/api/search?${query}`, 60);
  return r ?? { data: [], meta: { page: 1, perPage, total: 0, totalPages: 0 } };
}

export async function getHomeSections() {
  if (SHOW_ADULT) {
    const r = await get<{ data: Section[] }>("/api/home-sections", 86400);
    return r?.data ?? [];
  }
  // /api/home-sections không có cờ 18+ ở từng truyện nên tự dựng các mục từ danh sách đã lọc
  const defs: { id: string; title: string; viewAllUrl: string; cardStyle: string; params: ListParams }[] = [
    { id: "novel-updated", title: "Truyện chữ mới cập nhật", viewAllUrl: "/truyen-chu", cardStyle: "wide", params: { type: "novel", sort: "updated_desc" } },
    { id: "manga-updated", title: "Truyện tranh mới cập nhật", viewAllUrl: "/truyen-tranh", cardStyle: "poster", params: { type: "manga", sort: "updated_desc" } },
    { id: "hot", title: "Truyện hot", viewAllUrl: "/truyen-hot", cardStyle: "poster", params: { sort: "votes_desc" } },
    { id: "popular", title: "Truyện phổ biến", viewAllUrl: "/truyen-pho-bien", cardStyle: "poster", params: { sort: "rating_desc" } },
    { id: "most-read", title: "Đọc nhiều nhất", viewAllUrl: "/doc-nhieu", cardStyle: "poster", params: { sort: "views_desc" } },
  ];
  const lists = await Promise.all(defs.map((d) => getStories({ ...d.params, perPage: 12 }).then((r) => r.data)));
  return defs
    .map((d, i): Section => ({ id: d.id, title: d.title, viewAllUrl: d.viewAllUrl, cardStyle: d.cardStyle, stories: lists[i] }))
    .filter((s) => s.stories.length > 0);
}

export async function getGenres() {
  const r = await get<{ data: Genre[] }>("/api/genres?perPage=100", 3600);
  return (r?.data ?? []).filter((g) => g.group === "genre" && (SHOW_ADULT || !["18", "adult"].includes(g.slug)));
}

export async function getGenre(slug: string) {
  const r = await get<{ data: Genre }>(`/api/categories/${encodeURIComponent(slug)}`, 3600);
  return r?.data ?? null;
}

export async function getStats() {
  const r = await get<{ data: Record<string, number> }>("/api/stats", 86400);
  const d = r?.data;
  if (!d) return null;
  // bỏ phần 18+ khỏi số liệu hiển thị
  return SHOW_ADULT ? d : { ...d, totalStories: d.totalStories - (d.hentaiStories ?? 0), hentaiStories: 0 };
}

// Endpoint chi tiết trả về object truyện (không bọc trong `data`)
export async function getStory(slug: string): Promise<Story | null> {
  const r = await get<Story | { data: Story }>(`/api/stories/${encodeURIComponent(slug)}`, 300);
  if (!r) return null;
  const story = "data" in r ? r.data : r;
  return !SHOW_ADULT && story.isAdult ? null : story; // truyện 18+ -> 404
}

// Trả về cả truyện (đủ danh sách chương) và nội dung của chương được chọn
export async function getChapter(slug: string, chapter: string) {
  const r = await get<Story | { data: Story }>(
    `/api/stories/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(chapter)}`,
    600,
  );
  if (!r) return null;
  const story = "data" in r ? r.data : r;
  if (!SHOW_ADULT && story.isAdult) return null;
  const current = story.chapters.find((c) => c.slug === chapter) as Chapter | undefined;
  if (!current) return null;
  return { story, current };
}

export function typePath(type?: string) {
  return type === "manga" ? "truyen-tranh" : "truyen-chu";
}

export function bodyParagraphs(c: Chapter): string[] {
  let text = c.bodyText;
  if (!text && c.bodyHtml) {
    text = c.bodyHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');
  }
  return (text ?? "")
    .split(/\n+/)
    .map((s) => s.normalize("NFC").trim())
    .filter(Boolean);
}

export function formatViews(n?: number) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
