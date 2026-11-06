import { notFound } from "next/navigation";
import ChapterList from "@/components/ChapterList";
import ReadButtons from "@/components/ReadButtons";
import { getLibStory, placeholderCover } from "@/lib/library";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const s = await getLibStory((await params).slug);
  return { title: s?.title ?? "Không tìm thấy truyện" };
}

export default async function LibraryStoryPage({ params }: Props) {
  const { slug } = await params;
  const story = await getLibStory(slug);
  if (!story) notFound();

  // ChapterList mong danh sách mới -> cũ (giống API)
  const newestFirst = [...story.chapters].sort((a, b) => b.num - a.num);
  const first = story.chapters[0]?.slug;
  const last = newestFirst[0]?.slug;
  const cover = placeholderCover(story.title);
  const words = story.chapters.reduce((n, c) => n + (c.words ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
        <div className="relative mx-auto h-64 w-44 shrink-0 overflow-hidden rounded-xl shadow-lg sm:mx-0 sm:h-72 sm:w-52">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={story.title} className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-center text-xl font-bold sm:text-left sm:text-2xl">{story.title}</h1>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm min-[440px]:grid-cols-2">
            <div><dt className="inline text-muted">Số chương: </dt><dd className="inline font-semibold">{story.chapters.length.toLocaleString("vi-VN")} chương</dd></div>
            <div><dt className="inline text-muted">Số từ: </dt><dd className="inline font-semibold">~{words.toLocaleString("vi-VN")}</dd></div>
            <div><dt className="inline text-muted">Loại: </dt><dd className="inline font-semibold">Truyện chữ (tải về máy)</dd></div>
            {story.updatedAt && (
              <div><dt className="inline text-muted">Tải lúc: </dt><dd className="inline font-semibold">{new Date(story.updatedAt).toLocaleString("vi-VN")}</dd></div>
            )}
          </dl>
          <div className="mt-4">
            <ReadButtons slug={slug} title={story.title} cover={cover} first={first} last={last} base="/thu-vien" />
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">Danh sách chương</h2>
        <ChapterList
          slug={slug}
          base="/thu-vien"
          chapters={newestFirst.map((c) => ({ slug: c.slug, title: c.title }))}
        />
      </section>
    </div>
  );
}
