import React from "react";
import Link from "@/components/PrefetchLink";

interface LogoMarkProps {
  className?: string;
  size?: number | string;
}

/**
 * LogoMark: Biểu tượng đặc trưng của KhoTruyện
 * Kết hợp hình tượng trang sách mở đang lật (truyện chữ & truyện tranh),
 * tạo hình chữ 'K' cách điệu vươn lên cùng ngôi sao ma thuật lấp lánh.
 */
export function LogoMark({ className = "w-8 h-8", size }: LogoMarkProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm transition-transform duration-300 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoMarkGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF385C" />
          <stop offset="45%" stop-color="#FF5A36" />
          <stop offset="100%" stop-color="#FFA114" />
        </linearGradient>

        <linearGradient id="logoMarkGradSecondary" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#E11D48" />
          <stop offset="100%" stop-color="#FB7185" />
        </linearGradient>

        <linearGradient id="logoMarkGradWing" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stop-color="#FFA826" />
          <stop offset="100%" stop-color="#FF4336" />
        </linearGradient>
      </defs>

      <g transform="translate(160, 160)">
        {/* Cánh gáy sách bên trái (thân dọc chữ K) */}
        <path
          d="M -130,-115 C -130,-130 -115,-140 -98,-135 L -42,-120 C -30,-116 -20,-106 -20,-92 L -20,105 C -20,122 -35,134 -52,130 L -108,114 C -122,110 -130,98 -130,84 Z"
          fill="url(#logoMarkGradSecondary)"
        />
        {/* Ánh sáng trang sách bên trong */}
        <path
          d="M -118,-95 C -118,-106 -108,-113 -96,-110 L -46,-97 C -38,-95 -32,-88 -32,-79 L -32,80 C -32,91 -42,98 -54,95 L -104,82 C -113,80 -118,72 -118,63 Z"
          fill="white"
          fillOpacity="0.22"
        />

        {/* Cánh trang sách phía trên bên phải (nhánh trên chữ K) */}
        <path
          d="M -10,-15 C -10,-28 0,-38 12,-42 L 105,-82 C 124,-90 144,-74 140,-53 L 125,-10 C 121,-1 113,6 103,9 L 22,34 C 4,40 -10,26 -10,9 Z"
          fill="url(#logoMarkGradWing)"
        />
        <path
          d="M 12,-20 L 95,-55 C 107,-60 119,-50 117,-37 L 107,-7 L 22,20 Z"
          fill="white"
          fillOpacity="0.25"
        />

        {/* Cánh trang sách phía dưới bên phải (nhánh dưới chữ K) */}
        <path
          d="M -5,45 C 8,38 24,42 34,51 L 115,112 C 129,122 124,144 107,148 L 60,155 C 48,157 37,151 30,142 L -20,78 C -30,64 -18,48 -5,45 Z"
          fill="url(#logoMarkGradPrimary)"
        />

        {/* Dải ruy băng đánh dấu trang trung tâm */}
        <path
          d="M -26,-135 C -26,-140 -20,-144 -15,-142 L 0,-136 C 6,-134 10,-128 10,-122 L 10,132 C 10,140 2,146 -6,144 L -20,140 C -24,138 -26,134 -26,130 Z"
          fill="url(#logoMarkGradPrimary)"
          opacity="0.95"
        />

        {/* Ngôi sao lấp lánh (sức hút kỳ ảo của những câu chuyện) */}
        <g transform="translate(122, -108) scale(0.95)">
          <path
            d="M 0,-28 C 2,-10 10,-2 28,0 C 10,2 2,10 0,28 C -2,10 -10,2 -28,0 C -10,-2 -2,-10 0,-28 Z"
            fill="#FFAE33"
          />
          <circle cx="0" cy="0" r="5" fill="#FFFFFF" />
        </g>
        <g transform="translate(155, -55) scale(0.45)">
          <path
            d="M 0,-24 C 2,-8 8,-2 24,0 C 8,2 2,8 0,24 C -2,8 -8,2 -24,0 C -8,-2 -2,-8 0,-24 Z"
            fill="#FFAA40"
          />
        </g>
      </g>
    </svg>
  );
}

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  href?: string;
  showTagline?: boolean;
}

export default function Logo({
  className = "",
  variant = "full",
  size = "md",
  href,
  showTagline = false,
}: LogoProps) {
  const sizeMap = {
    xs: { icon: "w-5 h-5", text: "text-base", sub: "text-[10px]" },
    sm: { icon: "w-6 h-6", text: "text-lg", sub: "text-[11px]" },
    md: { icon: "w-7 h-7 sm:w-8 sm:h-8", text: "text-xl sm:text-2xl", sub: "text-xs" },
    lg: { icon: "w-9 h-9 sm:w-10 sm:h-10", text: "text-2xl sm:text-3xl", sub: "text-xs" },
    xl: { icon: "w-12 h-12 sm:w-14 sm:h-14", text: "text-3xl sm:text-4xl", sub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <span className={`inline-flex items-center gap-2 font-black tracking-tight select-none ${className}`}>
      <LogoMark className={currentSize.icon} />
      {variant === "full" && (
        <span className="flex flex-col leading-none">
          <span className={`flex items-center font-black ${currentSize.text}`}>
            <span className="inline-block bg-gradient-to-r from-accent to-orange-400 bg-clip-text text-transparent pr-[2px]">
              Kho
            </span>
            <span className="text-foreground transition-colors group-hover:text-accent">
              Truyện
            </span>
          </span>
          {showTagline && (
            <span className={`mt-0.5 font-medium tracking-wider uppercase text-muted ${currentSize.sub}`}>
              Thế giới truyện online
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
