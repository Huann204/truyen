import { notFound } from "next/navigation";
import Reader from "@/components/Reader";
import { getLibChapter, getLibStory, placeholderCover } from "@/lib/library";

type Props = { params: Promise<{ slug: string; chapter: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug, chapter } = await params;
  const [s, c] = await Promise.all([getLibStory(slug), getLibChapter(slug, chapter)]);
  return { title: s && c ? `${s.title} - ${c.title}` : "Không tìm thấy chương" };
}

export default async function LibraryChapterPage({ params }: Props) {
  const { slug, chapter } = await params;
  const [story, current] = await Promise.all([getLibStory(slug), getLibChapter(slug, chapter)]);
  if (!story || !current) notFound();

  const list = story.chapters; // tăng dần
  const idx = list.findIndex((c) => c.slug === chapter);
  const prev = idx > 0 ? list[idx - 1].slug : undefined;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1].slug : undefined;

  return (
    <Reader
      base="/thu-vien"
      slug={slug}
      title={story.title}
      cover={placeholderCover(story.title)}
      chapter={{ slug: current.slug, title: current.title, mediaType: "text" }}
      paragraphs={current.paragraphs}
      pages={[]}
      prev={prev}
      next={next}
      chapters={list.map((c) => ({ slug: c.slug, title: c.title }))}
    />
  );
}
