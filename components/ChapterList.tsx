"use client";
import Link from "@/components/PrefetchLink";
import { useMemo, useState } from "react";
import { useHistory } from "@/lib/storage";

type Ch = { slug: string; title: string; numberText?: string; date?: string; isNew?: boolean };

export default function ChapterList({ slug, chapters }: { slug: string; chapters: Ch[] }) {
  const [q, setQ] = useState("");
  const [asc, setAsc] = useState(false);
  const [limit, setLimit] = useState(100);
  const readSlug = useHistory().find((h) => h.slug === slug)?.chapterSlug;

  const list = useMemo(() => {
    const f = q.trim().toLowerCase();
    let l = f ? chapters.filter((c) => (c.title + " " + (c.numberText ?? "")).toLowerCase().includes(f)) : chapters;
    // API trả về chương mới nhất trước
    if (asc) l = [...l].reverse();
    return l;
  }, [chapters, q, asc]);

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm chương..." className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent" />
        <button onClick={() => setAsc((v) => !v)} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent">
          {asc ? "Cũ → Mới" : "Mới → Cũ"}
        </button>
      </div>
      <ul className="grid gap-x-4 sm:grid-cols-2">
        {list.slice(0, limit).map((c) => (
          <li key={c.slug} className="border-b border-border">
            <Link href={`/truyen/${slug}/${c.slug}`} className={`flex items-center justify-between gap-2 py-2 text-sm hover:text-accent ${readSlug === c.slug ? "font-semibold text-accent" : ""}`}>
              <span className="truncate">{c.title}{c.isNew && <span className="ml-2 rounded bg-accent px-1 text-[10px] text-white">NEW</span>}</span>
              <span className="shrink-0 text-xs text-muted">{c.date}</span>
            </Link>
          </li>
        ))}
      </ul>
      {list.length > limit && (
        <button onClick={() => setLimit((l) => l + 200)} className="mx-auto mt-4 block rounded-lg border border-border px-4 py-2 text-sm hover:border-accent">
          Xem thêm ({list.length - limit} chương)
        </button>
      )}
      {!list.length && <p className="py-6 text-center text-muted">Không có chương nào.</p>}
    </div>
  );
}
