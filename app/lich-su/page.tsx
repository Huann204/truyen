"use client";
import { assetUrl } from "@/lib/assets";
import Link from "@/components/PrefetchLink";
import { clearHistory, removeHistory, useHistory, useHydrated } from "@/lib/storage";

export default function HistoryPage() {
  const list = useHistory();
  const ready = useHydrated();
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lịch sử đọc</h1>
        {ready && list.length > 0 && <button onClick={clearHistory} className="text-sm text-accent hover:underline">Xóa tất cả</button>}
      </div>
      {ready && !list.length && <p className="text-muted">Bạn chưa đọc truyện nào.</p>}
      {!ready && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-border" />)}
        </div>
      )}
      <ul className="img-fade space-y-3">
        {list.map((h) => (
          <li key={h.slug} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetUrl(h.cover)} alt="" className="h-20 w-14 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <Link href={`${h.base ?? "/truyen"}/${h.slug}`} className="line-clamp-1 font-medium hover:text-accent">{h.title}</Link>
              <Link href={`${h.base ?? "/truyen"}/${h.slug}/${h.chapterSlug}`} className="text-sm text-accent hover:underline">Đọc tiếp: {h.chapterTitle}</Link>
              <p className="text-xs text-muted">{new Date(h.at).toLocaleString("vi-VN")}</p>
            </div>
            <button onClick={() => removeHistory(h.slug)} aria-label="Xóa" className="px-2 text-muted hover:text-accent">✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
