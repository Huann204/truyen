import { notFound } from "next/navigation";
import ListView from "@/components/ListView";
import { getGenre } from "@/lib/api";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string; sort?: string }> };

export async function generateMetadata({ params }: Props) {
  const g = await getGenre((await params).slug);
  return { title: g ? `Truyện ${g.name}` : "Thể loại" };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const g = await getGenre(slug);
  if (!g) notFound();
  return <ListView title={`Thể loại: ${g.name}`} base={`/the-loai/${slug}`} params={{ genres: slug, sort: "updated_desc" }} searchParams={await searchParams} showGenres={false} />;
}
