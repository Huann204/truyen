// Script cào truyện tranh (Manga/Manhwa/Manhua) về Thư viện cá nhân
// Hỗ trợ nguồn NetTruyen (nettruyen.cx) và tự động fallback sang mirror ảnh chất lượng cao
//
// Cách dùng:
//   node scripts/crawl-manga.mjs <url-truyen> [slug] [ten-truyen] [--limit=N] [--start=N]
// Ví dụ:
//   node scripts/crawl-manga.mjs https://nettruyen.cx/truyen-tranh/berserk berserk "Berserk"

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.slice(2).split("=");
      return [k, v === undefined ? true : v];
    })
);

const targetUrl = args[0] || "https://nettruyen.cx/truyen-tranh/berserk";
const userSlug = args[1] || targetUrl.split("/").filter(Boolean).pop();
const userTitle = args[2];
const LIMIT = flags.limit ? parseInt(flags.limit, 10) : Infinity;
const START_INDEX = flags.start ? parseInt(flags.start, 10) : 0;
const DELAY_MS = flags.delay ? parseInt(flags.delay, 10) : 300;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const OUT = path.join(process.cwd(), "data", "library", userSlug);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, "accept-language": "vi,en-US;q=0.9,en;q=0.8" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === tries) throw e;
      await sleep(1000 * i);
    }
  }
}

// Cào thông tin chi tiết bộ truyện từ NetTruyen
async function fetchMangaDetails(url) {
  console.log(`Đang lấy thông tin truyện từ: ${url}...`);
  const html = await fetchWithRetry(url);

  // Tiêu đề
  const titleMatch = html.match(/<h1 class="title-detail">([^<]+)<\/h1>/i);
  const title = userTitle || (titleMatch ? titleMatch[1].trim() : "Berserk");

  // Ảnh bìa
  const coverMatch = html.match(/<div class="col-xs-4 col-image">\s*<img src="([^"]+)"/i) ||
                     html.match(/property="og:image" content="([^"]+)"/i);
  const cover = coverMatch ? coverMatch[1] : "";

  // Tác giả
  const authorMatch = html.match(/href="\/tac-gia\/[^"]+">([^<]+)<\/a>/i);
  const author = authorMatch ? authorMatch[1].trim() : "Kentarō Miura";

  // Tình trạng
  const statusMatch = html.match(/<li class="status row">[\s\S]*?<p class="col-xs-8">([^<]+)<\/p>/i);
  const status = statusMatch ? statusMatch[1].trim() : "Đang tiến hành";

  // Thể loại trong thẻ li.kind.row
  const genres = [];
  const kindBlock = html.match(/<li class="kind row">([\s\S]*?)<\/li>/i)?.[1] || "";
  const genreRegex = /href="\/the-loai\/[^"]+">([^<]+)<\/a>/gi;
  let gm;
  while ((gm = genreRegex.exec(kindBlock)) !== null) {
    if (!genres.includes(gm[1])) genres.push(gm[1]);
  }

  // Tóm tắt nội dung
  const descMatch = html.match(/<div class="detail-content">[\s\S]*?<p>([\s\S]*?)<\/p>/i);
  const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";

  // Danh sách chương trong thẻ <select class="select-chapter"> hoặc trong list-chapter
  const chapterList = [];
  const seenSlugs = new Set();

  const selectRegex = /<option value="([^"]+)"[^>]*>Chapter <!-- -->([0-9.]+)(?:<!-- -->: ([^<]+))?<\/option>/gi;
  let sm;
  while ((sm = selectRegex.exec(html)) !== null) {
    const slug = sm[1];
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      const num = parseFloat(sm[2]);
      const subTitle = sm[3] ? sm[3].trim() : "";
      chapterList.push({
        slug,
        num,
        title: subTitle ? `Chapter ${sm[2]}: ${subTitle}` : `Chapter ${sm[2]}`,
        url: `https://nettruyen.cx/truyen-tranh/${userSlug}/${slug}`,
      });
    }
  }

  if (chapterList.length === 0) {
    const listRegex = /<div class="col-xs-5 chapter">\s*<a class="" href="(\/truyen-tranh\/[^\/]+\/([a-z0-9.-]+))"[^>]*>[\s\S]*?Chapter <!-- -->([0-9.]+)(?:<!-- -->: ([^<]+))?<\/div>/gi;
    let lm;
    while ((lm = listRegex.exec(html)) !== null) {
      const slug = lm[2];
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        const num = parseFloat(lm[3]);
        const subTitle = lm[4] ? lm[4].trim() : "";
        chapterList.push({
          slug,
          num,
          title: subTitle ? `Chapter ${lm[3]}: ${subTitle}` : `Chapter ${lm[3]}`,
          url: `https://nettruyen.cx${lm[1]}`,
        });
      }
    }
  }

  // Sắp xếp theo thứ tự chương tăng dần: Chapter 0, 1, 2, ..., 375
  chapterList.sort((a, b) => a.num - b.num);

  return { title, cover, author, status, genres, description, chapterList };
}

// Tải ảnh bìa về thư mục public để hiển thị ổn định offline
async function saveCoverImage(coverUrl, slug) {
  if (!coverUrl) return "";
  try {
    const publicCoversDir = path.join(process.cwd(), "public", "covers");
    await mkdir(publicCoversDir, { recursive: true });
    const localCoverPath = path.join(publicCoversDir, `${slug}.webp`);

    const res = await fetch(coverUrl, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      await writeFile(localCoverPath, buffer);
      console.log(`✓ Đã lưu ảnh bìa tại public/covers/${slug}.webp`);
      return `/covers/${slug}.webp`;
    }
  } catch (e) {
    console.warn(`Không tải được ảnh bìa: ${e.message}, sử dụng URL gốc.`);
  }
  return coverUrl;
}

// Lấy danh sách map chương của mirror berserktruyen.com để fallback khi cần
async function loadMirrorMap() {
  console.log("Đang nạp sitemap từ mirror berserktruyen.com để dự phòng ảnh...");
  const mirrorMap = new Map();

  for (const sitemapUrl of [
    "https://berserktruyen.com/post-sitemap.xml",
    "https://berserktruyen.com/post-sitemap2.xml",
  ]) {
    try {
      const text = await fetchWithRetry(sitemapUrl, 2);
      const locRegex = /<loc>(https:\/\/berserktruyen\.com\/[^<]+)<\/loc>/g;
      let m;
      while ((m = locRegex.exec(text)) !== null) {
        const url = m[1];
        const cm = url.match(/chap-(\d+(?:-\d+)?|\d+(?:\.\d+)?)/i);
        if (cm) {
          const part = cm[1];
          if (part.includes("-")) {
            const [main, sub] = part.split("-");
            mirrorMap.set(parseFloat(`${main}.${sub}`), url);
            if (!mirrorMap.has(parseFloat(main))) {
              mirrorMap.set(parseFloat(main), url);
            }
          } else {
            mirrorMap.set(parseFloat(part), url);
          }
        }
      }
    } catch (e) {
      console.warn(`Không tải được sitemap ${sitemapUrl}: ${e.message}`);
    }
  }

  // Bổ sung các chương được ghép trong bản dịch của nhóm
  if (!mirrorMap.has(0) && mirrorMap.has(1)) mirrorMap.set(0, mirrorMap.get(1));
  if (!mirrorMap.has(2) && mirrorMap.has(1)) mirrorMap.set(2, mirrorMap.get(1));
  if (!mirrorMap.has(26) && mirrorMap.has(25)) mirrorMap.set(26, mirrorMap.get(25));
  if (!mirrorMap.has(62) && mirrorMap.has(61)) mirrorMap.set(62, mirrorMap.get(61));

  console.log(`Đã nạp ${mirrorMap.size} chương từ mirror dự phòng.`);
  return mirrorMap;
}

// Cào các trang ảnh của 1 chương
async function fetchChapterPages(chapter, mirrorMap) {
  let pages = [];

  // 1. Thử lấy từ NetTruyen
  try {
    const html = await fetchWithRetry(chapter.url, 2);
    const regex = /<img[^>]+class="lozad"[^>]+(?:data-src|src)="([^"]+)"/gi;
    let m;
    const rawUrls = [];
    while ((m = regex.exec(html)) !== null) {
      if (m[1].includes("uploads") || m[1].includes("chapter")) {
        rawUrls.push(m[1]);
      }
    }

    if (rawUrls.length > 0) {
      let isWorking = false;
      try {
        const testRes = await fetch(rawUrls[0], {
          method: "HEAD",
          headers: { Referer: "https://nettruyen.cx/", "user-agent": UA },
          signal: AbortSignal.timeout(3000),
        });
        if (testRes.ok) isWorking = true;
      } catch {}

      if (isWorking) {
        pages = rawUrls.map((url, i) => ({ id: i + 1, url }));
      }
    }
  } catch {}

  // 2. Nếu NetTruyen lỗi 502/504 hoặc không có ảnh, dùng mirror berserktruyen.com
  if (pages.length === 0 && mirrorMap && mirrorMap.has(chapter.num)) {
    const mirrorUrl = mirrorMap.get(chapter.num);
    try {
      const mirrorHtml = await fetchWithRetry(mirrorUrl, 2);
      const imgRegex = /<img[^>]+src="([^">]+)"/gi;
      let im;
      const mUrls = [];
      while ((im = imgRegex.exec(mirrorHtml)) !== null) {
        const src = im[1];
        if (
          src.includes("/uploads/") &&
          !src.includes("logo") &&
          !src.includes("banner") &&
          !src.includes("avatar") &&
          !src.includes("cropped-") &&
          !src.includes("flatsome")
        ) {
          mUrls.push(src);
        }
      }
      if (mUrls.length > 0) {
        pages = mUrls.map((url, i) => ({ id: i + 1, url }));
      }
    } catch (e) {
      // ignore
    }
  }

  return pages;
}

async function main() {
  console.log("=== BẮT ĐẦU CÀO TRUYỆN TRANH ===");
  console.log(`URL: ${targetUrl}`);
  console.log(`Slug lưu: ${userSlug}`);
  console.log(`Thư mục đích: ${OUT}\n`);

  await mkdir(path.join(OUT, "chapters"), { recursive: true });

  const details = await fetchMangaDetails(targetUrl);
  console.log(`Tìm thấy truyện: ${details.title}`);
  console.log(`Tác giả: ${details.author}`);
  console.log(`Tổng số chương: ${details.chapterList.length}`);

  // Lưu ảnh bìa
  const localCover = await saveCoverImage(details.cover, userSlug);
  const coverToUse = localCover || details.cover;

  const mirrorMap = await loadMirrorMap();

  // Đọc danh sách chương đã cào trước đó nếu có
  const storyJsonPath = path.join(OUT, "story.json");
  let existingStory = null;
  if (existsSync(storyJsonPath)) {
    try {
      existingStory = JSON.parse(await readFile(storyJsonPath, "utf8"));
    } catch {}
  }

  const chaptersMeta = existingStory?.chapters ? [...existingStory.chapters] : [];
  const processedSlugs = new Set();
  for (const c of chaptersMeta) {
    if (c.pages && c.pages > 0) processedSlugs.add(c.slug);
  }

  let count = 0;
  const targetChapters = details.chapterList.slice(START_INDEX);

  for (let idx = 0; idx < targetChapters.length; idx++) {
    if (count >= LIMIT) {
      console.log(`Đã đạt giới hạn --limit=${LIMIT}, dừng cào.`);
      break;
    }

    const chap = targetChapters[idx];
    const chapFilePath = path.join(OUT, "chapters", `${chap.slug}.json`);

    // Bỏ qua nếu chương này đã cào thành công có trang ảnh
    if (processedSlugs.has(chap.slug) && existsSync(chapFilePath)) {
      continue;
    }

    process.stdout.write(`[${idx + 1}/${targetChapters.length}] Đang cào ${chap.title}... `);

    try {
      const pages = await fetchChapterPages(chap, mirrorMap);
      const chapterData = {
        slug: chap.slug,
        num: chap.num,
        title: chap.title,
        mediaType: "image",
        pages,
        source: chap.url,
      };

      await writeFile(chapFilePath, JSON.stringify(chapterData, null, 2), "utf8");

      // Cập nhật metadata chương
      const metaIdx = chaptersMeta.findIndex((c) => c.slug === chap.slug);
      const metaItem = { slug: chap.slug, num: chap.num, title: chap.title, pages: pages.length };
      if (metaIdx >= 0) {
        chaptersMeta[metaIdx] = metaItem;
      } else {
        chaptersMeta.push(metaItem);
      }

      if (pages.length > 0) {
        processedSlugs.add(chap.slug);
        console.log(`✓ Xong (${pages.length} trang ảnh)`);
      } else {
        console.log(`⚠ 0 trang ảnh (chương có thể chưa được cập nhật)`);
      }
      count++;

      // Ghi cập nhật story.json định kỳ
      if (count % 5 === 0 || count === LIMIT || idx === targetChapters.length - 1) {
        chaptersMeta.sort((a, b) => a.num - b.num);
        const storyData = {
          slug: userSlug,
          title: details.title,
          cover: coverToUse,
          author: details.author,
          status: details.status,
          genres: details.genres,
          description: details.description,
          type: "manga",
          source: targetUrl,
          chapters: chaptersMeta,
          updatedAt: new Date().toISOString(),
        };
        await writeFile(storyJsonPath, JSON.stringify(storyData, null, 2), "utf8");
      }

      if (DELAY_MS > 0) await sleep(DELAY_MS);
    } catch (err) {
      console.log(`✗ Lỗi: ${err.message}`);
    }
  }

  // Ghi lần cuối
  chaptersMeta.sort((a, b) => a.num - b.num);
  const finalStoryData = {
    slug: userSlug,
    title: details.title,
    cover: coverToUse,
    author: details.author,
    status: details.status,
    genres: details.genres,
    description: details.description,
    type: "manga",
    source: targetUrl,
    chapters: chaptersMeta,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(storyJsonPath, JSON.stringify(finalStoryData, null, 2), "utf8");

  console.log(`\n🎉 HOÀN THÀNH!`);
  console.log(`Đã cào ${chaptersMeta.length} chương vào data/library/${userSlug}/`);
  console.log(`Đọc ngay trên web tại: http://localhost:3000/thu-vien/${userSlug}`);
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
