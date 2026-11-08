import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const targetUrl = args[0] || 'https://tuthienbao.com/forum/showthread.php?p=385299';
const userSlug = args[1] || 'ty-quay';
const userTitle = args[2] || 'Tý Quậy';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const OUT = path.join(process.cwd(), 'data', 'library', userSlug);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === tries) throw e;
      await sleep(1000 * i);
    }
  }
}

function extractImagesFromPost(html) {
  const postMsgMatch = html.match(/id="post_message_\d+"[^>]*>([\s\S]*?)<\/div>\s*<!-- \/ message -->/i) ||
                       html.match(/id="post_message_\d+"[^>]*>([\s\S]*?)<\/td>/i);
  if (!postMsgMatch) return [];
  const postHtml = postMsgMatch[1];
  const imgs = [];
  const regex = /<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"']+)["']/gi;
  let m;
  while ((m = regex.exec(postHtml)) !== null) {
    const url = m[1].replaceAll('&amp;', '&');
    let host;
    try {
      host = new URL(url).hostname;
    } catch {
      continue;
    }
    // Các tập mới dùng googleusercontent, tập cũ dùng 1.bp.blogspot.com ... 4.bp.blogspot.com.
    if (host !== 'blogger.googleusercontent.com' && !host.endsWith('.bp.blogspot.com')) continue;
    // Filter out ads
    if (!url.includes('vay') && !url.includes('son.jpg') && !url.includes('hat.jpg') && !url.includes('dam') && !url.includes('giay') && !url.includes('quat') && !url.includes('khau') && !url.includes('gym') && !url.includes('giavi')) {
      imgs.push(url);
    }
  }
  return imgs;
}

async function main() {
  console.log('=== BẮT ĐẦU CÀO TRUYỆN TỪ TUTHIENBAO ===');
  console.log(`URL mục tiêu: ${targetUrl}`);
  console.log(`Slug: ${userSlug}`);
  console.log(`Tên truyện: ${userTitle}`);

  await mkdir(path.join(OUT, 'chapters'), { recursive: true });

  // 1. Fetch initial page to find forum and intro
  const initialHtml = await fetchWithRetry(targetUrl);

  // Nếu người dùng truyền thẳng URL chuyên mục thì phải giữ nguyên chuyên mục đó.
  // Trước đây đoạn này luôn lấy link forumdisplay đầu tiên trong HTML, thường là
  // chuyên mục cha/khác, nên có thể cào nhầm toàn bộ thread của Tý Quậy.
  const parsedTargetUrl = new URL(targetUrl);
  const isForumUrl = parsedTargetUrl.pathname.endsWith('/forumdisplay.php') && parsedTargetUrl.searchParams.has('f');
  const headerHtml = initialHtml.split(/id=["']posts["']/i)[0];
  const headerForumIds = [...headerHtml.matchAll(/href=["'][^"']*forumdisplay\.php\?([^"']+)["']/gi)]
    .map((match) => new URLSearchParams(match[1].replaceAll('&amp;', '&')).get('f'))
    .filter(Boolean);
  // Breadcrumb đi từ chuyên mục cha đến chuyên mục hiện tại, nên forum id cuối là chính xác.
  const detectedForumId = isForumUrl ? parsedTargetUrl.searchParams.get('f') : headerForumIds.at(-1);
  const forumUrl = detectedForumId
    ? `https://tuthienbao.com/forum/forumdisplay.php?f=${detectedForumId}`
    : null;

  if (!forumUrl) {
    throw new Error('Không xác định được chuyên mục chứa truyện từ URL đã nhập.');
  }
  console.log(`Tìm thấy chuyên mục: ${forumUrl}`);

  // Fetch toàn bộ các trang của chuyên mục (Thần Đồng Đất Việt hiện có 21 trang).
  const firstForumHtml = isForumUrl ? initialHtml : await fetchWithRetry(forumUrl);
  const pageNumbers = [...firstForumHtml.matchAll(/&(?:amp;)?page=(\d+)/gi)].map((match) => Number(match[1]));
  const totalForumPages = Math.max(1, ...pageNumbers);
  const forumPages = [firstForumHtml];
  console.log(`Chuyên mục có ${totalForumPages} trang.`);

  for (let page = 2; page <= totalForumPages; page++) {
    console.log(`Đang đọc danh sách tập trang ${page}/${totalForumPages}...`);
    forumPages.push(await fetchWithRetry(`${forumUrl}&order=desc&page=${page}`));
    await sleep(300);
  }

  const forumHtml = forumPages.join('\n');
  const threadMatches = [...forumHtml.matchAll(/id=["']thread_title_(\d+)["'][^>]*>([^<]+)<\/a>/gi)];

  // Parse threads
  let threadList = threadMatches.map(m => {
    const tid = m[1];
    const rawTitle = m[2].trim();
    // Hỗ trợ các dạng "ep X", "Tập X", "Tap X" và chương con.
    const epMatch = rawTitle.match(/(?:ep(?:isode)?|tập|tap)\s*(\d+)(?:\s*(?:chap|chapter|chương)\s*(\d+))?/iu);
    if (!epMatch) return null;

    let num = parseInt(epMatch[1], 10);
    let sub = epMatch[2] ? ` (Chap ${epMatch[2]})` : '';
    let title = `Tập ${num}${sub}`;
    let chapterSlug = `tap-${num}${epMatch[2] ? `-${epMatch[2]}` : ''}`;
    return {
      tid,
      num,
      title,
      chapterSlug,
      url: `https://tuthienbao.com/forum/showthread.php?t=${tid}`
    };
  }).filter(Boolean);

  // Sort ascending by chapter num
  threadList.sort((a, b) => a.num - b.num);
  console.log(`Tìm thấy ${threadList.length} tập/chương:`);
  for (const t of threadList) {
    console.log(`  - [${t.tid}] ${t.title} -> ${t.chapterSlug}`);
  }

  // Description
  const descMatch = initialHtml.match(/<div id="post_message_\d+">([\s\S]*?)<div/i);
  let description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : 'Bộ truyện tranh hài hước gắn liền với tuổi thơ của tác giả Đào Hải.';

  // Crawl each chapter
  const chaptersMeta = [];
  let coverDownloaded = false;

  for (let i = 0; i < threadList.length; i++) {
    const th = threadList[i];
    console.log(`\n[${i + 1}/${threadList.length}] Đang tải ${th.title}...`);

    let chHtml = initialHtml;
    if (!targetUrl.includes(th.tid)) {
      chHtml = await fetchWithRetry(th.url);
      await sleep(500);
    }

    const imgs = extractImagesFromPost(chHtml);
    console.log(`  -> Tìm thấy ${imgs.length} ảnh`);

    if (imgs.length === 0) {
      console.warn(`  [Cảnh báo] Không tìm thấy ảnh trong tập ${th.title}`);
      continue;
    }

    // Save cover if not done
    if (!coverDownloaded && imgs.length > 0) {
      try {
        const publicDir = path.join(process.cwd(), 'public', 'covers');
        await mkdir(publicDir, { recursive: true });
        const coverRes = await fetch(imgs[0], { headers: { 'user-agent': UA } });
        if (coverRes.ok) {
          const buf = Buffer.from(await coverRes.arrayBuffer());
          await sharp(buf).webp({ quality: 85 }).toFile(path.join(publicDir, `${userSlug}.webp`));
          console.log(`✓ Đã tạo ảnh bìa tại public/covers/${userSlug}.webp`);
          coverDownloaded = true;
        }
      } catch (err) {
        console.warn('Lỗi lưu ảnh bìa:', err.message);
      }
    }

    // Prepare pages
    const pages = imgs.map((imgUrl, idx) => ({
      id: idx + 1,
      url: imgUrl,
    }));

    const chapterData = {
      slug: th.chapterSlug,
      num: th.num,
      title: th.title,
      mediaType: 'image',
      pages,
    };

    const chapterFile = path.join(OUT, 'chapters', `${th.chapterSlug}.json`);
    await writeFile(chapterFile, JSON.stringify(chapterData, null, 2), 'utf-8');

    chaptersMeta.push({
      slug: th.chapterSlug,
      num: th.num,
      title: th.title,
      pages: pages.length,
    });
  }

  // Save story.json
  const storyData = {
    slug: userSlug,
    title: userTitle,
    cover: `/covers/${userSlug}.webp`,
    author: 'Đào Hải',
    status: 'Hoàn thành',
    genres: ['Hài Hước', 'Học Đường', 'Việt Nam', 'Manga'],
    description: description || 'Bộ truyện tranh hài hước gắn liền với tuổi thơ của tác giả Đào Hải.',
    type: 'manga',
    source: targetUrl,
    chapters: chaptersMeta,
  };

  await writeFile(path.join(OUT, 'story.json'), JSON.stringify(storyData, null, 2), 'utf-8');

  console.log('\n======================================');
  console.log(`✓ ĐÃ CÀO XONG ${chaptersMeta.length} TẬP!`);
  console.log(`Đường dẫn thư viện: /thu-vien/${userSlug}`);
  console.log('======================================');
}

main().catch(console.error);
