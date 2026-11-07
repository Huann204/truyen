import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-border py-8 text-center text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4">
        <Logo href="/" size="sm" showTagline />
        <p className="text-xs text-muted/80 mt-1">
          © {new Date().getFullYear()} KhoTruyện • Đọc truyện chữ &amp; truyện tranh online miễn phí
        </p>
      </div>
    </footer>
  );
}
