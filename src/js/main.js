import '../styles/main.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

document.documentElement.classList.add('js');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const THEMES = {
  blue: { bg: '#2b3cf0', fg: '#fff8f0' },
  paper: { bg: '#f4f1ea', fg: '#16141c' },
  blush: { bg: '#f3d8ce', fg: '#16141c' },
  ink: { bg: '#16141c', fg: '#fff8f0' },
  coral: { bg: '#f25433', fg: '#fff8f0' },
  teal: { bg: '#0e8584', fg: '#fff8f0' },
  pink: { bg: '#e0388c', fg: '#fff8f0' },
  navy: { bg: '#182a9e', fg: '#fff8f0' },
};

/* ------------------------------ smooth scroll ------------------------------ */

let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;
}

/* --------------------------- background morphing ---------------------------- */

function applyTheme(name, animate = true) {
  const t = THEMES[name];
  if (!t) return;
  gsap.to('body', {
    backgroundColor: t.bg,
    color: t.fg,
    duration: animate && !reduced ? 0.7 : 0,
    ease: 'power2.out',
    overwrite: 'auto',
  });
}

function initThemeMorph() {
  const sections = document.querySelectorAll('[data-theme]');
  if (!sections.length) return;
  // set initial theme instantly
  applyTheme(sections[0].dataset.theme, false);
  sections.forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => applyTheme(sec.dataset.theme),
      onEnterBack: () => applyTheme(sec.dataset.theme),
    });
  });
}

/* ------------------------------ header ------------------------------------- */

function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  let lastY = 0;
  const onScroll = (y) => {
    if (y > 160 && y > lastY + 4) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 160) header.classList.remove('is-hidden');
    lastY = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
}

/* ------------------------------ blob cursor --------------------------------- */

function initCursor() {
  if (!finePointer || reduced) return;
  const blob = document.createElement('div');
  blob.className = 'blob-cursor';
  document.body.appendChild(blob);
  const bx = gsap.quickTo(blob, 'x', { duration: 0.35, ease: 'power3' });
  const by = gsap.quickTo(blob, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('mousemove', (e) => { bx(e.clientX); by(e.clientY); });
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, input, textarea'))
      gsap.to(blob, { scale: 3.2, duration: 0.35, ease: 'power3' });
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, input, textarea'))
      gsap.to(blob, { scale: 1, duration: 0.35, ease: 'power3' });
  });
}

/* ----------------------------- stacked cards -------------------------------- */

function initStack() {
  if (reduced) return;
  const cards = gsap.utils.toArray('.stack-card');
  cards.forEach((card, i) => {
    if (i === cards.length - 1) return;
    const next = cards[i + 1];
    gsap.fromTo(card,
      { scale: 1, filter: 'brightness(1)' },
      {
        scale: 0.94,
        filter: 'brightness(0.82)',
        ease: 'none',
        scrollTrigger: {
          trigger: next,
          start: 'top bottom',
          end: 'top 12%',
          scrub: true,
        },
      });
  });
}

/* ------------------------- scroll-driven reveals ----------------------------- */

function initScrollAnimations() {
  if (reduced) return;

  const drawSquigs = (scope, delay = 0) => {
    scope.querySelectorAll('.squig svg path').forEach((path) => {
      gsap.fromTo(path, { strokeDashoffset: 600 }, {
        strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', delay,
      });
    });
  };

  document.querySelectorAll('[data-sp]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.set(el, { visibility: 'visible' });
    gsap.from(split.lines, {
      yPercent: 115,
      rotate: 3,
      duration: 1,
      stagger: 0.09,
      ease: 'power4.out',
      delay: parseFloat(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      // unwrap the line masks once done so decorations hanging below the
      // baseline aren't clipped, then draw any squiggles on the fresh nodes
      onComplete: () => {
        split.revert();
        drawSquigs(el, 0.1);
      },
    });
  });

  // squiggles that don't live inside a split heading
  document.querySelectorAll('.squig').forEach((sq) => {
    if (sq.closest('[data-sp]')) return;
    ScrollTrigger.create({
      trigger: sq, start: 'top 92%', once: true,
      onEnter: () => drawSquigs(sq.parentElement || sq),
    });
  });

  document.querySelectorAll('[data-rv]').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power4.out',
      delay: parseFloat(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  document.querySelectorAll('[data-rv-group]').forEach((group) => {
    gsap.to(group.children, {
      opacity: 1, y: 0, duration: 0.85, stagger: 0.08, ease: 'power4.out',
      scrollTrigger: { trigger: group, start: 'top 88%', once: true },
    });
  });

  document.querySelectorAll('[data-pop]').forEach((el) => {
    gsap.to(el, {
      opacity: 1, scale: 1, duration: 0.9,
      ease: 'back.out(1.8)',
      delay: parseFloat(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  document.querySelectorAll('[data-counter]').forEach((el) => {
    const to = parseFloat(el.dataset.counter);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: to, duration: 1.6, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-US'); },
    });
  });
}

/* ------------------------------ local time ---------------------------------- */

function initClock() {
  const els = document.querySelectorAll('[data-time]');
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const tick = () => els.forEach((el) => { el.textContent = `${fmt.format(new Date())} IST`; });
  tick();
  setInterval(tick, 30_000);
}

/* ------------------------------ copy email ---------------------------------- */

function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const original = btn.textContent;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = original; }, 1600);
      } catch { /* clipboard unavailable */ }
    });
  });
}

/* ------------------------- page enter / exit -------------------------------- */

function pageEnter() {
  const veil = document.querySelector('.circle-veil');
  const pre = document.querySelector('.pre3');
  const isFirstVisit = !sessionStorage.getItem('ia3-visited');

  const finish = () => {
    initScrollAnimations();
    initStack();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  if (reduced) {
    veil?.classList.remove('cover');
    if (pre) pre.style.display = 'none';
    finish();
    return;
  }

  if (isFirstVisit && pre) {
    sessionStorage.setItem('ia3-visited', '1');
    const word = pre.querySelector('.pre-word');
    const bands = pre.querySelectorAll('.bands i');
    gsap.timeline({ onComplete: () => { pre.style.display = 'none'; finish(); } })
      .set(pre, { visibility: 'visible' })
      .set(veil, { clipPath: 'circle(0% at 50% 50%)' })
      .from(word, { scale: 0.4, opacity: 0, duration: 0.7, ease: 'back.out(1.8)' })
      .to(bands, { scaleX: 1, duration: 0.55, stagger: 0.08, ease: 'power3.inOut' }, '-=0.2')
      .to(word, { scale: 0.85, opacity: 0, duration: 0.4, ease: 'power2.in' }, '<+=0.35')
      .to(pre, { yPercent: -100, duration: 0.75, ease: 'power4.inOut' });
  } else {
    if (pre) pre.style.display = 'none';
    gsap.to(veil, {
      clipPath: 'circle(0% at 50% 50%)',
      duration: 0.9,
      ease: 'power3.inOut',
      delay: 0.05,
      onComplete: () => { veil?.classList.remove('cover'); finish(); },
    });
  }
}

function initPageExit() {
  const veil = document.querySelector('.circle-veil');
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    const url = new URL(link.href, window.location.href);
    const internal = url.origin === window.location.origin
      && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')
      && link.target !== '_blank';
    if (!internal || reduced || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    lenis?.stop();
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    gsap.fromTo(veil,
      { clipPath: `circle(0% at ${x}px ${y}px)` },
      {
        clipPath: `circle(150% at ${x}px ${y}px)`,
        duration: 0.6,
        ease: 'power3.in',
        onComplete: () => { window.location.href = link.href; },
      });
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      gsap.set(veil, { clipPath: 'circle(0% at 50% 50%)' });
      veil?.classList.remove('cover');
      lenis?.start();
    }
  });
}

/* --------------------------------- boot ------------------------------------- */

initThemeMorph();
initHeader();
initCursor();
initClock();
initCopy();
initPageExit();

document.fonts.ready.then(() => pageEnter());
window.addEventListener('load', () => ScrollTrigger.refresh());
