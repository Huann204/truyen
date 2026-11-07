"use client";

// Hiện khi một trang bị lỗi (ví dụ API nguồn tạm thời không phản hồi) thay vì trang trắng
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
      <p className="text-lg font-bold">Có lỗi khi tải trang</p>
      <p className="mt-2 text-sm text-muted">Nguồn dữ liệu có thể đang chậm hoặc tạm thời không phản hồi.</p>
      <button onClick={reset} className="mt-5 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
        Thử lại
      </button>
    </div>
  );
}
