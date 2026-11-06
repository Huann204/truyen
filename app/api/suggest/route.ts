import { searchStories } from "@/lib/api";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) return Response.json([]);
  const { data } = await searchStories(q.trim(), 1, 6);
  return Response.json(data.map((s) => ({ slug: s.slug, title: s.title, cover: s.cover, author: s.author })));
}
