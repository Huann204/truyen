import Link from "@/components/PrefetchLink";

export default function Pagination({ page, totalPages, base, params = {} }: {
  page: number; totalPages: number; base: string; params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `${base}?${s}` : base;
  };
  const pages = new Set([1, totalPages, page - 2, page - 1, page, page + 1, page + 2]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const cls = "min-w-9 rounded-md border border-border px-3 py-1.5 text-center text-sm hover:border-accent hover:text-accent";
  const out: React.ReactNode[] = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push(<span key={`g${p}`} className="px-1 text-muted">…</span>);
    out.push(
      <Link key={p} href={href(p)} className={`${cls} ${p === page ? "border-accent bg-accent text-white hover:text-white" : ""}`}>{p}</Link>,
    );
  });
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && <Link href={href(page - 1)} className={cls}>‹ Trước</Link>}
      {out}
      {page < totalPages && <Link href={href(page + 1)} className={cls}>Sau ›</Link>}
    </nav>
  );
}
