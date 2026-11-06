import Link from "@/components/PrefetchLink";
import { searchStories } from "@/lib/api";
import { placeholderCover, searchLibrary } from "@/lib/library";
import { StoryGrid } from "@/components/StoryCard";
import Pagination from "@/components/Pagination";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return { title: q ? `Tìm kiếm: ${q}` : "Tìm kiếm" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", page } = await searchParams;
  const p = Math.max(1, Number(page) || 1);
  const [res, mine] = q.trim() ? await Promise.all([searchStories(q.trim(), p), p === 1 ? searchLibrary(q) : []]) : [null, []];
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold sm:text-2xl">Tìm kiếm{q && `: “${q}”`}</h1>
      {!res && <p className="text-muted">Nhập từ khóa vào ô tìm kiếm phía trên.</p>}
      {res && (
        <>
          <p className="mb-4 text-sm text-muted">{(res.meta.total + mine.length).toLocaleString("vi-VN")} kết quả</p>
          {/* Truyện đã tải về máy (chỉ có ở trang 1) */}
          {mine.length > 0 && (
            <div className="mb-6 grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-5 md:grid-cols-5 lg:grid-cols-6">
              {mine.map((s) => (
                <Link key={s.slug} href={`/thu-vien/${s.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-border shadow-sm ring-1 ring-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={placeholderCover(s.title)} alt={s.title} className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-orange-300">CỦA TÔI</span>
                    <span className="absolute bottom-1.5 left-2 right-2 truncate text-[11px] font-medium text-white drop-shadow">{s.chapters.length} chương</span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug group-hover:text-accent sm:text-sm">{s.title}</h3>
                </Link>
              ))}
            </div>
          )}
          <StoryGrid stories={res.data} />
          <Pagination page={res.meta.page} totalPages={res.meta.totalPages} base="/tim-kiem" params={{ q }} />
        </>
      )}
    </div>
  );
}
