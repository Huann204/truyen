"use client";
import { useState } from "react";

// Chỉ hiện vài dòng đầu, bấm "Xem thêm" mới mở hết
export default function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  // Quyết định theo độ dài chữ (không đo DOM) nên không bị nhảy bố cục sau khi tải
  const long = text.length > 220 || text.split("\n").length > 4;
  return (
    <div>
      <p className={`whitespace-pre-line text-sm leading-relaxed ${!open && long ? "line-clamp-4" : ""}`}>{text}</p>
      {long && (
        <button onClick={() => setOpen((v) => !v)} className="mt-2 text-sm font-medium text-accent hover:underline">
          {open ? "Thu gọn ▲" : "Xem thêm ▼"}
        </button>
      )}
    </div>
  );
}
