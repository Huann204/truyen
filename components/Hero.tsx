import Link from "@/components/PrefetchLink";

type Stats = Record<string, number>;

// Ảnh banner lấy trực tiếp từ khotruyen.site
const BANNER = "https://khotruyen.site/_nuxt/hero-banner.Bq-DzJHd.webp";
const MARQUEE = ["Kho truyện khổng lồ", "Truyện chữ & truyện tranh", "Miễn phí trọn đời", "Cập nhật mỗi ngày", "Lưu tủ sách · Đọc tiếp"];

export default function Hero({ stats }: { stats: Stats | null }) {
  const fmt = (n: number) => n.toLocaleString("vi-VN");
  const items: [string, string][] = stats
    ? [
        [fmt(stats.totalStories), "Tổng truyện"],
        [fmt(stats.novelStories), "Truyện chữ"],
        [fmt(stats.mangaStories + stats.hentaiStories), "Truyện tranh"],
        [fmt(stats.updatedToday), "Mới hôm nay"],
      ]
    : [];

  return (
    <section className="relative flex flex-col overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-xl sm:block">
      {/* Mobile: ảnh nhân vật nằm phía trên, mờ dần xuống nền. Desktop: ảnh làm nền cả banner */}
      <div className="relative h-52 shrink-0 sm:absolute sm:inset-0 sm:h-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BANNER} alt="" className="absolute inset-0 h-full w-full object-cover object-[88%_center] sm:object-right" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent sm:bg-gradient-to-r sm:from-black/70 sm:via-black/20 sm:to-transparent" />
        <div aria-hidden className="absolute inset-0 hidden bg-gradient-to-t from-black/40 via-transparent to-transparent sm:block" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur sm:hidden">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400" /> Cập nhật mỗi ngày
        </span>
      </div>

      <div className="relative -mt-10 px-5 pb-6 sm:mt-0 sm:min-h-[28rem] sm:px-8 sm:pb-20 sm:pt-8 lg:px-10">
        <span className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400" /> Cập nhật mỗi ngày · Đọc miễn phí
        </span>
        <h1 className="text-balance text-[1.7rem] font-black leading-[1.15] tracking-tight sm:mt-4 sm:max-w-xl sm:text-5xl">
          Kho Truyện Khổng Lồ
          <span className="block text-orange-500">Đọc Miễn Phí Trọn Đời</span>
        </h1>
        <p className="mt-2 max-w-md text-sm text-white/80 sm:mt-3 sm:max-w-[46%] sm:text-base lg:max-w-md">
          Hàng ngàn bộ truyện chữ và truyện tranh chất lượng cao, cập nhật liên tục. Lưu tủ sách, đọc tiếp đúng chỗ đang dở.
        </p>

        {items.length > 0 && (
          <div className="mt-5 grid grid-cols-4 gap-2 sm:mt-6 sm:flex sm:gap-x-8">
            {items.map(([v, l]) => (
              <div key={l} className="rounded-xl bg-white/5 px-1 py-2 text-center ring-1 ring-white/10 sm:bg-transparent sm:p-0 sm:text-left sm:ring-0">
                <div className="text-base font-extrabold text-orange-500 sm:text-3xl">{v}</div>
                <div className="text-[10px] font-medium text-white/80 sm:text-xs">{l}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:flex">
          <Link href="/truyen-chu" className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-neutral-900 shadow-md hover:bg-white/90 sm:rounded-lg sm:px-6">Khám phá ngay</Link>
          <Link href="/truyen-tranh" className="rounded-xl border border-white/40 px-4 py-3 text-center text-sm font-bold hover:bg-white/10 sm:rounded-lg sm:px-6">Truyện tranh</Link>
        </div>
      </div>

      {/* dải chữ cam chạy ngang */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 py-3 sm:absolute sm:inset-x-0 sm:bottom-0">
        <div className="marquee flex w-max whitespace-nowrap text-xs font-bold uppercase sm:text-sm">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 gap-10 pr-10" aria-hidden={k === 1}>
              {MARQUEE.map((t) => (
                <span key={t} className="flex items-center gap-10">
                  {t}
                  <span className="opacity-60">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
