import Link from "@/components/PrefetchLink";
import { listLibrary, placeholderCover } from "@/lib/library";

export const metadata = { title: "Thư viện của tôi" };
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const stories = await listLibrary();
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold sm:text-2xl">Thư viện của tôi</h1>
      <p className="mb-4 text-sm text-muted">Truyện đã tải về máy để đọc cá nhân.</p>
      {!stories.length && (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
          Chưa có truyện nào. Tải bằng: <code className="rounded bg-border/60 px-1.5 py-0.5">node scripts/crawl-blogspot.mjs &lt;link-chương-1&gt; &lt;slug&gt; &quot;Tên truyện&quot;</code>
        </p>
      )}
      <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6">
        {stories.map((s) => (
          <Link key={s.slug} href={`/thu-vien/${s.slug}`} className="group block">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-border shadow-sm ring-1 ring-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.cover || placeholderCover(s.title)} alt={s.title} className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute bottom-1.5 left-2 right-2 truncate text-[11px] font-medium text-white drop-shadow">
                {s.chapters.length} chương {s.type === "manga" ? "• Truyện tranh" : ""}
              </span>
            </div>
            <h3 className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug group-hover:text-accent sm:text-sm">{s.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
