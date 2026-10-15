// Copies a whitelist of assets from the Taskodoro-Fe repo into public/taskodoro/
// so the build stays self-contained. Override the source with TASKODORO_FE_PATH.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.env.TASKODORO_FE_PATH || resolve(root, '../Taskodoro/Taskodoro-Fe');
const out = resolve(root, 'public/taskodoro');

const files = {
  'resources/icon.png': 'icon.png',
  'src/assets/intro.png': 'intro.png',
  'brag-output/brag.jpg': 'brag.jpg',
  'brag-output/brag.mp4': 'brag.mp4',
  'brag-output/composition/assets/fonts/geomini-latin-700-normal.woff2': 'geomini-700.woff2',
  'brag-output/composition/assets/fonts/google-sans-flex-latin-wght-normal.woff2': 'google-sans-flex.woff2',
};

if (!existsSync(src)) {
  console.warn(`[sync-taskodoro] source not found: ${src} — using already-synced files`);
  process.exit(0);
}
mkdirSync(out, { recursive: true });
for (const [from, to] of Object.entries(files)) {
  const f = resolve(src, from);
  if (existsSync(f)) { copyFileSync(f, resolve(out, to)); console.log(`[sync-taskodoro] ${to}`); }
  else console.warn(`[sync-taskodoro] missing ${from}`);
}

// Instagram posts: promotions/<slug>/NN-*.png + caption.txt -> public/taskodoro/posts + src/posts.json
const order = ['how-taskodoro-happened', 'why-the-name-taskodoro', 'taskodoro-ideology', 'taskodoro-brand-card'];
const promo = resolve(src, 'promotions');
if (existsSync(promo)) {
  const posts = [];
  for (const slug of order) {
    const dir = resolve(promo, slug);
    if (!existsSync(dir)) continue;
    const dest = resolve(out, 'posts', slug);
    mkdirSync(dest, { recursive: true });
    const slides = readdirSync(dir).filter((f) => /^\d+.*\.png$/.test(f)).sort();
    slides.forEach((f) => copyFileSync(resolve(dir, f), resolve(dest, f)));
    const caption = readFileSync(resolve(dir, 'caption.txt'), 'utf8').trim();
    posts.push({ slug, title: caption.split('\n')[0], caption, slides: slides.map((f) => `/taskodoro/posts/${slug}/${f}`) });
  }
  writeFileSync(resolve(root, 'src/posts.json'), JSON.stringify(posts, null, 2));
  console.log(`[sync-taskodoro] ${posts.length} posts`);
}
