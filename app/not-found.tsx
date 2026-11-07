import Link from "@/components/PrefetchLink";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
      <p className="text-5xl font-black text-accent">404</p>
      <p className="mt-2 text-lg font-bold">Không tìm thấy trang</p>
      <p className="mt-1 text-sm text-muted">Trang này không tồn tại hoặc đã bị gỡ.</p>
      <Link href="/" className="mt-5 inline-block rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90">Về trang chủ</Link>
    </div>
  );
}
