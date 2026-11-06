"use client";
import { assetUrl } from "@/lib/assets";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/PrefetchLink";

type Hit = { slug: string; title: string; cover: string; author?: string };

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggest?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        setHits(await r.json());
      } catch {}
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <form
      ref={box}
      className="relative flex-1"
      onSubmit={(e) => { e.preventDefault(); if (q.trim()) { setOpen(false); router.push(`/tim-kiem?q=${encodeURIComponent(q.trim())}`); } }}
    >
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Tìm truyện, tác giả..."
        className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
      />
      {open && q.trim().length >= 2 && hits.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-auto rounded-xl border border-border bg-card shadow-lg">
          {hits.map((h) => (
            <li key={h.slug}>
              <Link href={`/truyen/${h.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 p-2 hover:bg-accent/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(h.cover)} alt="" className="h-12 w-9 rounded object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{h.title}</span>
                  <span className="block truncate text-xs text-muted">{h.author}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
