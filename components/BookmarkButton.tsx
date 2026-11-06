"use client";
import { toggleBookmark, useBookmarks } from "@/lib/storage";

export default function BookmarkButton({ slug, title, cover }: { slug: string; title: string; cover: string }) {
  const saved = useBookmarks().some((b) => b.slug === slug);
  return (
    <button
      onClick={() => toggleBookmark({ slug, title, cover })}
      className={`col-span-2 rounded-lg border px-4 py-2 text-sm font-medium sm:order-2 sm:col-span-1 sm:min-w-44 ${saved ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent"}`}
    >
      {saved ? "★ Đã lưu vào tủ sách" : "☆ Lưu vào tủ sách"}
    </button>
  );
}
