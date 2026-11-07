import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targetUrl = args[0] || 'https://truyenqq.com.vn/o-long-vien';
const defaultSlug = targetUrl.split('/').filter(Boolean).pop() || 'truyen';
const userSlug = args[1] || defaultSlug;
const userTitle = args[2];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
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
  console.log('=== BẮT ĐẦU CÀO TRUYỆN TRUYENQQ ===');
  console.log(`URL: ${targetUrl}`);
  console.log(`Slug: ${userSlug}`);

  await mkdir(path.join(OUT, 'chapters'), { recursive: true });

  const html = await fetchWithRetry(targetUrl);

  // Title
  const titleMatch = html.match(/<h1[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let title = userTitle;
  if (titleMatch) {
    title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    // decode html entities
    title = title.replace(/&#212;/g, 'Ô').replace(/&#224;/g, 'à');
  }

  // Cover
  const coverMatch = html.match(/<div class="block_avatar[^"]*"[^>]*>\s*<img[^>]+src="([^"]+)"/i) ||
                      html.match(/property="og:image" content="([^"]+)"/i);
  const coverUrl = coverMatch ? coverMatch[1] : '';

  // Author
  const authorMatch = html.match(/<li class="author row">[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
                      html.match(/tác giả:\s*<[^>]+>([^<]+)</i);
  const author = authorMatch ? authorMatch[1].trim() : 'Au Yao Hsing';

  // Status
  const statusMatch = html.match(/<li class="status row">[\s\S]*?<p class="col-xs-8">([^<]+)<\/p>/i);
  const status = statusMatch ? statusMatch[1].trim() : 'Hoàn thành';

  // Description
  const descMatch = html.match(/<div class="story-detail-info[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : 'Bộ truyện tranh hài hước kinh điển Ô Long Viện.';

  // Genres
  const genreRegex = /<li class="category row">[\s\S]*?<\/li>/i;
  const genreBlock = html.match(genreRegex)?.[0] || '';
  const genres = [...genreBlock.matchAll(/<a[^>]*>([^<]+)<\/a>/gi)].map(m => m[1].trim());
  if (!genres.length) genres.push('Hài Hước', 'Manga');

  // Save cover as local webp
  let coverPath = `/covers/${userSlug}.webp`;
  if (coverUrl) {
    try {
      const publicDir = path.join(process.cwd(), 'public', 'covers');
      await mkdir(publicDir, { recursive: true });
      const coverRes = await fetch(coverUrl, { headers: { 'user-agent': UA, referer: targetUrl } });
      if (coverRes.ok) {
        const buf = Buffer.from(await coverRes.arrayBuffer());
        await sharp(buf).webp({ quality: 85 }).toFile(path.join(publicDir, `${userSlug}.webp`));
        console.log(`✓ Đã lưu ảnh bìa tại public/covers/${userSlug}.webp`);
      }
    } catch (e) {
      console.log('Lỗi lưu ảnh bìa:', e.message);
    }
  }

  // Chapter list
  const chapRegex = /<a[^>]+href="([^"]*\/chapter-[0-9][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const rawList = [];
  const seenUrls = new Set();
  let m;
  while ((m = chapRegex.exec(html)) !== null) {
    let chapUrl = m[1];
    if (chapUrl.startsWith('/')) chapUrl = 'https://truyenqq.com.vn' + chapUrl;
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (text === 'Đọc từ đầu' || text === 'Đọc mới nhất') continue;

    const numMatch = chapUrl.match(/chapter-([0-9]+)(?:-([0-9]+))?/i);
    if (!numMatch) continue;

    if (!seenUrls.has(chapUrl)) {
      seenUrls.add(chapUrl);
      const mainNum = parseInt(numMatch[1], 10);
      const subNum = numMatch[2] ? parseInt(numMatch[2], 10) : 0;
      const num = subNum ? mainNum + subNum / 10 : mainNum;
      const slug = subNum ? `chuong-${mainNum}.${subNum}` : `chuong-${mainNum}`;
      rawList.push({
        url: chapUrl,
        title: text || `Chapter ${num}`,
        slug,
        num,
      });
    }
  }

  // Sort ascending by num
  rawList.sort((a, b) => a.num - b.num);
  console.log(`Tìm thấy ${rawList.length} chương.`);

  // Load existing story
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

  for (let idx = 0; idx < rawList.length; idx++) {
    const chap = rawList[idx];
    const chapFile = path.join(OUT, 'chapters', `${chap.slug}.json`);

    if (processed.has(chap.slug) && existsSync(chapFile)) {
      continue;
    }

    process.stdout.write(`[${idx + 1}/${rawList.length}] Đang cào ${chap.title}... `);

    try {
      const chapHtml = await fetchWithRetry(chap.url, { referer: targetUrl });
      const imgMatches = [...chapHtml.matchAll(/<img[^>]+class="lazy"[^>]+data-src="([^"]+)"/gi)];
      const pageUrls = imgMatches.map(im => im[1].trim());

      const pages = pageUrls.map((pUrl, pIdx) => ({
        id: pIdx + 1,
        url: `/api/proxy-image?url=${encodeURIComponent(pUrl)}&ref=https://truyenqq.com.vn/`,
      }));

      const chapData = {
        slug: chap.slug,
        num: chap.num,
        title: chap.title,
        mediaType: 'image',
        pages,
        source: chap.url,
      };

      await writeFile(chapFile, JSON.stringify(chapData, null, 2), 'utf8');

      const metaIdx = chaptersMeta.findIndex(c => c.slug === chap.slug);
      const metaItem = { slug: chap.slug, num: chap.num, title: chap.title, pages: pages.length };
      if (metaIdx >= 0) chaptersMeta[metaIdx] = metaItem;
      else chaptersMeta.push(metaItem);

      processed.add(chap.slug);
      console.log(`✓ Xong (${pages.length} trang ảnh)`);

      // Update story.json regularly
      chaptersMeta.sort((a, b) => a.num - b.num);
      const storyData = {
        slug: userSlug,
        title,
        cover: coverPath,
        author,
        status,
        genres,
        description,
        type: 'manga',
        source: targetUrl,
        chapters: chaptersMeta,
        updatedAt: new Date().toISOString(),
      };
      await writeFile(storyJsonPath, JSON.stringify(storyData, null, 2), 'utf8');

      await sleep(200);
    } catch (e) {
      console.log(`❌ Lỗi: ${e.message}`);
    }
  }

  console.log('\n🎉 HOÀN THÀNH CÀO ');
  console.log(`Đã lưu ${chaptersMeta.length} chương vào thư viện.`);
  console.log(`Xem tại: http://localhost:3000/thu-vien/${userSlug}`);
}

main().catch(console.error);
