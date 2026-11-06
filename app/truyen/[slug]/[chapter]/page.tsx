import { notFound } from "next/navigation";
import { bodyParagraphs, getChapter, type Chapter } from "@/lib/api";
import Reader from "@/components/Reader";
import { assetUrl } from "@/lib/assets";

type Props = { params: Promise<{ slug: string; chapter: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug, chapter } = await params;
  const r = await getChapter(slug, chapter);
  if (!r) return { title: "Không tìm thấy chương" };
  return { title: `${r.story.title} - ${r.current.title}` };
}

export default async function ChapterPage({ params }: Props) {
  const { slug, chapter } = await params;
  const r = await getChapter(slug, chapter);
  if (!r) notFound();
  const { story, current } = r;
  const list = story.chapters as Chapter[];
  // API trả danh sách mới -> cũ, nên chương trước = phần tử kế tiếp trong mảng
  const idx = list.findIndex((c) => c.slug === chapter);
  const prev = list[idx + 1]?.slug;
  const next = list[idx - 1]?.slug;

  return (
    <Reader
      slug={slug}
      title={story.title}
      cover={story.cover}
      chapter={{ slug: current.slug, title: current.title, mediaType: current.mediaType }}
      paragraphs={current.mediaType === "text" ? bodyParagraphs(current) : []}
      pages={current.mediaType === "image" ? current.pages.filter((p) => p.url).map((p) => ({ id: p.id, url: assetUrl(p.url) })) : []}
      prev={prev}
      next={next}
      chapters={list.map((c) => ({ slug: c.slug, title: c.title }))}
    />
  );
}
