import Link from "@/components/PrefetchLink";
import { getGenres } from "@/lib/api";

export const metadata = { title: "Thể loại" };

export default async function GenresPage() {
  const genres = await getGenres();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Thể loại</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {genres.map((g) => (
          <Link key={g.slug} href={`/the-loai/${g.slug}`} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 hover:border-accent hover:text-accent">
            <span>{g.name}</span>
            <span className="text-xs text-muted">{g.count.toLocaleString("vi-VN")}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
