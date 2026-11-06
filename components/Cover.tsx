import { assetUrl } from "@/lib/assets";

// Ảnh bìa tải thẳng từ server gốc (lấp đầy khung cha có position: relative)
export default function Cover({ src, alt, priority = false, className = "" }: {
  src: string; alt: string; sizes?: string; priority?: boolean; className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={assetUrl(src)}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`img-fade absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
}
