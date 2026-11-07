import { notFound } from "next/navigation";
import { SHOW_ADULT } from "@/lib/config";
import ListView, { LISTS } from "@/components/ListView";

type Props = { params: Promise<{ kind: string }>; searchParams: Promise<{ page?: string; sort?: string; genre?: string }> };

export async function generateMetadata({ params }: Props) {
  const { kind } = await params;
  return { title: LISTS[kind]?.title };
}

export default async function Page({ params, searchParams }: Props) {
  const { kind } = await params;
  const cfg = LISTS[kind];
  if (!cfg || (kind === "truyen-hentai" && !SHOW_ADULT)) notFound();
  return <ListView title={cfg.title} base={`/${kind}`} params={cfg.params} searchParams={await searchParams} />;
}
