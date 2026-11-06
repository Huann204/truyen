"use client";
import Link from "@/components/PrefetchLink";
import BookmarkButton from "@/components/BookmarkButton";
import { useHistory } from "@/lib/storage";

// Cùng một bộ nút ở mọi màn hình. Điện thoại: lưới 2 cột, "Đọc tiếp" và "Lưu" chiếm trọn hàng.
export default function ReadButtons({ slug, title, cover, first, last, base = "/truyen" }: {
  slug: string; title: string; cover: string; first?: string; last?: string; base?: string;
}) {
  const h = useHistory().find((x) => x.slug === slug);
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {h && (
        <Link
          href={`${base}/${slug}/${h.chapterSlug}`}
          className="img-fade order-first sm:order-1 col-span-2 truncate rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90 sm:col-span-1"
        >
          Đọc tiếp: {h.chapterTitle}
        </Link>
      )}
      {first && (
        <Link href={`${base}/${slug}/${first}`} className="rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90">
          Đọc từ đầu
        </Link>
      )}
      {last && (
        <Link href={`${base}/${slug}/${last}`} className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium hover:border-accent">
          Chương mới nhất
        </Link>
      )}
      {base === "/truyen" && <BookmarkButton slug={slug} title={title} cover={cover} />}
    </div>
  );
}
