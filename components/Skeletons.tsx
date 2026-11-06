// Skeleton hiện NGAY khi bấm (không delay/fade) và có kích thước khớp trang thật -> không nhảy bố cục
const bar = "animate-pulse rounded-md bg-border";

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-5 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className={`${bar} aspect-[3/4] rounded-xl`} />
          <div className={`${bar} mt-2 h-[18px] w-full`} />
          <div className={`${bar} mt-1.5 h-[18px] w-2/3`} />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div>
      <div className={`${bar} mb-1 h-8 w-48`} />
      <div className={`${bar} mb-4 h-5 w-24`} />
      <div className="mb-3 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`${bar} h-8 w-24 shrink-0 rounded-full`} />)}
      </div>
      <div className={`${bar} mb-5 h-12 w-full rounded-lg`} />
      <GridSkeleton count={24} />
    </div>
  );
}

export function StorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
        <div className={`${bar} mx-auto h-64 w-44 shrink-0 rounded-xl sm:mx-0 sm:h-72 sm:w-52`} />
        <div className="min-w-0 flex-1">
          <div className={`${bar} mx-auto h-8 w-3/4 sm:mx-0`} />
          {/* lưới thông tin: icon + dòng chữ, giống bố cục thật (1/2/3 cột) */}
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 min-[440px]:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`${bar} h-4 w-4 shrink-0 rounded`} />
                <div className={`${bar} h-4 w-4/5`} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${bar} h-6 w-16 rounded-full`} />)}
          </div>
          {/* nút: 2 cột trên điện thoại, một hàng trên máy tính */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
            <div className={`${bar} h-10 sm:w-28`} />
            <div className={`${bar} h-10 sm:w-36`} />
            <div className={`${bar} col-span-2 h-10 sm:w-44`} />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className={`${bar} mb-3 h-6 w-28`} />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className={`${bar} h-5 w-full`} />)}
        </div>
      </div>
      <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className={`${bar} h-9 w-full`} />)}
      </div>
    </div>
  );
}

export function ReaderSkeleton() {
  // Khớp bố cục trang đọc thật: tiêu đề, hàng nút chuyển chương (desktop), thanh dưới cố định (mobile)
  const nav = (
    <div className="hidden items-center justify-center gap-2 py-3 sm:flex">
      <div className={`${bar} h-10 w-32`} />
      <div className={`${bar} h-10 w-48`} />
      <div className={`${bar} h-10 w-32`} />
    </div>
  );
  return (
    <div className="pb-16 sm:pb-0">
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-card/95 px-3 py-2 sm:hidden">
        <div className={`${bar} h-10 w-12`} />
        <div className={`${bar} h-10 flex-1`} />
        <div className={`${bar} h-10 w-12`} />
        <div className={`${bar} h-10 w-12`} />
      </div>
      <div className="mb-3 flex flex-col items-center gap-1">
        <div className={`${bar} h-7 w-1/2`} />
        <div className={`${bar} h-5 w-1/3`} />
      </div>
      {nav}
      <div className="mx-auto max-w-3xl space-y-4 rounded-xl border border-border bg-card px-4 py-6 sm:px-10 sm:py-8">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className={`${bar} h-5 ${i % 5 === 4 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
      {nav}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div className={`${bar} h-[32.5rem] w-full rounded-3xl sm:h-[28rem]`} />
      <div><div className={`${bar} mb-3 h-7 w-56`} /><GridSkeleton count={6} /></div>
      <div><div className={`${bar} mb-3 h-7 w-56`} /><GridSkeleton count={6} /></div>
    </div>
  );
}

export function RowsSkeleton() {
  return (
    <div>
      <div className={`${bar} mb-4 h-8 w-40`} />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${bar} h-24 rounded-lg`} />)}
      </div>
    </div>
  );
}

export function ShelfSkeleton() {
  return (
    <div>
      <div className={`${bar} mb-4 h-8 w-40`} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}><div className={`${bar} aspect-[3/4] rounded-lg`} /><div className={`${bar} mt-2 h-4 w-3/4`} /></div>
        ))}
      </div>
    </div>
  );
}

export function GenresSkeleton() {
  return (
    <div>
      <div className={`${bar} mb-4 h-8 w-40`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 24 }).map((_, i) => <div key={i} className={`${bar} h-11 rounded-lg`} />)}
      </div>
    </div>
  );
}
