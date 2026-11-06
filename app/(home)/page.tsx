import { getHomeSections, getStats } from "@/lib/api";
import { StoryGrid } from "@/components/StoryCard";
import ContinueReading from "@/components/ContinueReading";
import SectionTitle from "@/components/SectionTitle";
import Hero from "@/components/Hero";

export default async function Home() {
  const [sections, stats] = await Promise.all([getHomeSections(), getStats()]);
  return (
    <div className="space-y-8 sm:space-y-10">
      <Hero stats={stats} />
      <ContinueReading />
      {sections.map((s) => (
        <section key={s.id}>
          <SectionTitle title={s.title} href={s.viewAllUrl} />
          <StoryGrid stories={s.stories.slice(0, 12)} />
        </section>
      ))}
      {!sections.length && <p className="text-center text-muted">Không tải được dữ liệu, vui lòng thử lại sau.</p>}
    </div>
  );
}
