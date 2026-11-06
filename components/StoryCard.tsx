import Link from "@/components/PrefetchLink";
import Cover from "./Cover";
import type { Story } from "@/lib/api";

export default function StoryCard({ story }: { story: Story }) {
  const latest = story.chapters?.[0];
  return (
    <Link href={`/truyen/${story.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-border shadow-sm ring-1 ring-black/5">
        <Cover src={story.cover} alt={story.title} sizes="(max-width:640px) 33vw, (max-width:1024px) 20vw, 180px" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
        {latest?.num != null && (
          <span className="absolute bottom-1.5 left-2 right-2 truncate text-[11px] font-medium text-white">
            {latest.numberText ?? `Chương ${latest.num}`}
          </span>
        )}
        {story.isAdult && <span className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-red-400 backdrop-blur">18+</span>}
        {story.status === "Hoàn thành" && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">FULL</span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug group-hover:text-accent sm:text-sm">{story.title}</h3>
    </Link>
  );
}

export function StoryGrid({ stories }: { stories: Story[] }) {
  if (!stories.length) return <p className="py-10 text-center text-muted">Không có truyện nào.</p>;
  return (
    <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-5 md:grid-cols-5 lg:grid-cols-6">
      {stories.map((s) => <StoryCard key={s.id} story={s} />)}
    </div>
  );
}
