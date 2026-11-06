"use client";
import { useState } from "react";

// API không trả width/height ảnh -> giữ chỗ bằng khung tỉ lệ ~2:3 cho tới khi ảnh tải xong,
// tránh trang bị co giãn/nhảy khi từng ảnh hiện ra và tránh tải dồn cả chương một lúc.
export default function PageImage({ src, alt, eager, high }: { src: string; alt: string; eager?: boolean; high?: boolean }) {
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  return (
    <div className={`relative w-full bg-neutral-900 ${state === "loading" ? "aspect-[2/3]" : state === "error" ? "h-28" : ""}`}>
      {state === "loading" && <div className="absolute inset-0 animate-pulse bg-neutral-800" />}
      {state === "error" && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">Không tải được ảnh</div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={high ? "high" : "auto"}
        decoding="async"
        onLoad={() => setState("done")}
        onError={() => setState("error")}
        ref={(el) => { if (el?.complete && el.naturalWidth > 0) setState("done"); }}
        className={`block w-full transition-opacity duration-300 ${state === "done" ? "opacity-100" : "absolute inset-0 h-full object-contain opacity-0"}`}
      />
    </div>
  );
}
