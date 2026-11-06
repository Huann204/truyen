import type { ReactNode } from "react";

const ICONS: Record<string, string> = {
  "Tác giả": "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  "Họa sĩ": "M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3",
  "Nhóm dịch": "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 11a2.5 2.5 0 1 0 0-5M17 20a5 5 0 0 0-2-4",
  "Tình trạng": "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  "Số chương": "M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2zM12 6.5v13",
  "Lượt xem": "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  "Đánh giá": "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  "Loại": "M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01",
  "Độ tuổi": "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  "Mới nhất": "M5 21V4M5 4h11l-2 4 2 4H5",
  "Cập nhật": "M5 5h14v15H5zM5 10h14M9 3v4M15 3v4",
};

export type InfoItem = { label: string; value: ReactNode };

// Không khung: icon + "Nhãn: giá trị", các cột đều nhau (1 cột điện thoại nhỏ, 2 cột, 3 cột máy tính)
export default function InfoGrid({ items }: { items: InfoItem[] }) {
  return (
    <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm min-[440px]:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 items-start gap-2">
          <svg viewBox="0 0 24 24" className="mt-[3px] h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={ICONS[it.label] ?? ICONS["Loại"]} />
          </svg>
          <div className="min-w-0 leading-snug">
            <dt className="inline text-muted">{it.label}: </dt>
            <dd className="inline break-words font-semibold">{it.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
