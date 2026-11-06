import Link from "@/components/PrefetchLink";
import { getGenres, getStories, type ListParams } from "@/lib/api";
import { StoryGrid } from "./StoryCard";
import Pagination from "./Pagination";

export const LISTS: Record<string, { title: string; params: ListParams }> = {
  "truyen-chu": { title: "Truyện chữ", params: { type: "novel", sort: "updated_desc" } },
  "truyen-tranh": { title: "Truyện tranh", params: { type: "manga", sort: "updated_desc" } },
  "truyen-hentai": { title: "Truyện 18+", params: { filter: "hentai", sort: "updated_desc" } },
  "truyen-hot": { title: "Truyện hot", params: { sort: "votes_desc" } },
  "truyen-pho-bien": { title: "Truyện phổ biến", params: { sort: "rating_desc" } },
  "doc-nhieu": { title: "Đọc nhiều nhất", params: { sort: "views_desc" } },
  "truyen-hoan-thanh": { title: "Truyện hoàn thành", params: { filter: "completed", sort: "updated_desc" } },
  "dang-phat-hanh": { title: "Truyện đang phát hành", params: { filter: "ongoing", sort: "updated_desc" } },
  "sap-ra-mat": { title: "Truyện sắp ra mắt", params: { filter: "upcoming", sort: "updated_desc" } },
};

const SORTS: [string, string][] = [
  ["updated_desc", "Mới cập nhật"],
  ["views_desc", "Xem nhiều"],
  ["rating_desc", "Đánh giá cao"],
  ["votes_desc", "Bình chọn"],
  ["title_asc", "Tên A-Z"],
  ["chapter_desc", "Nhiều chương"],
];

export default async function ListView({ title, base, params, searchParams, showGenres = true }: {
  title: string; base: string; params: ListParams;
  searchParams: { page?: string; sort?: string; genre?: string };
  showGenres?: boolean;
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const sort = searchParams.sort || params.sort;
  const genre = searchParams.genre || params.genres;
  const [{ data, meta }, genres] = await Promise.all([
    getStories({ ...params, sort, genres: genre, page }),
    showGenres ? getGenres() : Promise.resolve([]),
  ]);
  const link = (o: { sort?: string; genre?: string }) => {
    const u = new URLSearchParams();
    const s = o.sort ?? sort;
    const g = o.genre ?? genre;
    if (s) u.set("sort", s);
    if (g && showGenres) u.set("genre", g);
    return `${base}?${u}`;
  };
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold sm:text-2xl">{title}</h1>
      <p className="mb-4 text-sm text-muted">{meta.total.toLocaleString("vi-VN")} truyện</p>
      <div className="no-scrollbar -mx-3 mb-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
        {SORTS.map(([v, l]) => (
          <Link key={v} href={link({ sort: v })} className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${sort === v ? "border-accent bg-accent text-white" : "border-border hover:border-accent"}`}>{l}</Link>
        ))}
      </div>
      {showGenres && genres.length > 0 && (
        <details className="mb-5 rounded-lg border border-border bg-card p-3" open={!!genre}>
          <summary className="cursor-pointer text-sm font-medium">Lọc theo thể loại{genre ? `: ${genres.find((g) => g.slug === genre)?.name ?? genre}` : ""}</summary>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {genre && <Link href={link({ genre: "" })} className="rounded-full bg-accent px-2.5 py-1 text-xs text-white">✕ Bỏ lọc</Link>}
            {genres.map((g) => (
              <Link key={g.slug} href={link({ genre: g.slug })} className={`rounded-full border px-2.5 py-1 text-xs ${genre === g.slug ? "border-accent text-accent" : "border-border hover:border-accent"}`}>{g.name}</Link>
            ))}
          </div>
        </details>
      )}
      <StoryGrid stories={data} />
      <Pagination page={meta.page} totalPages={meta.totalPages} base={base} params={{ sort, genre: showGenres ? genre : undefined }} />
    </div>
  );
}
