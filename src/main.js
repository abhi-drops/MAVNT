import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import posts from './posts.json';

gsap.registerPlugin(ScrollTrigger);

/* ---------- feed grid ---------- */
const grid = document.getElementById('grid');
posts.forEach((p, i) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.className = 'post';
  b.type = 'button';
  b.setAttribute('aria-label', `Open post: ${p.title}`);
  b.innerHTML = `<img src="${p.slides[0]}" alt="" loading="lazy" />${p.slides.length > 1 ? `<span class="count">1/${p.slides.length}</span>` : ''}`;
  b.addEventListener('click', () => openPost(i, b));
  li.append(b);
  grid.append(li);
});

/* ---------- lightbox ---------- */
const lb = document.getElementById('lb');
const img = lb.querySelector('.lb-img');
const cap = lb.querySelector('.lb-caption');
const dots = lb.querySelector('.lb-dots');
const prev = lb.querySelector('.prev');
const next = lb.querySelector('.next');
let cur = 0, slide = 0, opener = null;

function show(n) {
  const p = posts[cur];
  slide = Math.max(0, Math.min(p.slides.length - 1, n));
  img.src = p.slides[slide];
  img.alt = `${p.title} — slide ${slide + 1} of ${p.slides.length}`;
  [...dots.children].forEach((d, i) => d.classList.toggle('on', i === slide));
  prev.disabled = slide === 0;
  next.disabled = slide === p.slides.length - 1;
  const single = p.slides.length === 1;
  prev.hidden = next.hidden = single;
}
function openPost(i, from) {
  cur = i; opener = from;
  cap.textContent = posts[i].caption;
  dots.innerHTML = posts[i].slides.map(() => '<i></i>').join('');
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  show(0);
  lb.querySelector('.lb-close').focus();
}
function close() { lb.hidden = true; document.body.style.overflow = ''; opener?.focus(); }
prev.addEventListener('click', () => show(slide - 1));
next.addEventListener('click', () => show(slide + 1));
lb.querySelector('.lb-close').addEventListener('click', close);
lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') show(slide - 1);
  if (e.key === 'ArrowRight') show(slide + 1);
});

/* ---------- video sound toggle ---------- */
const vid = document.querySelector('.video video');
const snd = document.querySelector('.sound');
snd.addEventListener('click', () => {
  vid.muted = !vid.muted;
  snd.textContent = vid.muted ? 'Sound off' : 'Sound on';
  snd.setAttribute('aria-pressed', String(!vid.muted));
});

/* ---------- motion ---------- */
// base always matches, so the handler runs everywhere and re-runs when a condition flips.
const mm = gsap.matchMedia();
mm.add(
  {
    base: '(min-width: 0px)',
    reduce: '(prefers-reduced-motion: reduce)',
    stacked: '(max-width: 900px)',
    fine: '(pointer: fine)',
  },
  (ctx) => {
    const { reduce, stacked, fine } = ctx.conditions;
    if (reduce) return;

    // First screen — the mark drops in.
    const hero = gsap.timeline({ defaults: { ease: 'power4.out' } })
      .from('.logo', {
        y: stacked ? -80 : -140, scale: stacked ? 1.18 : 1.3, rotation: -5,
        autoAlpha: 0, duration: 0.9, ease: 'back.out(1.4)',
      })
      .from('.sub-head', { y: 14, autoAlpha: 0, duration: 0.5 }, '-=0.25');

    if (stacked) {
      // Copy sits below the fold — reveal it on the way past.
      gsap.timeline({ scrollTrigger: { trigger: '.hero-copy', start: 'top 78%' }, defaults: { ease: 'power4.out' } })
        .from('.tagline .row > span', { yPercent: 110, duration: 0.8, stagger: 0.1 })
        .from('.sub', { y: 18, autoAlpha: 0, duration: 0.6 }, '-=0.4');
    } else {
      // Copy shares the first screen — it joins the entrance.
      hero
        .from('.tagline .row > span', { yPercent: 110, duration: 0.8, stagger: 0.1 }, '-=0.45')
        .from('.sub', { y: 18, autoAlpha: 0, duration: 0.6 }, '-=0.3');
    }

    // Marquee loops forever; scroll speeds it up.
    const loop = gsap.to('.track', { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
    // Track holds 4 copies, half = 2 copies, so -50% loops seamlessly.
    ScrollTrigger.create({ onUpdate: (s) => gsap.to(loop, { timeScale: 1 + Math.abs(s.getVelocity()) / 2000, duration: 0.2, overwrite: true }) });

    // Posts land like pinned notes.
    gsap.from('.post', {
      scrollTrigger: { trigger: '#grid', start: 'top 85%' },
      y: 60, rotation: (i) => (i % 2 ? 3 : -3), autoAlpha: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.3)',
    });
    gsap.from('.project-copy > *', { scrollTrigger: { trigger: '.project', start: 'top 70%' }, y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.6 });
    gsap.from('.video', { scrollTrigger: { trigger: '.video', start: 'top 85%' }, x: 60, rotation: 6, autoAlpha: 0, duration: 0.8, ease: 'power3.out' });

    if (fine) {
      gsap.set('.logo', { transformPerspective: 900 });
      const rx = gsap.quickTo('.logo', 'rotationX', { duration: 0.5 });
      const ry = gsap.quickTo('.logo', 'rotationY', { duration: 0.5 });
      const move = (e) => { ry((e.clientX / innerWidth - 0.5) * 16); rx(-(e.clientY / innerHeight - 0.5) * 10); };
      addEventListener('pointermove', move);
      return () => removeEventListener('pointermove', move);
    }
  }
);
