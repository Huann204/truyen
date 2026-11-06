"use client";
import { useSyncExternalStore } from "react";

export type HistoryItem = {
  slug: string;
  title: string;
  cover: string;
  chapterSlug: string;
  chapterTitle: string;
  /** "/truyen" (mặc định) hoặc "/thu-vien" */
  base?: string;
  at: number;
};
export type BookmarkItem = { slug: string; title: string; cover: string; at: number };

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

const cache = new Map<string, { raw: string | null; val: unknown[] }>();
function snapshot<T>(key: string): T[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(key); } catch {}
  const c = cache.get(key);
  if (c && c.raw === raw) return c.val as T[];
  const val = read<T>(key);
  cache.set(key, { raw, val });
  return val;
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) {
  listeners.add(l);
  window.addEventListener("storage", l);
  return () => { listeners.delete(l); window.removeEventListener("storage", l); };
}
const EMPTY: never[] = [];

function useList<T>(key: string): T[] {
  return useSyncExternalStore(subscribe, () => snapshot<T>(key), () => EMPTY as T[]);
}
function write<T>(key: string, v: T[]) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  emit();
}

export const useHistory = () => useList<HistoryItem>("history");
export const useBookmarks = () => useList<BookmarkItem>("bookmarks");

export function saveHistory(item: Omit<HistoryItem, "at">) {
  const list = read<HistoryItem>("history").filter((h) => h.slug !== item.slug);
  list.unshift({ ...item, at: Date.now() });
  write("history", list.slice(0, 100));
}
export function removeHistory(slug: string) {
  write("history", read<HistoryItem>("history").filter((h) => h.slug !== slug));
}
export function clearHistory() { write("history", []); }

export function toggleBookmark(b: Omit<BookmarkItem, "at">) {
  const list = read<BookmarkItem>("bookmarks");
  if (list.some((x) => x.slug === b.slug)) write("bookmarks", list.filter((x) => x.slug !== b.slug));
  else write("bookmarks", [{ ...b, at: Date.now() }, ...list]);
}

// true sau khi hydrate xong ở client (server luôn false) -> tránh chớp "trống" trước khi đọc localStorage
export function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}
