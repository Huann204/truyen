"use client";
import { useState, useSyncExternalStore } from "react";

function useConfirmed() {
  return useSyncExternalStore(
    (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); },
    () => { try { return localStorage.getItem("age18") === "1"; } catch { return true; } },
    () => true,
  );
}

export default function AgeGate() {
  const confirmed = useConfirmed();
  const [done, setDone] = useState(false);
  if (confirmed || done) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-w-sm rounded-xl bg-card p-6 text-center">
        <h2 className="text-xl font-bold">Cảnh báo nội dung 18+</h2>
        <p className="mt-2 text-sm text-muted">Website có chứa nội dung dành cho người trưởng thành. Bạn xác nhận đã đủ 18 tuổi?</p>
        <div className="mt-5 flex gap-2">
          <button onClick={() => { try { localStorage.setItem("age18", "1"); } catch {} setDone(true); }} className="flex-1 rounded-lg bg-accent py-2 font-semibold text-white">Tôi đủ 18 tuổi</button>
          <a href="https://www.google.com" className="flex-1 rounded-lg border border-border py-2">Rời đi</a>
        </div>
      </div>
    </div>
  );
}
