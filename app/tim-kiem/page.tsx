import { searchStories } from "@/lib/api";
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
  const res = q.trim() ? await searchStories(q.trim(), p) : null;
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Tìm kiếm{q && `: “${q}”`}</h1>
      {!res && <p className="text-muted">Nhập từ khóa vào ô tìm kiếm phía trên.</p>}
      {res && (
        <>
          <p className="mb-4 text-sm text-muted">{res.meta.total.toLocaleString("vi-VN")} kết quả</p>
          <StoryGrid stories={res.data} />
          <Pagination page={res.meta.page} totalPages={res.meta.totalPages} base="/tim-kiem" params={{ q }} />
        </>
      )}
    </div>
  );
}
