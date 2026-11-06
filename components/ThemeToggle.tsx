"use client";

export default function ThemeToggle() {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  }
  return (
    <button onClick={toggle} aria-label="Đổi giao diện sáng/tối" className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-accent/10">
      <span className="dark:hidden">🌙</span>
      <span className="hidden dark:inline">☀️</span>
    </button>
  );
}
