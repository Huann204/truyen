// Script cào truyện từ doctruyenvoz.com
// Cách dùng:
//   node scripts/crawl-doctruyenvoz.mjs <url-index> [slug] "[Tên truyện]"
// Ví dụ:
//   node scripts/crawl-doctruyenvoz.mjs https://www.doctruyenvoz.com/2015/02/full-truyen-yeu-nham-chi-hai-duoc-nham-em-gai.html yeu-nham-chi-hai "Yêu Nhầm Chị Hai Được Nhầm Em Gái"
//
// Flags:
//   --delay=N   Thời gian nghỉ giữa các batch request (ms, mặc định 1000)

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));

const indexUrl = args[0];
if (!indexUrl) {
  console.error('Thiếu URL trang index.\nDùng: node scripts/crawl-doctruyenvoz.mjs <url-index> [slug] "[Tên truyện]"');
  process.exit(1);
}

const delayFlag = flags.find((f) => f.startsWith('--delay='));
const DELAY_MS = delayFlag ? parseInt(delayFlag.split('=')[1], 10) : 1000;

const defaultSlug = indexUrl.split('/').pop().replace(/\.html$/, '').replace(/^full-truyen-/, '') || 'truyen';
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

async function fetchWithRetry(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent': UA,
          'accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'accept-language': 'vi,en-US;q=0.9',
          'referer': 'https://www.doctruyenvoz.com/',
        },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === tries) throw e;
      console.warn(`  Thử lại lần ${i + 1}: ${e.message}`);
      await sleep(2000 * i);
    }
  }
}

async function downloadCover(coverUrl, slug) {
  if (!coverUrl) return undefined;
  try {
    await mkdir(COVERS_DIR, { recursive: true });
    const coverPath = path.join(COVERS_DIR, `${slug}.webp`);
    if (existsSync(coverPath)) {
      console.log(`[Bìa] Đã tồn tại: /covers/${slug}.webp`);
      return `/covers/${slug}.webp`;
    }
    console.log(`[Bìa] Đang tải: ${coverUrl}`);
    const res = await fetch(coverUrl, {
      headers: { 'user-agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).webp({ quality: 85 }).toFile(coverPath);
    console.log(`[Bìa] Đã lưu: /covers/${slug}.webp`);
    return `/covers/${slug}.webp`;
  } catch (err) {
    console.warn(`[Bìa] Không tải được: ${err.message}`);
    return undefined;
  }
}

function getRawContent(html) {
  // doctruyenvoz dùng id='post-body-emo' hoặc id="post-body-emo"
  let bodyStart = html.indexOf("id='post-body-emo'");
  if (bodyStart === -1) bodyStart = html.indexOf('id="post-body-emo"');
  if (bodyStart === -1) {
    // fallback: class post-body-inner
    bodyStart = html.indexOf('class=\'post-body-inner\'');
    if (bodyStart === -1) bodyStart = html.indexOf('class="post-body-inner"');
  }
  if (bodyStart === -1) return '';

  const contentStart = html.indexOf('>', bodyStart) + 1;
  // End: post-footer hoặc <div style='clear: both;'> sau nội dung
  let contentEnd = html.indexOf("<div class='post-footer'>", contentStart);
  if (contentEnd === -1) contentEnd = html.indexOf('<div class="post-footer">', contentStart);
  if (contentEnd === -1) contentEnd = contentStart + 500000; // fallback lớn

  return html.slice(contentStart, contentEnd);
}

function htmlToText(raw) {
  return decodeEntities(
    raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  );
}

/**
 * Tách nội dung thành mảng { chapterTitle, paragraphs }[]
 * Dấu hiệu chương: <h2>Chap N</h2>
 */
function splitIntoChapters(html) {
  const raw = getRawContent(html);
  if (!raw) return [];

  // Split by <h2> tags
  const parts = raw.split(/<h2[^>]*>/i);
  // parts[0] là nội dung trước h2 đầu tiên (bỏ qua hoặc giữ làm lời tựa)
  const chapters = [];

  for (const part of parts) {
    // Lấy tiêu đề: text trước </h2>
    const h2End = part.indexOf('</h2>');
    if (h2End === -1) continue;

    const rawTitle = part.slice(0, h2End).replace(/<[^>]+>/g, '').trim();
    const bodyHtml = part.slice(h2End + 5); // sau </h2>

    // Chỉ lấy các phần có tiêu đề dạng "Chap N" hoặc "Lời tựa" hoặc "Epilogue"
    if (!rawTitle) continue;

    const title = decodeEntities(rawTitle);
    const paragraphs = htmlToText(bodyHtml)
      .split(/\n+/)
      .map((p) => p.normalize('NFC').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    chapters.push({ title, paragraphs });
  }

  return chapters;
}

async function main() {
  console.log('================================================');
  console.log('  CÀO TRUYỆN VOZ (doctruyenvoz.com engine)');
  console.log('================================================');
  console.log(`URL index: ${indexUrl}`);
  console.log(`Slug: ${userSlug}`);

  await mkdir(path.join(OUT, 'chapters'), { recursive: true });

  // --- Bước 1: Lấy trang index để tìm các batch link ---
  console.log('\n[1/3] Đang đọc trang index...');
  const indexHtml = await fetchWithRetry(indexUrl);
  if (!indexHtml) {
    console.error('Không thể tải trang index!');
    process.exit(1);
  }

  // Tiêu đề
  const titleM = indexHtml.match(/<h1[^>]*class=["'][^"']*post-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
                 indexHtml.match(/<title>([\s\S]*?)<\/title>/i);
  let title = userTitle;
  if (!title && titleM) {
    title = decodeEntities(titleM[1]).replace(/<[^>]+>/g, '').replace(/\s*\|.*$/, '').trim();
  }
  if (!title) title = userSlug;

  // Ảnh bìa (og:image hoặc img đầu trong nội dung)
  const coverM = indexHtml.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                 indexHtml.match(/<img[^>]+src=["']([^"']+)["'][^>]*style=["'][^"']*display:none[^"']*["']/i);
  const remoteCoverUrl = coverM ? coverM[1] : undefined;
  const localCover = await downloadCover(remoteCoverUrl, userSlug);

  // Mô tả (meta description)
  const descM = indexHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = descM ? decodeEntities(descM[1]).trim() : '';

  console.log(`- Tên: ${title}`);

  // Tìm các batch URL (Chap X → Y)
  const batchLinks = [...indexHtml.matchAll(/<a[^>]+href=["']([^"']+doctruyenvoz[^"']*chap[^"']*)["'][^>]*>([^<]*chap[^<]*)<\/a>/gi)];
  const batchUrls = batchLinks
    .map((m) => ({ url: m[1], label: decodeEntities(m[2]).trim() }))
    .filter((b) => !b.url.includes('cua-chi-hang-xom') && !b.url.includes('toi-loi') &&
                   !b.url.includes('co-giao') && !b.url.includes('yeu-tham'));

  console.log(`- Tìm thấy ${batchUrls.length} trang batch chương:`);
  batchUrls.forEach((b) => console.log(`  + ${b.label} -> ${b.url}`));

  // --- Bước 2: Tải từng batch và tách chương ---
  console.log('\n[2/3] Đang tải nội dung từng batch...');
  const allChapters = []; // { chapterTitle, paragraphs, batchLabel }

  for (let bi = 0; bi < batchUrls.length; bi++) {
    const batch = batchUrls[bi];
    console.log(`\n  Batch ${bi + 1}/${batchUrls.length}: ${batch.label}`);

    const batchHtml = await fetchWithRetry(batch.url);
    if (!batchHtml) {
      console.warn(`  ! Không tải được batch: ${batch.url}`);
      continue;
    }

    const chapters = splitIntoChapters(batchHtml);
    console.log(`  => Tách được ${chapters.length} chương`);
    allChapters.push(...chapters);

    if (bi < batchUrls.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nTổng cộng: ${allChapters.length} chương sau khi tách`);

  // --- Bước 3: Lưu từng chương ra file ---
  console.log('\n[3/3] Đang lưu từng chương...');
  const storyChapterMeta = [];

  // Đánh số chương: bỏ qua "Lời tựa" hoặc giữ nó làm chương 0
  let chapNum = 0;
  for (let i = 0; i < allChapters.length; i++) {
    const ch = allChapters[i];
    const isLoi = /lời tựa|loi tua|epilogue|lời kết|loi ket|bonus|extra|phụ lục/i.test(ch.title);

    if (isLoi) {
      chapNum = 0; // special numbering
    } else {
      // Thử lấy số từ tiêu đề (Chap 1, Chap 2...)
      const numM = ch.title.match(/\d+/);
      if (numM) {
        chapNum = parseInt(numM[0], 10);
      } else {
        chapNum++;
      }
    }

    const slug = isLoi ? 'loi-tua' : `chap-${chapNum}`;
    const chFile = path.join(OUT, 'chapters', `${slug}.json`);

    if (existsSync(chFile)) {
      console.log(`  = ${slug}: ${ch.title} (đã có)`);
    } else {
      const data = {
        slug,
        num: chapNum,
        title: ch.title,
        mediaType: 'text',
        paragraphs: ch.paragraphs,
      };
      await writeFile(chFile, JSON.stringify(data, null, 1), 'utf8');
      console.log(`  + ${slug}: ${ch.title} (${ch.paragraphs.length} đoạn)`);
    }

    storyChapterMeta.push({
      slug,
      num: chapNum,
      title: ch.title,
      words: ch.paragraphs.join(' ').split(/\s+/).filter(Boolean).length,
    });
  }

  // Lưu story.json
  // Sắp xếp: lời tựa (num=0) lên đầu, còn lại tăng dần
  const sortedMeta = storyChapterMeta.sort((a, b) => a.num - b.num);

  const storyData = {
    slug: userSlug,
    title,
    cover: localCover,
    description,
    source: indexUrl,
    type: 'novel',
    chapters: sortedMeta,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(path.join(OUT, 'story.json'), JSON.stringify(storyData, null, 1), 'utf8');

  console.log('\n================================================');
  console.log(`HOÀN TẤT! data/library/${userSlug}/`);
  console.log(`Tổng chương: ${sortedMeta.length}`);
  console.log(`Xem tại: /thu-vien/${userSlug}`);
  console.log('================================================');
}

main().catch((err) => {
  console.error('Lỗi:', err);
  process.exit(1);
});
