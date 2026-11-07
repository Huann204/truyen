const fs = require('fs');

const file = 'C:\\Users\\nguye\\.gemini\\antigravity\\brain\\d9e7fad6-9b70-4d2f-b5f2-bf522d6d1890\\.system_generated\\steps\\257\\content.md';
const content = fs.readFileSync(file, 'utf8');

const regex = /<a[^>]+href="(https:\/\/berserktruyen\.com\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
let match;
const bMap = new Map(); // chapterNum -> url

while ((match = regex.exec(content)) !== null) {
  const url = match[1];
  const text = match[2].replace(/<[^>]+>/g, '').trim();
  // check for chap
  const m = url.match(/chap-(\d+(?:\.\d+)?)/i) || text.match(/chap(?:ter)?\s*(\d+(?:\.\d+)?)/i);
  if (m) {
    const num = parseFloat(m[1]);
    if (!bMap.has(num)) {
      bMap.set(num, url);
    }
  }
}

console.log('Berserktruyen mapped chapters:', bMap.size);
console.log('Sample mapped:');
for (const n of [0, 1, 2, 50, 100, 200, 300, 370, 375, 376]) {
  console.log(`Chap ${n} -> ${bMap.get(n)}`);
}
