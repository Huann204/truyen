"use client";
import Link from "next/link";
import { useState } from "react";

// Mặc định chỉ prefetch FULL khi người dùng rê chuột / chạm vào.
// Truyền prefetch={true} cho các nút chính (Đọc từ đầu, Chương sau) để tải sẵn ngay khi chúng hiện ra.
export default function PrefetchLink({ children, prefetch, ...props }: React.ComponentProps<typeof Link>) {
  const [hot, setHot] = useState(false);
  const on = () => setHot(true);
  return (
    <Link {...props} prefetch={prefetch ?? (hot ? true : undefined)} onMouseEnter={on} onTouchStart={on} onFocus={on}>
      {children}
    </Link>
  );
}
