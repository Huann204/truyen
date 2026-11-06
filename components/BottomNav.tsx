"use client";
import Link from "@/components/PrefetchLink";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { href: "/", label: "Trang chủ", icon: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/the-loai", label: "Thể loại", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { href: "/tu-sach", label: "Tủ sách", icon: "M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" },
  { href: "/lich-su", label: "Lịch sử", icon: "M12 8v5l3 2M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" },
];

const menu = [
  { href: "/truyen-chu", label: "Truyện chữ", emoji: "📖" },
  { href: "/truyen-tranh", label: "Truyện tranh", emoji: "🖼️" },
  { href: "/truyen-hentai", label: "Truyện 18+", emoji: "🔞" },
  { href: "/truyen-hot", label: "Truyện hot", emoji: "🔥" },
  { href: "/truyen-pho-bien", label: "Phổ biến", emoji: "⭐" },
  { href: "/doc-nhieu", label: "Đọc nhiều", emoji: "👀" },
  { href: "/truyen-hoan-thanh", label: "Hoàn thành", emoji: "✅" },
  { href: "/dang-phat-hanh", label: "Đang ra", emoji: "🆕" },
  { href: "/sap-ra-mat", label: "Sắp ra mắt", emoji: "⏳" },
];

export default function BottomNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // Ẩn ở trang đọc để không che nội dung
  if (/^\/truyen\/[^/]+\/[^/]+/.test(path)) return null;
  const cell = "flex w-full flex-col items-center gap-0.5 py-2 text-[11px]";
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-card p-4 pb-24 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <div className="grid grid-cols-3 gap-3">
              {menu.map((m) => (
                <Link key={m.href} href={m.href} onClick={() => setOpen(false)} className="flex flex-col items-center gap-1 rounded-2xl bg-background p-3 text-xs font-medium active:scale-95">
                  <span className="text-2xl">{m.emoji}</span>
                  {m.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
        <ul className="grid grid-cols-5">
          {items.map((i) => {
            const active = !open && (i.href === "/" ? path === "/" : path.startsWith(i.href));
            return (
              <li key={i.href}>
                <Link href={i.href} onClick={() => setOpen(false)} className={`${cell} ${active ? "text-accent" : "text-muted"}`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={i.icon} /></svg>
                  {i.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setOpen((v) => !v)} className={`${cell} ${open ? "text-accent" : "text-muted"}`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              Menu
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
