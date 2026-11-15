// Tải truyện Blogspot có một trang mục lục và mỗi chương là một bài riêng.
// Cách dùng:
//   node scripts/crawl-indexed-posts.mjs <url-muc-luc> <slug> "<Tên truyện>"

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [indexUrl, slug, title] = process.argv.slice(2);
if (!indexUrl || !slug || !title) {
  console.error('Dùng: node scripts/crawl-indexed-posts.mjs <url-muc-luc> <slug> "<Tên truyện>"');
  process.exit(1);
}

const UA = "Mozilla/5.0 (personal reader; contact: local use only)";
const DELAY_MS = Number(process.env.CRAWL_DELAY_MS || 1_000);
const OUT = path.join(process.cwd(), "data", "library", slug);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function extractPostBody(html) {
  const markers = [...html.matchAll(/<[^>]+\bclass=(['"])[^'"]*\bpost-body\b[^'"]*\1[^>]*>/gi)];
  const candidates = markers.map((marker) => {
    const start = html.indexOf(">", marker.index) + 1;
    const ends = [
      html.indexOf("<div style='clear: both;'>", start),
      html.indexOf('<div style="clear: both;">', start),
      html.indexOf("class='post-footer", start),
      html.indexOf('class="post-footer', start),
    ].filter((index) => index > start);
    const end = ends.length ? Math.min(...ends) : html.length;
    return html.slice(start, end);
  });
  const body = candidates.sort((a, b) => b.length - a.length)[0];
  if (!body) throw new Error("Không tìm thấy nội dung bài viết.");
  return body;
}

function htmlToParagraphs(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:div|p|li|blockquote|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  return decodeHtml(text)
    .split(/\n+/)
    .map((paragraph) => paragraph.normalize("NFC").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((paragraph) => !/^#?\s*Bạn đang đọc truyện tại\b/i.test(paragraph))
    .filter((paragraph) => !/^(?:Chap Trước|MỤC LỤC|Chap Sau)$/i.test(paragraph));
}

function cleanParagraphs(paragraphs) {
  const unrelatedArticle = paragraphs.findIndex((paragraph) =>
    /^Ở đâu đó trên thế giới này.*Số phận/i.test(paragraph)
    || /^Nhật ký yêu đời của cô gái mắc bệnh ung thư/i.test(paragraph)
  );
  const storyParagraphs = unrelatedArticle >= 0
    ? paragraphs.slice(0, unrelatedArticle)
    : paragraphs;

  return storyParagraphs.filter((paragraph) => !/^<\/?[a-z]*$/i.test(paragraph));
}

async function fetchHtml(url, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": UA, "accept-language": "vi-VN,vi;q=0.9" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === tries) throw error;
      await sleep(1_500 * attempt);
    }
  }
}

function chapterInfo(href, anchorText) {
  const pathname = new URL(href).pathname;
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefix = new RegExp(`/${escapedSlug}-(.+)\\.html$`, "i").exec(pathname)?.[1];
  if (!prefix) return null;

  if (/^mo-dau$/i.test(prefix)) {
    return { slug: "mo-dau", num: 0, title: "Mở đầu" };
  }
  const chapter = /^chap-(\d+(?:\.\d+)?)$/i.exec(prefix);
  if (chapter) {
    return { slug: `chap-${chapter[1]}`, num: Number(chapter[1]), title: `Chap ${chapter[1]}` };
  }
  const extra = /^ngoai-truyen-(\d+)$/i.exec(prefix);
  if (extra) {
    return { slug: `ngoai-truyen-${extra[1]}`, num: 1_000 + Number(extra[1]), title: `Ngoại truyện ${extra[1]}` };
  }

  console.warn(`Bỏ qua link không nhận diện được: ${anchorText} (${href})`);
  return null;
}

const indexHtml = await fetchHtml(indexUrl);
const indexBody = extractPostBody(indexHtml);
const sourceHost = new URL(indexUrl).host;
const chaptersBySlug = new Map();

for (const match of indexBody.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
  const href = new URL(decodeHtml(match[1]), indexUrl).href;
  if (new URL(href).host !== sourceHost) continue;
  const anchorText = decodeHtml(match[2].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
  const info = chapterInfo(href, anchorText);
  if (info) chaptersBySlug.set(info.slug, { ...info, url: href });
}

const chapterLinks = [...chaptersBySlug.values()].sort((a, b) => a.num - b.num);
if (!chapterLinks.length) throw new Error("Không tìm thấy link chương trong mục lục.");
console.log(`Tìm thấy ${chapterLinks.length} phần.`);

const indexParagraphs = htmlToParagraphs(indexBody);
const authorLine = indexParagraphs.find((paragraph) => /^Tác giả\s*:/i.test(paragraph));
const author = authorLine?.replace(/^Tác giả\s*:\s*/i, "").trim() || "Đang cập nhật";
const description = indexParagraphs
  .slice(0, indexParagraphs.findIndex((paragraph) => /^Tác giả\s*:/i.test(paragraph)))
  .filter((paragraph) => paragraph.length > 30)
  .join(" ");

await mkdir(path.join(OUT, "chapters"), { recursive: true });
const chapters = [];

for (let index = 0; index < chapterLinks.length; index++) {
  const chapter = chapterLinks[index];
  const chapterFile = path.join(OUT, "chapters", `${chapter.slug}.json`);
  if (existsSync(chapterFile)) {
    const saved = JSON.parse(await readFile(chapterFile, "utf8"));
    const paragraphs = cleanParagraphs(saved.paragraphs);
    if (paragraphs.length !== saved.paragraphs.length) {
      await writeFile(chapterFile, JSON.stringify({ ...saved, paragraphs }, null, 2), "utf8");
    }
    chapters.push({
      slug: saved.slug,
      num: saved.num,
      title: saved.title,
      words: paragraphs.join(" ").split(/\s+/).filter(Boolean).length,
    });
    console.log(`[${index + 1}/${chapterLinks.length}] ${chapter.title}: đã có`);
    continue;
  }

  const html = await fetchHtml(chapter.url);
  const paragraphs = cleanParagraphs(htmlToParagraphs(extractPostBody(html)));

  await writeFile(
    chapterFile,
    JSON.stringify({
      slug: chapter.slug,
      num: chapter.num,
      title: chapter.title,
      mediaType: "text",
      paragraphs,
      source: chapter.url,
    }, null, 2),
    "utf8",
  );

  chapters.push({
    slug: chapter.slug,
    num: chapter.num,
    title: chapter.title,
    words: paragraphs.join(" ").split(/\s+/).filter(Boolean).length,
  });
  console.log(`[${index + 1}/${chapterLinks.length}] ${chapter.title}: ${paragraphs.length} đoạn`);
  await sleep(DELAY_MS);
}

const coverUrl = indexBody.match(/<img\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["'][^>]*>/i)?.[1];
let cover;
if (coverUrl) {
  try {
    const response = await fetch(decodeHtml(coverUrl), { headers: { "user-agent": UA } });
    if (response.ok) {
      const publicCovers = path.join(process.cwd(), "public", "covers");
      await mkdir(publicCovers, { recursive: true });
      await sharp(Buffer.from(await response.arrayBuffer()))
        .webp({ quality: 85 })
        .toFile(path.join(publicCovers, `${slug}.webp`));
      cover = `/covers/${slug}.webp`;
    }
  } catch (error) {
    console.warn(`Không tải được ảnh bìa: ${error.message}`);
  }
}

const story = {
  slug,
  title,
  ...(cover ? { cover } : {}),
  author,
  status: "Hoàn thành",
  genres: ["Tình Cảm", "Gia Đình", "Voz"],
  description: description || `${title} là truyện Voz của tác giả ${author}.`,
  source: indexUrl,
  type: "novel",
  chapters,
  updatedAt: new Date().toISOString(),
};

await writeFile(path.join(OUT, "story.json"), JSON.stringify(story, null, 2), "utf8");
console.log(`\nXong: ${chapters.length} phần -> ${path.relative(process.cwd(), OUT)}`);
