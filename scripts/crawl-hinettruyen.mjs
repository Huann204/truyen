import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));

const targetUrlArg = args[0] || 'https://hinettruyen.com/truyen-tranh/do-de-cua-ta-deu-la-dai-phan-phai';
const rawSlug = targetUrlArg.split('?')[0].replace(/\/+$/, '').split('/').pop() || 'truyen';
const comicSlug = rawSlug === 'trang-chu' ? 'truyen' : rawSlug;

const userSlug = args[1] || comicSlug;
const userTitle = args[2];

// Flags
const limitFlag = flags.find(f => f.startsWith('--limit='));
const limit = limitFlag ? parseInt(limitFlag.split('=')[1], 10) : 0;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const BASE_HOST = 'https://hinettruyen.com';
const OUT = path.join(process.cwd(), 'data', 'library', userSlug);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, headers = {}, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, ...headers },
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

async function main() {
  console.log('=== BẮT ĐẦU CÀO TRUYỆN HINETTRUYEN ===');
  const targetUrl = targetUrlArg.startsWith('http') ? targetUrlArg : `${BASE_HOST}/truyen-tranh/${targetUrlArg}`;
  console.log(`URL truyện: ${targetUrl}`);
  console.log(`Mã slug: ${userSlug}`);

  await mkdir(path.join(OUT, 'chapters'), { recursive: true });

  const html = await fetchWithRetry(targetUrl, { referer: BASE_HOST });

  // 1. Title
  const titleMatch = html.match(/<h1 class="title-detail"[^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/<h1[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let title = userTitle;
  if (!title && titleMatch) {
    title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
  }
  if (!title) title = userSlug;

  // 2. Cover
  const coverMatch = html.match(/class="col-xs-4 col-image"[^>]*>[\s\S]*?<img[^>]+(?:data-src|src)="([^"]+)"/i) ||
                     html.match(/property="og:image" content="([^"]+)"/i);
  let coverUrl = coverMatch ? coverMatch[1].trim() : '';
  if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;

  // 3. Author
  const authorMatch = html.match(/<li class="author row"[^>]*>[\s\S]*?<p class="col-xs-8"[^>]*>([\s\S]*?)<\/p>/i);
  const author = authorMatch ? authorMatch[1].replace(/<[^>]+>/g, '').trim() : 'Đang cập nhật';

  // 4. Status
  const statusMatch = html.match(/<li class="status row"[^>]*>[\s\S]*?<p class="col-xs-8"[^>]*>([\s\S]*?)<\/p>/i);
  const status = statusMatch ? statusMatch[1].replace(/<[^>]+>/g, '').trim() : 'Đang tiến hành';

  // 5. Genres
  const kindMatch = html.match(/<li class="kind row"[^>]*>[\s\S]*?<p class="col-xs-8"[^>]*>([\s\S]*?)<\/p>/i);
  const genres = kindMatch ? [...kindMatch[1].matchAll(/<a[^>]*>([^<]+)<\/a>/gi)].map(m => m[1].trim()) : [];

  // 6. Description
  const descMatch = html.match(/<div class="shortened"[^>]*>([\s\S]*?)<\/div>/i) ||
                    html.match(/<div class="detail-content"[^>]*>([\s\S]*?)<\/div>/i);
  const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

  console.log(`Tiêu đề: ${title}`);
  console.log(`Tác giả: ${author}`);
  console.log(`Trạng thái: ${status}`);
  console.log(`Thể loại: ${genres.join(', ') || 'N/A'}`);

  // 7. Save cover
  const publicDir = path.join(process.cwd(), 'public', 'covers');
  await mkdir(publicDir, { recursive: true });
  if (coverUrl) {
    try {
      const coverRes = await fetch(coverUrl, {
        headers: { 'user-agent': UA, referer: BASE_HOST },
      });
      if (coverRes.ok) {
        const buf = Buffer.from(await coverRes.arrayBuffer());
        await sharp(buf).webp({ quality: 85 }).toFile(path.join(publicDir, `${userSlug}.webp`));
        console.log(`✓ Đã lưu ảnh bìa tại public/covers/${userSlug}.webp`);
      }
    } catch (e) {
      console.warn('Lỗi lưu ảnh bìa:', e.message);
    }
  }

  // 8. Fetch chapter list (Try API first, then HTML fallback)
  let rawList = [];
  const apiUrl = `${BASE_HOST}/Comic/Services/ComicService.asmx/ChapterList?slug=${comicSlug}`;
  try {
    const apiRes = await fetch(apiUrl, {
      headers: {
        'user-agent': UA,
        referer: targetUrl,
        'x-requested-with': 'XMLHttpRequest',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (Array.isArray(json)) {
        rawList = json;
      } else if (Array.isArray(json?.data)) {
        rawList = json.data;
      }
    }
  } catch (err) {
    console.warn('Không gọi được API ChapterList, chuyển sang đọc HTML:', err.message);
  }

  const parsedChapters = [];
  const seenSlugs = new Set();

  if (rawList.length > 0) {
    for (const item of rawList) {
      const num = typeof item.chapter_num === 'number' ? item.chapter_num : parseFloat(item.chapter_num || '0');
      const name = item.chapter_name || `Chapter ${num}`;
      const chSlug = `chuong-${num}`;
      if (!seenSlugs.has(chSlug)) {
        seenSlugs.add(chSlug);
        parsedChapters.push({
          url: `${BASE_HOST}/truyen-tranh/${comicSlug}/chuong-${num}`,
          title: name,
          slug: chSlug,
          num,
        });
      }
    }
  } else {
    // Fallback: parse HTML list
    const chapRegex = /<a[^>]+href="([^"]*\/chuong-[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = chapRegex.exec(html)) !== null) {
      let chapUrl = m[1].trim();
      if (chapUrl.startsWith('/')) chapUrl = BASE_HOST + chapUrl;
      const text = m[2].replace(/<[^>]+>/g, '').trim();
      if (text.includes('Đọc từ đầu') || text.includes('Đọc mới nhất')) continue;

      const numMatch = chapUrl.match(/chuong-([0-9]+(?:\.[0-9]+)?)/i);
      if (!numMatch) continue;

      const num = parseFloat(numMatch[1]);
      const chSlug = `chuong-${num}`;
      if (!seenSlugs.has(chSlug)) {
        seenSlugs.add(chSlug);
        parsedChapters.push({
          url: chapUrl,
          title: text || `Chapter ${num}`,
          slug: chSlug,
          num,
        });
      }
    }
  }

  // Sort ascending by chapter number
  parsedChapters.sort((a, b) => a.num - b.num);
  console.log(`Tìm thấy tổng cộng ${parsedChapters.length} chương.`);

  let chaptersToCrawl = parsedChapters;
  if (limit > 0) {
    chaptersToCrawl = parsedChapters.slice(0, limit);
    console.log(`--limit=${limit}: Chỉ cào ${chaptersToCrawl.length} chương đầu.`);
  }

  // Load existing story to resume
  const storyJsonPath = path.join(OUT, 'story.json');
  let existing = null;
  if (existsSync(storyJsonPath)) {
    try {
      existing = JSON.parse(await readFile(storyJsonPath, 'utf8'));
    } catch {}
  }

  const chaptersMeta = existing?.chapters ? [...existing.chapters] : [];
  const processed = new Set();
  for (const c of chaptersMeta) {
    if (c.pages && c.pages > 0) processed.add(c.slug);
  }

  for (let idx = 0; idx < chaptersToCrawl.length; idx++) {
    const chap = chaptersToCrawl[idx];
    const chapFile = path.join(OUT, 'chapters', `${chap.slug}.json`);

    if (processed.has(chap.slug) && existsSync(chapFile)) {
      continue;
    }

    process.stdout.write(`[${idx + 1}/${chaptersToCrawl.length}] Đang cào ${chap.title}... `);

    try {
      const chapHtml = await fetchWithRetry(chap.url, { referer: targetUrl });
      const imgRegex = /<div class=['"]page-chapter['"][^>]*>\s*<img[^>]+(?:data-src|data-sv1)=['"]([^'"]+)['"]/gi;
      const pageUrls = [];
      let im;
      while ((im = imgRegex.exec(chapHtml)) !== null) {
        let pUrl = im[1].trim();
        if (pUrl.startsWith('//')) pUrl = 'https:' + pUrl;
        pageUrls.push(pUrl);
      }

      if (pageUrls.length === 0) {
        console.log('⚠️ Không tìm thấy ảnh (trang trống hoặc lỗi tải)');
        continue;
      }

      const pages = pageUrls.map((pUrl, pIdx) => ({
        id: pIdx + 1,
        url: `/api/proxy-image?url=${encodeURIComponent(pUrl)}&ref=${encodeURIComponent(BASE_HOST)}/`,
      }));

      const chapData = {
        slug: chap.slug,
        num: chap.num,
        title: chap.title,
        mediaType: 'image',
        pages,
      };

      await writeFile(chapFile, JSON.stringify(chapData, null, 2), 'utf-8');

      // Update meta
      const existMetaIdx = chaptersMeta.findIndex(c => c.slug === chap.slug);
      const metaItem = {
        slug: chap.slug,
        num: chap.num,
        title: chap.title,
        pages: pages.length,
      };
      if (existMetaIdx >= 0) {
        chaptersMeta[existMetaIdx] = metaItem;
      } else {
        chaptersMeta.push(metaItem);
      }

      chaptersMeta.sort((a, b) => a.num - b.num);
      processed.add(chap.slug);

      // Save story.json incrementally
      const storyData = {
        slug: userSlug,
        title,
        cover: `/covers/${userSlug}.webp`,
        author,
        status,
        genres,
        description,
        type: 'manga',
        source: targetUrl,
        chapters: chaptersMeta,
      };
      await writeFile(storyJsonPath, JSON.stringify(storyData, null, 2), 'utf-8');

      console.log(`✓ (${pages.length} trang)`);
      await sleep(350);
    } catch (err) {
      console.log(`❌ Lỗi: ${err.message}`);
    }
  }

  console.log('\n======================================');
  console.log(`✓ ĐÃ HOÀN TẤT CÀO TRUYỆN: ${title}`);
  console.log(`Số chương đã lưu: ${chaptersMeta.length}/${chaptersToCrawl.length}`);
  console.log(`Xem truyện tại: /thu-vien/${userSlug}`);
  console.log('======================================');
}

main().catch(console.error);
