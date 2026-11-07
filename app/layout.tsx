import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Noto_Serif } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SHOW_ADULT } from "@/lib/config";
import BottomNav from "@/components/BottomNav";

const sans = Be_Vietnam_Pro({ variable: "--font-body", subsets: ["latin", "latin-ext", "vietnamese"], weight: ["400", "500", "600", "700", "800", "900"], display: "swap" });
const serif = Noto_Serif({ variable: "--font-reader-serif", subsets: ["latin", "latin-ext", "vietnamese"], display: "swap" });

// maximumScale=1: iPhone không tự phóng to khi chạm vào ô nhập (vẫn giữ chữ 14px gọn)
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1 };

export const metadata: Metadata = {
  title: { default: "KhoTruyện - Đọc truyện chữ, truyện tranh online", template: "%s | KhoTruyện" },
  description: "Đọc truyện chữ và truyện tranh online miễn phí, cập nhật nhanh mỗi ngày.",
};

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-1 mx-auto w-full max-w-6xl px-3 py-4 pb-24 sm:px-4 sm:py-6 sm:pb-8">{children}</main>
        <Footer />
        <BottomNav showAdult={SHOW_ADULT} />
      </body>
    </html>
  );
}
