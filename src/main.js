import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import posts from './posts.json';

gsap.registerPlugin(ScrollTrigger);

// Edit once.
const GITHUB_URL = 'https://github.com/mavnt';
document.querySelectorAll('a.gh').forEach((a) => (a.href = GITHUB_URL));

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
const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Hero entrance — the one orchestrated moment.
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from('.logo', { y: -140, scale: 1.3, rotation: -5, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.4)' })
    .from('.tagline .row > span', { yPercent: 110, duration: 0.8, stagger: 0.1 }, '-=0.35')
    .from('.sub', { y: 18, autoAlpha: 0, duration: 0.6 }, '-=0.3');

  // Marquee loops forever; scroll speeds it up.
  const loop = gsap.to('.track', { xPercent: -50, duration: 24, ease: 'none', repeat: -1 });
  // Track holds 4 copies, half = 2 copies, so -50% loops seamlessly.
  ScrollTrigger.create({ onUpdate: (s) => gsap.to(loop, { timeScale: 1 + Math.abs(s.getVelocity()) / 800, duration: 0.2, overwrite: true }) });

  // Posts land like pinned notes.
  gsap.from('.post', {
    scrollTrigger: { trigger: '#grid', start: 'top 85%' },
    y: 60, rotation: (i) => (i % 2 ? 3 : -3), autoAlpha: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.3)',
  });
  gsap.from('.project-copy > *', { scrollTrigger: { trigger: '.project', start: 'top 70%' }, y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.6 });
  gsap.from('.video', { scrollTrigger: { trigger: '.video', start: 'top 85%' }, x: 60, rotation: 6, autoAlpha: 0, duration: 0.8, ease: 'power3.out' });

  if (matchMedia('(pointer: fine)').matches) {
    gsap.set('.logo', { transformPerspective: 900 });
    const rx = gsap.quickTo('.logo', 'rotationX', { duration: 0.5 });
    const ry = gsap.quickTo('.logo', 'rotationY', { duration: 0.5 });
    const move = (e) => { ry((e.clientX / innerWidth - 0.5) * 16); rx(-(e.clientY / innerHeight - 0.5) * 10); };
    addEventListener('pointermove', move);
    return () => removeEventListener('pointermove', move);
  }
});
