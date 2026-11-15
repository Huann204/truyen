// Tách một truyện chữ có toàn bộ chương trong cùng một bài Blogspot.
// Cách dùng:
//   node scripts/crawl-single-post.mjs <url> <slug> "<Tên truyện>"

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [sourceUrl, slug, title] = process.argv.slice(2);
if (!sourceUrl || !slug || !title) {
  console.error('Dùng: node scripts/crawl-single-post.mjs <url> <slug> "<Tên truyện>"');
  process.exit(1);
}

const UA = "Mozilla/5.0 (personal reader; contact: local use only)";
const OUT = path.join(process.cwd(), "data", "library", slug);

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
    .map((paragraph) => paragraph.replace(/\s*\[next\]\s*$/i, "").trim())
    .filter(Boolean)
    .filter((paragraph) => !/^#?\s*Bạn đang đọc truyện tại\b/i.test(paragraph));
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "user-agent": UA, "accept-language": "vi-VN,vi;q=0.9" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Không tải được trang nguồn: HTTP ${response.status}`);
  return response.text();
}

const html = await fetchHtml(sourceUrl);
const authorHeadingIndex = html.search(/<h[1-6][^>]*>\s*Tác giả\s*:/i);
const bodyMarkers = [...html.matchAll(/<[^>]+\bclass=(['"])[^'"]*\bpost-body\b[^'"]*\1[^>]*>/gi)];
const bodyMarker = bodyMarkers.filter((match) => match.index < authorHeadingIndex).at(-1);
if (!bodyMarker) throw new Error("Không tìm thấy phần nội dung bài viết.");

const bodyStart = html.indexOf(">", bodyMarker.index) + 1;
const bodyEndCandidates = [
  html.indexOf("<div style='clear: both;'>", bodyStart),
  html.indexOf('<div style="clear: both;">', bodyStart),
  html.indexOf("class='post-footer", bodyStart),
  html.indexOf('class="post-footer', bodyStart),
].filter((index) => index > bodyStart);
const bodyEnd = bodyEndCandidates.length ? Math.min(...bodyEndCandidates) : html.length;
const postHtml = html.slice(bodyStart, bodyEnd);

const author = decodeHtml(
  (postHtml.match(/<h[1-6][^>]*>\s*Tác giả\s*:\s*([\s\S]*?)<\/h[1-6]>/i)?.[1] ?? "Đang cập nhật")
    .replace(/<[^>]+>/g, "")
).trim();

const headingPattern = /<h[1-6][^>]*>\s*Chap(?:ter)?\s*(\d+(?:\.\d+)?)\s*<\/h[1-6]>/gi;
const headings = [...postHtml.matchAll(headingPattern)];
if (!headings.length) throw new Error("Không tìm thấy tiêu đề chương dạng 'Chap N'.");

await mkdir(path.join(OUT, "chapters"), { recursive: true });
const chapters = [];

for (let index = 0; index < headings.length; index++) {
  const heading = headings[index];
  const num = Number(heading[1]);
  const chapterHtmlStart = heading.index + heading[0].length;
  const chapterHtmlEnd = headings[index + 1]?.index ?? postHtml.length;
  let chapterHtml = postHtml.slice(chapterHtmlStart, chapterHtmlEnd);
  if (index === headings.length - 1) {
    chapterHtml = chapterHtml.split(/Bộ truyện này tác giả đã ngừng viết!/i)[0];
  }
  const paragraphs = htmlToParagraphs(chapterHtml);
  const chapterSlug = `chap-${heading[1]}`;
  const chapterTitle = `Chap ${heading[1]}`;

  await writeFile(
    path.join(OUT, "chapters", `${chapterSlug}.json`),
    JSON.stringify({
      slug: chapterSlug,
      num,
      title: chapterTitle,
      mediaType: "text",
      paragraphs,
      source: `${sourceUrl}#${chapterSlug}`,
    }, null, 2),
    "utf8",
  );

  chapters.push({
    slug: chapterSlug,
    num,
    title: chapterTitle,
    words: paragraphs.join(" ").split(/\s+/).filter(Boolean).length,
  });
  console.log(`+ ${chapterSlug}: ${paragraphs.length} đoạn`);
}

const coverUrl = postHtml.match(/<img\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["'][^>]*>/i)?.[1];
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
  genres: ["Tình Cảm", "Học Đường", "Voz"],
  description: `${title} là truyện Voz của tác giả ${author}, gồm ${chapters.length} chương.`,
  source: sourceUrl,
  type: "novel",
  chapters: chapters.sort((a, b) => a.num - b.num),
  updatedAt: new Date().toISOString(),
};

await writeFile(path.join(OUT, "story.json"), JSON.stringify(story, null, 2), "utf8");
console.log(`\nXong: ${chapters.length} chương -> ${path.relative(process.cwd(), OUT)}`);
