"use client";
import { assetUrl } from "@/lib/assets";
import Link from "@/components/PrefetchLink";
import { toggleBookmark, useBookmarks, useHydrated } from "@/lib/storage";

export default function ShelfPage() {
  const list = useBookmarks();
  const ready = useHydrated();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Tủ sách</h1>
      {ready && !list.length && <p className="text-muted">Chưa có truyện nào. Bấm “Lưu vào tủ sách” ở trang truyện.</p>}
      {!ready && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}><div className="aspect-[3/4] animate-pulse rounded-lg bg-border" /><div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-border" /></div>
          ))}
        </div>
      )}
      <div className="img-fade grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {list.map((b) => (
          <div key={b.slug} className="group relative">
            <Link href={`/truyen/${b.slug}`}>
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(b.cover)} alt={b.title} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-accent">{b.title}</h3>
            </Link>
            <button onClick={() => toggleBookmark(b)} className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-white hover:bg-accent" aria-label="Bỏ lưu">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
