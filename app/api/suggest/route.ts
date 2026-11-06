import { searchStories } from "@/lib/api";
import { placeholderCover, searchLibrary } from "@/lib/library";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) return Response.json([]);
  const [lib, { data }] = await Promise.all([searchLibrary(q), searchStories(q.trim(), 1, 6)]);
  return Response.json([
    // truyện đã tải về máy (nếu có) hiện trước
    ...lib.slice(0, 3).map((s) => ({
      slug: s.slug,
      title: s.title,
      cover: placeholderCover(s.title),
      author: "Truyện của tôi",
      href: `/thu-vien/${s.slug}`,
    })),
    ...data.map((s) => ({ slug: s.slug, title: s.title, cover: s.cover, author: s.author, href: `/truyen/${s.slug}` })),
  ]);
}
