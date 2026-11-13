// Tải tiểu thuyết/truyện chữ từ các nguồn chuẩn TruyenFull / chambersbar.ie về đọc offline
//
// Cách dùng:
//   node scripts/crawl-truyenfull.mjs <url-truyen-hoac-chuong> [slug] "[Tên truyện]"
// Ví dụ:
//   node scripts/crawl-truyenfull.mjs https://chambersbar.ie/truyen/ranh-gioi/chuong-1 ranh-gioi "Ranh Giới"
//   node scripts/crawl-truyenfull.mjs https://chambersbar.ie/truyen/ranh-gioi
//
// Tuỳ chọn (flags):
//   --limit=N     Chỉ tải N chương đầu tiên (tiện test)
//   --delay=N     Thời gian nghỉ giữa các request (ms, mặc định 500)

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));

const targetUrlArg = args[0];
if (!targetUrlArg) {
  console.error('Thiếu tham số URL.\nCách dùng: node scripts/crawl-truyenfull.mjs <url-truyen-hoac-chuong> [slug] "[Tên hiển thị]"');
  process.exit(1);
}

// Flags
const limitFlag = flags.find((f) => f.startsWith('--limit='));
const limit = limitFlag ? parseInt(limitFlag.split('=')[1], 10) : 0;

const delayFlag = flags.find((f) => f.startsWith('--delay='));
const DELAY_MS = delayFlag ? parseInt(delayFlag.split('=')[1], 10) : 600;

// Xử lý URL truyện
let cleanUrl = targetUrlArg.split('?')[0].replace(/\/+$/, '');
// Nếu người dùng truyền vào link chương (ví dụ .../chuong-1), tự động cắt về link truyện
cleanUrl = cleanUrl.replace(/\/chuong-\d+.*$/i, '');

const parsedUrl = new URL(cleanUrl);
const BASE_HOST = `${parsedUrl.protocol}//${parsedUrl.host}`;
const defaultSlug = cleanUrl.split('/').filter(Boolean).pop() || 'truyen';

const userSlug = args[1] || defaultSlug;
const userTitle = args[2];

const OUT = path.join(process.cwd(), 'data', 'library', userSlug);
const COVERS_DIR = path.join(process.cwd(), 'public', 'covers');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

async function fetchWithRetry(url, headers = {}, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent': UA,
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
          ...headers,
        },
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === tries) throw e;
      await sleep(1000 * i);
    }
  }
}

async function downloadCover(coverUrl, slug) {
  if (!coverUrl) return undefined;
  try {
    await mkdir(COVERS_DIR, { recursive: true });
    const coverPath = path.join(COVERS_DIR, `${slug}.webp`);
    if (existsSync(coverPath)) {
      console.log(`[Ảnh bìa] Đã tồn tại: /covers/${slug}.webp`);
      return `/covers/${slug}.webp`;
    }

    console.log(`[Ảnh bìa] Đang tải: ${coverUrl}`);
    const res = await fetch(coverUrl, {
      headers: { 'user-agent': UA, referer: BASE_HOST },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).webp({ quality: 85 }).toFile(coverPath);
    console.log(`[Ảnh bìa] Đã lưu webp tại: /covers/${slug}.webp`);
    return `/covers/${slug}.webp`;
  } catch (err) {
    console.warn(`[Ảnh bìa] Không tải được bìa (${err.message}). Sẽ dùng placeholder SVG.`);
    return undefined;
  }
}

function parseParagraphs(html) {
  const start = html.indexOf('id="chapterContent"');
  if (start === -1) {
    // Thử fallback selector
    const fb = html.match(/class=["'][^"']*chapter-c(?:ontent)?[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (!fb) return [];
    return cleanTextToParagraphs(fb[1]);
  }
  const contentStart = html.indexOf('>', start) + 1;
  const contentEnd = html.indexOf('</div>', contentStart);
  if (contentEnd === -1) return [];
  const raw = html.slice(contentStart, contentEnd);
  return cleanTextToParagraphs(raw);
}

function cleanTextToParagraphs(raw) {
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return decodeEntities(text)
    .split(/\n+/)
    .map((p) => p.normalize('NFC').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractChapterListFromHtml(html) {
  const listMatches = [...html.matchAll(/<a[^>]*href=["']([^"']*\/chuong-(\d+)[^"']*)["'][^>]*title=["']([^"']+)["']/gi)];
  const chapters = [];
  const seen = new Set();

  for (const m of listMatches) {
    const url = m[1].startsWith('http') ? m[1] : `${BASE_HOST}${m[1].startsWith('/') ? '' : '/'}${m[1]}`;
    const num = parseInt(m[2], 10);
    const title = decodeEntities(m[3]).replace(/<[^>]+>/g, '').trim();
    const chSlug = `chuong-${num}`;

    if (!seen.has(chSlug)) {
      seen.add(chSlug);
      chapters.push({ slug: chSlug, num, title, url });
    }
  }

  return chapters;
}

async function main() {
  console.log('==============================================');
  console.log('       CÀO TRUYỆN CHỮ (TRUYENFULL ENGINE)      ');
  console.log('==============================================');
  console.log(`URL truyện: ${cleanUrl}`);
  console.log(`Slug: ${userSlug}`);

  await mkdir(path.join(OUT, 'chapters'), { recursive: true });

  console.log('\n[1/3] Đang lấy thông tin bộ truyện...');
  const storyHtml = await fetchWithRetry(cleanUrl);
  if (!storyHtml) {
    console.error(`Không thể truy cập ${cleanUrl}`);
    process.exit(1);
  }

  // Tiêu đề
  const titleM = storyHtml.match(/<h1[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
                 storyHtml.match(/<h3[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i) ||
                 storyHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let title = userTitle;
  if (!title && titleM) {
    title = decodeEntities(titleM[1]).replace(/<[^>]+>/g, '').trim();
  }
  if (!title) title = userSlug;

  // Tác giả
  const authorM = storyHtml.match(/Tác giả:[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
                  storyHtml.match(/class=["']author["'][^>]*>([\s\S]*?)<\/(?:a|span|div)>/i);
  const author = authorM ? decodeEntities(authorM[1]).replace(/<[^>]+>/g, '').trim() : undefined;

  // Thể loại
  const genresBoxM = storyHtml.match(/Thể loại:[\s\S]*?<\/div>/i);
  const genres = [];
  if (genresBoxM) {
    const gMatches = [...genresBoxM[0].matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)];
    for (const gm of gMatches) {
      const gName = decodeEntities(gm[1]).replace(/<[^>]+>/g, '').trim();
      if (gName) genres.push(gName);
    }
  }

  // Trạng thái
  const statusM = storyHtml.match(/Trạng thái:[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);
  const status = statusM ? decodeEntities(statusM[1]).replace(/<[^>]+>/g, '').trim() : undefined;

  // Ảnh bìa
  const coverM = storyHtml.match(/<div class=["']book["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i) ||
                 storyHtml.match(/<div class=["']story-thumb["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i) ||
                 storyHtml.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
  const remoteCoverUrl = coverM ? coverM[1].trim() : undefined;
  const localCover = await downloadCover(remoteCoverUrl, userSlug);

  // Mô tả
  const descM = storyHtml.match(/class=["']desc-text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                storyHtml.match(/id=["']story-description["'][^>]*>([\s\S]*?)<\/div>/i);
  const description = descM ? decodeEntities(descM[1]).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim() : '';

  console.log(`- Tên truyện: ${title}`);
  if (author) console.log(`- Tác giả: ${author}`);
  if (genres.length > 0) console.log(`- Thể loại: ${genres.join(', ')}`);
  if (status) console.log(`- Trạng thái: ${status}`);

  // Tìm các chương từ danh sách phân trang
  console.log('\n[2/3] Đang quét danh sách chương qua các trang...');
  const allChaptersMap = new Map();

  // Đọc trang 1
  for (const ch of extractChapterListFromHtml(storyHtml)) {
    allChaptersMap.set(ch.slug, ch);
  }

  // Quét các trang kế tiếp (page=2, page=3...)
  let page = 2;
  while (true) {
    const pageUrl = `${cleanUrl}?page=${page}`;
    const pageHtml = await fetchWithRetry(pageUrl);
    if (!pageHtml) break;

    const pageChapters = extractChapterListFromHtml(pageHtml);
    if (pageChapters.length === 0) break;

    let addedNew = 0;
    for (const ch of pageChapters) {
      if (!allChaptersMap.has(ch.slug)) {
        allChaptersMap.set(ch.slug, ch);
        addedNew++;
      }
    }

    console.log(`  + Trang ${page}: tìm thấy ${pageChapters.length} chương (mới: ${addedNew})`);
    if (addedNew === 0) break;
    page++;
    await sleep(300);
  }

  let chapterList = Array.from(allChaptersMap.values()).sort((a, b) => a.num - b.num);
  console.log(`=> Tổng cộng phát hiện: ${chapterList.length} chương.`);

  if (limit > 0 && limit < chapterList.length) {
    console.log(`(Đang bật cờ --limit=${limit}, chỉ tải ${limit} chương đầu)`);
    chapterList = chapterList.slice(0, limit);
  }

  console.log('\n[3/3] Đang tải nội dung từng chương...');
  const storyChapterMeta = [];

  for (let i = 0; i < chapterList.length; i++) {
    const ch = chapterList[i];
    const chFile = path.join(OUT, 'chapters', `${ch.slug}.json`);
    const progress = `[${i + 1}/${chapterList.length}]`;

    let chapterData;
    if (existsSync(chFile)) {
      try {
        chapterData = JSON.parse(await readFile(chFile, 'utf8'));
        console.log(`${progress} = ${ch.slug}: ${ch.title} (đã có sẵn)`);
      } catch {
        // đọc lỗi thì tải lại
      }
    }

    if (!chapterData || !chapterData.paragraphs || chapterData.paragraphs.length === 0) {
      try {
        const chHtml = await fetchWithRetry(ch.url);
        if (!chHtml) {
          console.warn(`${progress} ! Không tải được ${ch.url}`);
          continue;
        }

        const paragraphs = parseParagraphs(chHtml);
        chapterData = {
          slug: ch.slug,
          num: ch.num,
          title: ch.title,
          mediaType: 'text',
          paragraphs,
          source: ch.url,
        };

        await writeFile(chFile, JSON.stringify(chapterData, null, 1), 'utf8');
        console.log(`${progress} + ${ch.slug}: ${ch.title} (${paragraphs.length} đoạn)`);
        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`${progress} X Lỗi tải ${ch.slug}: ${err.message}`);
        continue;
      }
    }

    const words = (chapterData.paragraphs || []).join(' ').split(/\s+/).filter(Boolean).length;
    storyChapterMeta.push({
      slug: ch.slug,
      num: ch.num,
      title: ch.title,
      words,
    });
  }

  // Lưu story.json
  const storyData = {
    slug: userSlug,
    title,
    cover: localCover,
    author,
    description,
    status,
    genres,
    source: cleanUrl,
    type: 'novel',
    chapters: storyChapterMeta.sort((a, b) => a.num - b.num),
    updatedAt: new Date().toISOString(),
  };

  await writeFile(path.join(OUT, 'story.json'), JSON.stringify(storyData, null, 1), 'utf8');
  console.log('\n==============================================');
  console.log(`HOÀN TẤT! Đã lưu truyện vào: data/library/${userSlug}`);
  console.log(`Tổng số chương đã lưu: ${storyChapterMeta.length}/${chapterList.length}`);
  console.log(`Xem tại: /thu-vien/${userSlug}`);
  console.log('==============================================');
}

main().catch((err) => {
  console.error('Lỗi nghiêm trọng:', err);
  process.exit(1);
});
