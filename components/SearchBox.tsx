"use client";
import { assetUrl } from "@/lib/assets";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/PrefetchLink";

type Hit = { slug: string; title: string; cover: string; author?: string; href: string };

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  // Kết quả gần nhất kèm từ khóa của nó -> suy ra trạng thái "đang tìm" mà không cần state riêng
  const [res, setRes] = useState<{ q: string; hits: Hit[] } | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLFormElement>(null);

  const term = q.trim();
  const valid = term.length >= 2;
  const loading = valid && res?.q !== term; // đang chờ debounce hoặc chờ server
  const fresh = valid && res?.q === term;

  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        setRes({ q: term, hits: await r.json() });
      } catch {
        // bị hủy do gõ tiếp thì bỏ qua; lỗi mạng thì coi như không có kết quả
        if (!ctrl.signal.aborted) setRes({ q: term, hits: [] });
      }
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [term]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const hits = res?.hits ?? [];
  const showStale = loading && hits.length > 0; // giữ kết quả cũ (mờ đi) trong lúc chờ để không bị chớp

  return (
    <form
      ref={box}
      className="relative flex-1"
      onSubmit={(e) => { e.preventDefault(); if (term) { setOpen(false); router.push(`/tim-kiem?q=${encodeURIComponent(term)}`); } }}
    >
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Tìm truyện, tác giả..."
        className="w-full rounded-full border border-border bg-background py-2 pl-4 pr-10 text-sm outline-none focus:border-accent"
      />
      {loading && (
        <span
          role="status"
          aria-label="Đang tìm"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-border border-t-accent"
        />
      )}
      {open && valid && (
        <ul className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-auto rounded-xl border border-border bg-card shadow-lg">
          {loading && !showStale &&
            Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 p-2">
                <div className="h-12 w-9 animate-pulse rounded bg-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-border" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-border" />
                </div>
              </li>
            ))}
          {fresh && hits.length === 0 && <li className="p-3 text-center text-sm text-muted">Không tìm thấy “{term}”</li>}
          {(fresh || showStale) &&
            hits.map((h) => (
              <li key={h.href} className={showStale ? "opacity-50 transition-opacity" : ""}>
                <Link href={h.href} onClick={() => setOpen(false)} className="flex items-center gap-3 p-2 hover:bg-accent/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetUrl(h.cover)} alt="" className="h-12 w-9 rounded object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{h.title}</span>
                    <span className="block truncate text-xs text-muted">{h.author}</span>
                  </span>
                </Link>
              </li>
            ))}
          {fresh && hits.length > 0 && (
            <li className="border-t border-border">
              <Link href={`/tim-kiem?q=${encodeURIComponent(term)}`} onClick={() => setOpen(false)} className="block p-2.5 text-center text-sm font-medium text-accent hover:bg-accent/10">
                Xem tất cả kết quả ›
              </Link>
            </li>
          )}
        </ul>
      )}
    </form>
  );
}
