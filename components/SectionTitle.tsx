import Link from "@/components/PrefetchLink";

export default function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
        <span className="h-5 w-1.5 rounded-full bg-gradient-to-b from-accent to-orange-400" />
        {title}
      </h2>
      {href && <Link href={href} className="shrink-0 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20">Xem tất cả ›</Link>}
    </div>
  );
}
