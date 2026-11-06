// Tải một bộ truyện đăng theo từng bài trên Blogspot về máy để đọc cá nhân.
//
// Cách dùng:
//   node scripts/crawl-blogspot.mjs <url-chuong-dau> <slug-thu-vien> "<Tên truyện>"
// Ví dụ:
//   node scripts/crawl-blogspot.mjs https://truyentinhcambuon.blogspot.com/2017/02/tan-gai-su-pham-chap-1.html tan-gai-su-pham "Tán Gái Sư Phạm"
//
// - Chỉ tải các bài có cùng tiền tố tên (…-chap-N.html), đi theo nút "Bài đăng mới hơn".
// - Tải chậm (mặc định 1,2 giây/bài), có thể chạy lại: chương đã tải sẽ được bỏ qua.
// - Chỉ lưu vào data/library/ trên máy bạn.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const [startUrl, slug, titleArg] = process.argv.slice(2);
if (!startUrl || !slug) {
  console.error('Thiếu tham số.\nDùng: node scripts/crawl-blogspot.mjs <url-chuong-dau> <slug> "<Tên truyện>"');
  process.exit(1);
}

const DELAY_MS = Number(process.env.CRAWL_DELAY_MS || 1200);
const MAX_CHAPTERS = Number(process.env.CRAWL_MAX || 2000);
const UA = "Mozilla/5.0 (personal reader; contact: local use only)";
const OUT = path.join(process.cwd(), "data", "library", slug);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function fetchHtml(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, "accept-language": "vi" } });
      if (res.status === 403 || res.status === 429) {
        throw new Error(`Trang nguồn từ chối truy cập (HTTP ${res.status}). Dừng, không cố vượt rào.`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (String(e.message).includes("Dừng")) throw e;
      if (i === tries) throw e;
      await sleep(2000 * i);
    }
  }
}

function parsePost(html, url) {
  const title = decode((html.match(/<h3 class='post-title[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
  const s = html.indexOf("class='post-body entry-content'");
  if (s < 0) throw new Error("Không tìm thấy nội dung bài viết: " + url);
  const start = html.indexOf(">", s) + 1;
  let end = html.indexOf("<div style='clear: both;'>", start);
  if (end < 0) end = html.indexOf("post-footer", start);
  const raw = html.slice(start, end);
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|h\d|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  const paragraphs = decode(text)
    .split(/\n+/)
    .map((p) => p.normalize("NFC").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const newer = html.match(/blog-pager-newer-link' href='([^']+)'/)?.[1];
  return { title, paragraphs, newer: newer ? decode(newer) : undefined };
}

// Tiền tố của loạt bài, ví dụ ".../2017/02/tan-gai-su-pham"
const m = startUrl.match(/^(.*?)-chap-(\d+)([^/]*)\.html/i);
if (!m) {
  console.error("URL không có dạng …-chap-N.html nên không biết cách nhận ra các chương cùng loạt.");
  process.exit(1);
}
const seriesHost = new URL(startUrl).host;
const seriesName = m[1].split("/").pop(); // tan-gai-su-pham
const isSameSeries = (u) => {
  try {
    const x = new URL(u);
    return x.host === seriesHost && new RegExp(`/${seriesName}-chap-\\d+[^/]*\\.html$`, "i").test(x.pathname);
  } catch {
    return false;
  }
};

await mkdir(path.join(OUT, "chapters"), { recursive: true });

const chapters = [];
let url = startUrl;
const seen = new Set();
let n = 0;

while (url && n < MAX_CHAPTERS) {
  if (seen.has(url)) break;
  seen.add(url);
  const num = Number(url.match(/-chap-(\d+)/i)?.[1] ?? n + 1);
  const chSlug = `chap-${num}`;
  const file = path.join(OUT, "chapters", `${chSlug}.json`);

  let title, paragraphs, newer;
  if (existsSync(file)) {
    const saved = JSON.parse(await readFile(file, "utf8"));
    ({ title, paragraphs } = saved);
    newer = saved.newer;
    console.log(`= ${chSlug} (đã có)`);
  } else {
    const html = await fetchHtml(url);
    ({ title, paragraphs, newer } = parsePost(html, url));
    await writeFile(file, JSON.stringify({ slug: chSlug, num, title, paragraphs, source: url, newer }, null, 1));
    console.log(`+ ${chSlug}  ${title}  (${paragraphs.length} đoạn)`);
    await sleep(DELAY_MS);
  }

  chapters.push({ slug: chSlug, num, title: title || `Chap ${num}`, words: paragraphs.join(" ").split(" ").length });
  n++;
  url = newer && isSameSeries(newer) ? newer : undefined;
}

const story = {
  slug,
  title: titleArg || seriesName,
  source: startUrl,
  type: "novel",
  chapters: chapters.sort((a, b) => a.num - b.num),
  updatedAt: new Date().toISOString(),
};
await writeFile(path.join(OUT, "story.json"), JSON.stringify(story, null, 1));
console.log(`\nXong: ${chapters.length} chương -> ${path.relative(process.cwd(), OUT)}`);
