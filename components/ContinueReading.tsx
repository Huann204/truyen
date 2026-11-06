"use client";
import { assetUrl } from "@/lib/assets";
import Link from "@/components/PrefetchLink";
import { useHistory } from "@/lib/storage";
import SectionTitle from "./SectionTitle";

export default function ContinueReading() {
  const history = useHistory().slice(0, 6);
  const show = history.length > 0;
  return (
    <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${show ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`} aria-hidden={!show}>
    <section className="min-h-0 overflow-hidden">
      <SectionTitle title="Đang đọc dở" href="/lich-su" />
      <div className="no-scrollbar -mx-3 flex snap-x gap-3 overflow-x-auto px-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {history.map((h) => (
          <Link key={h.slug} href={`${h.base ?? "/truyen"}/${h.slug}/${h.chapterSlug}`} className="flex w-72 shrink-0 snap-start gap-3 rounded-xl border border-border bg-card p-2 shadow-sm hover:border-accent sm:w-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetUrl(h.cover)} alt="" className="h-20 w-14 rounded-lg object-cover" />
            <div className="min-w-0 self-center">
              <p className="line-clamp-2 text-sm font-medium">{h.title}</p>
              <p className="mt-1 truncate text-xs text-accent">Đọc tiếp: {h.chapterTitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
    </div>
  );
}
