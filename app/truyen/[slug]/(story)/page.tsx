import Link from "@/components/PrefetchLink";
import { notFound } from "next/navigation";
import { getStory, typePath, type Chapter } from "@/lib/api";
import Cover from "@/components/Cover";
import ChapterList from "@/components/ChapterList";
import Description from "@/components/Description";
import InfoGrid from "@/components/InfoGrid";
import ReadButtons from "@/components/ReadButtons";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const s = await getStory((await params).slug);
  if (!s) return { title: "Không tìm thấy truyện" };
  return {
    title: s.title,
    description: s.description?.replace(/\s+/g, " ").slice(0, 160),
    openGraph: { title: s.title, images: [s.cover] },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  const chapters = story.chapters as Chapter[];
  const first = chapters.at(-1)?.slug;
  const last = chapters[0]?.slug;
  const genres = (story.taxonomies ?? []).filter((t) => t.group === "genre");
  const authors = (story.contributors ?? []).filter((c) => c.role === "author" && !genres.some((g) => g.slug === c.slug));
  const artists = (story.contributors ?? []).filter((c) => c.role === "artist");
  const groups = (story.contributors ?? []).filter((c) => c.role === "group");
  const tags = (story.taxonomies ?? []).filter((t) => t.group === "tag");
  const kind = (story.taxonomies ?? []).find((t) => t.group === "content-type" || t.group === "content_type");
  const age = (story.taxonomies ?? []).find((t) => t.group === "content-rating" || t.group === "content_rating");
  const latest = chapters[0];

  // Tên người/nhóm bấm vào sẽ tìm các truyện liên quan
  const people = (list: { name: string; slug: string }[]) =>
    list.map((p, i) => (
      <span key={p.slug}>
        {i > 0 && ", "}
        <Link href={`/tim-kiem?q=${encodeURIComponent(p.name)}`} className="hover:text-accent">{p.name}</Link>
      </span>
    ));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
        <div className="relative mx-auto h-64 w-44 shrink-0 overflow-hidden rounded-xl shadow-lg sm:mx-0 sm:h-72 sm:w-52"><Cover src={story.cover} alt={story.title} sizes="208px" priority /></div>
        <div className="min-w-0 flex-1">
          <h1 className="text-center text-xl font-bold sm:text-left sm:text-2xl">{story.title}</h1>
          <InfoGrid
            items={[
              { label: "Tác giả", value: authors.length ? people(authors) : story.author || "Đang cập nhật" },
              ...(artists.length ? [{ label: "Họa sĩ", value: people(artists) }] : []),
              ...(groups.length ? [{ label: "Nhóm dịch", value: people(groups) }] : []),
              { label: "Tình trạng", value: story.status || "Đang cập nhật" },
              { label: "Số chương", value: `${chapters.length.toLocaleString("vi-VN")} chương` },
              { label: "Lượt xem", value: (story.views ?? 0).toLocaleString("vi-VN") },
              { label: "Đánh giá", value: story.rating ? `${story.rating}/5 (${(story.votes ?? 0).toLocaleString("vi-VN")} bình chọn)` : "Chưa có đánh giá" },
              { label: "Loại", value: <Link href={`/${typePath(story.type)}`} className="hover:text-accent">{kind?.name ?? (story.type === "manga" ? "Truyện tranh" : "Truyện chữ")}</Link> },
              { label: "Độ tuổi", value: story.isAdult || age?.slug === "adult" ? "18+" : "Mọi lứa tuổi" },
              ...(latest ? [{ label: "Mới nhất", value: latest.numberText || latest.title }] : []),
              { label: "Cập nhật", value: story.updateTime },
            ]}
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <Link key={g.slug} href={`/the-loai/${g.slug}`} className="rounded-full border border-border px-2.5 py-0.5 text-xs hover:border-accent hover:text-accent">{g.name}</Link>
            ))}
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted">Tags:</span>
              {tags.map((t) => (
                <Link key={t.slug} href={`/tim-kiem?q=${encodeURIComponent(t.name)}`} className="rounded-full bg-border/60 px-2.5 py-0.5 text-xs text-muted hover:text-accent">#{t.name}</Link>
              ))}
            </div>
          )}
          <div className="mt-4">
            <ReadButtons slug={slug} title={story.title} cover={story.cover} first={first} last={last} />
          </div>
        </div>
      </div>

      {story.description && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-bold">Giới thiệu</h2>
          <Description text={story.description} />
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">Danh sách chương</h2>
        <ChapterList
          slug={slug}
          chapters={chapters.map((c) => ({ slug: c.slug, title: c.title, numberText: c.numberText, date: c.date, isNew: c.isNew }))}
        />
      </section>
    </div>
  );
}
