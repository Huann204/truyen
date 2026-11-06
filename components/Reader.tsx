"use client";
import Link from "@/components/PrefetchLink";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageImage from "./PageImage";
import { saveHistory } from "@/lib/storage";

type Props = {
  slug: string;
  title: string;
  cover: string;
  chapter: { slug: string; title: string; mediaType: "text" | "image" };
  paragraphs: string[];
  pages: { id: number; url: string }[];
  prev?: string;
  next?: string;
  chapters: { slug: string; title: string }[];
};

type Settings = { size: number; line: number; font: "sans" | "serif"; bg: "light" | "sepia" | "dark" };
const DEFAULTS: Settings = { size: 19, line: 1.8, font: "serif", bg: "light" };
const BGS = {
  light: "bg-white text-neutral-900",
  sepia: "bg-[#f4ecd8] text-[#3b2f1e]",
  dark: "bg-[#16161c] text-neutral-300",
} as const;

// Lưu ở mức module: khi chuyển chương Reader bị mount lại nhưng không phải đọc/ẩn-hiện lại cài đặt -> không chớp lần 2
let cachedSettings: Settings | null = null;

export default function Reader({ slug, title, cover, chapter, paragraphs, pages, prev, next, chapters }: Props) {
  const router = useRouter();
  const [s, setS] = useState<Settings>(cachedSettings ?? DEFAULTS);
  const [panel, setPanel] = useState(false);
  const [ready, setReady] = useState(cachedSettings !== null);
  const isText = chapter.mediaType === "text";

  useEffect(() => {
    if (cachedSettings) return;
    let loaded = DEFAULTS;
    try {
      const raw = localStorage.getItem("reader");
      if (raw) loaded = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {}
    cachedSettings = loaded;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setS(loaded);
    setReady(true);
  }, []);

  function update(p: Partial<Settings>) {
    const n = { ...s, ...p };
    setS(n);
    cachedSettings = n;
    try { localStorage.setItem("reader", JSON.stringify(n)); } catch {}
  }

  useEffect(() => {
    saveHistory({ slug, title, cover, chapterSlug: chapter.slug, chapterTitle: chapter.title });
  }, [slug, title, cover, chapter.slug, chapter.title]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.key === "ArrowLeft" && prev) router.push(`/truyen/${slug}/${prev}`);
      if (e.key === "ArrowRight" && next) router.push(`/truyen/${slug}/${next}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, slug, router]);

  const nav = (
    <div className="hidden items-center justify-center gap-2 py-3 text-sm sm:flex">
      {prev ? <Link href={`/truyen/${slug}/${prev}`} className="rounded-lg bg-accent px-4 py-2 font-medium text-white">‹ Chương trước</Link> : <span className="rounded-lg border border-border px-4 py-2 opacity-40">‹ Chương trước</span>}
      <select
        value={chapter.slug}
        onChange={(e) => router.push(`/truyen/${slug}/${e.target.value}`)}
        className="max-w-[40%] rounded-lg border border-border bg-card px-2 py-2 text-foreground"
      >
        {chapters.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
      </select>
      {next ? <Link href={`/truyen/${slug}/${next}`} className="rounded-lg bg-accent px-4 py-2 font-medium text-white">Chương sau ›</Link> : <span className="rounded-lg border border-border px-4 py-2 opacity-40">Chương sau ›</span>}
    </div>
  );

  const bar = (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-card/95 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
      {prev ? <Link href={`/truyen/${slug}/${prev}`} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">‹</Link> : <span className="rounded-lg border border-border px-4 py-2 text-sm opacity-40">‹</span>}
      <Link href={`/truyen/${slug}`} className="min-w-0 flex-1 truncate rounded-lg border border-border px-3 py-2 text-center text-sm">{chapter.title}</Link>
      {isText && <button onClick={() => setPanel((v) => !v)} aria-label="Tùy chỉnh" className="rounded-lg border border-border px-3 py-2 text-sm">Aa</button>}
      {next ? <Link href={`/truyen/${slug}/${next}`} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">›</Link> : <span className="rounded-lg border border-border px-4 py-2 text-sm opacity-40">›</span>}
    </div>
  );

  return (
    <div className="pb-16 sm:pb-0">
      {bar}
      <div className="mb-3 text-center">
        <Link href={`/truyen/${slug}`} className="text-lg font-bold hover:text-accent">{title}</Link>
        <h1 className="text-sm text-muted">{chapter.title}</h1>
      </div>
      {nav}
      {isText && (
        <div className="mb-3 hidden justify-end sm:flex">
          <button onClick={() => setPanel((v) => !v)} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent">⚙ Tùy chỉnh đọc</button>
        </div>
      )}
      {isText && panel && (
        <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3">Cỡ chữ: {s.size}px
            <input type="range" min={14} max={32} value={s.size} onChange={(e) => update({ size: +e.target.value })} />
          </label>
          <label className="flex items-center justify-between gap-3">Giãn dòng: {s.line}
            <input type="range" min={1.3} max={2.4} step={0.1} value={s.line} onChange={(e) => update({ line: +e.target.value })} />
          </label>
          <div className="flex items-center justify-between gap-3">Phông chữ
            <div className="flex gap-1">
              {(["sans", "serif"] as const).map((f) => <button key={f} onClick={() => update({ font: f })} className={`rounded border px-2 py-1 ${s.font === f ? "border-accent text-accent" : "border-border"}`}>{f === "sans" ? "Sans" : "Serif"}</button>)}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">Nền
            <div className="flex gap-1">
              {(["light", "sepia", "dark"] as const).map((b) => <button key={b} onClick={() => update({ bg: b })} className={`rounded border px-2 py-1 ${s.bg === b ? "border-accent text-accent" : "border-border"}`}>{b === "light" ? "Sáng" : b === "sepia" ? "Vàng" : "Tối"}</button>)}
            </div>
          </div>
        </div>
      )}

      {isText ? (
        <article
          className={`mx-auto max-w-3xl rounded-xl px-4 py-6 sm:px-10 sm:py-8 ${BGS[s.bg]} ${ready ? "opacity-100" : "opacity-0"}`}
          style={{ fontSize: s.size, lineHeight: s.line, fontFamily: s.font === "serif" ? "var(--font-reader-serif), Georgia, serif" : "inherit" }}
        >
          {paragraphs.length ? paragraphs.map((p, i) => <p key={i} className="mb-4">{p}</p>) : <p className="text-center opacity-60">Chương này chưa có nội dung.</p>}
        </article>
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col items-center bg-black">
          {pages.length ? pages.map((p, i) => (
            <PageImage key={p.id} src={p.url} alt={`Trang ${i + 1}`} eager={i < 3} high={i < 2} />
          )) : <p className="py-10 text-white/60">Chương này chưa có ảnh.</p>}
        </div>
      )}
      {nav}
      <p className="hidden text-center text-xs text-muted sm:block">Mẹo: dùng phím ← → để chuyển chương</p>
    </div>
  );
}
