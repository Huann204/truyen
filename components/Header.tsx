import Link from "@/components/PrefetchLink";
import { SHOW_ADULT } from "@/lib/config";
import SearchBox from "./SearchBox";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";

const nav = [
  { href: "/truyen-chu", label: "Truyện chữ", mobile: true },
  { href: "/truyen-tranh", label: "Truyện tranh", mobile: true },
  { href: "/truyen-hentai", label: "18+", mobile: true },
  { href: "/truyen-hot", label: "Hot", mobile: true },
  { href: "/the-loai", label: "Thể loại" },
  { href: "/doc-nhieu", label: "Đọc nhiều" },
  { href: "/truyen-hoan-thanh", label: "Hoàn thành" },
  { href: "/tu-sach", label: "Tủ sách" },
  { href: "/lich-su", label: "Lịch sử" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4">
        <Logo href="/" />
        <SearchBox />
        <ThemeToggle />
      </div>
      <nav className="no-scrollbar mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm sm:flex">
        {nav.filter((n) => SHOW_ADULT || n.href !== "/truyen-hentai").map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition hover:bg-accent/10 hover:text-accent ${n.label === "18+" ? "text-accent" : ""}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
