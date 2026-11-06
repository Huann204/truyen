"use client";
import Link from "next/link";
import { useState } from "react";

// Chỉ prefetch FULL dữ liệu trang khi người dùng rê chuột / chạm vào
export default function PrefetchLink({ children, ...props }: React.ComponentProps<typeof Link>) {
  const [hot, setHot] = useState(false);
  const on = () => setHot(true);
  return (
    <Link {...props} prefetch={hot ? true : undefined} onMouseEnter={on} onTouchStart={on} onFocus={on}>
      {children}
    </Link>
  );
}
