/* ===== nav: solid on scroll + mobile burger ===== */
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});

document.querySelectorAll('.nav__links a').forEach(a => {
  a.addEventListener('click', () => nav.classList.remove('open'));
});

/* ===== scroll reveal ===== */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('[data-reveal]');

if (reduceMotion) {
  revealEls.forEach(el => el.classList.add('in-view'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in-view'), i * 60);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => io.observe(el));
}

/* ===== vagas: filter chips ===== */
(function jobFilters() {
  const chips = document.querySelectorAll('.filter-chip');
  const cards = document.querySelectorAll('.job-card');
  if (!chips.length || !cards.length) return;

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'todas' || card.dataset.type === filter;
        card.style.display = match ? '' : 'none';
      });
    });
  });
})();

/* ===== carousel ===== */
(function carousels() {
  document.querySelectorAll('[data-carousel]').forEach(root => {
    const track = root.querySelector('[data-carousel-track]');
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    const dotsBox = root.querySelector('[data-carousel-dots]');
    const slides = Array.from(track.children);
    if (!slides.length) return;

    // a single image doesn't need controls
    if (slides.length < 2) {
      [prev, next, dotsBox].forEach(el => el && (el.style.display = 'none'));
      return;
    }

    // build dots
    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.className = 'carousel__dot';
      b.type = 'button';
      b.setAttribute('aria-label', `Ir para imagem ${i + 1}`);
      b.addEventListener('click', () => {
        track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
      });
      dotsBox && dotsBox.appendChild(b);
      return b;
    });

    function step() {
      const s = slides[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      return s + gap;
    }

    function sync() {
      const max = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;

      // nearest slide wins the active dot
      let active = 0, best = Infinity;
      slides.forEach((sl, i) => {
        const d = Math.abs(sl.offsetLeft - track.offsetLeft - track.scrollLeft);
        if (d < best) { best = d; active = i; }
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === active));
    }

    prev && prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', () => window.requestAnimationFrame(sync), { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    sync();
  });
})();

/* ===== hero network canvas — echoes the NUDCARI mark ===== */
(function networkCanvas() {
  const canvas = document.getElementById('network');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.closest('.hero');
  let w, h, dpr, nodes = [], mouse = { x: null, y: null };

  const BLUE_LIGHT = '143,182,224';
  const BLUE_MID = '61,111,180';

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.offsetWidth;
    h = hero.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildNodes();
  }

  function buildNodes() {
    const density = w < 700 ? 16000 : 11000;
    const count = Math.max(24, Math.min(70, Math.floor((w * h) / density)));
    nodes = new Array(count).fill(0).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.6 + 0.8
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    const linkDist = w < 700 ? 110 : 150;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = w + 20; if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20; if (n.y > h + 20) n.y = -20;
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist) {
          const alpha = (1 - dist / linkDist) * 0.35;
          ctx.strokeStyle = `rgba(${BLUE_MID},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      if (mouse.x !== null) {
        const dx = nodes[i].x - mouse.x, dy = nodes[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 170) {
          const alpha = (1 - dist / 170) * 0.5;
          ctx.strokeStyle = `rgba(${BLUE_LIGHT},${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${BLUE_LIGHT},0.85)`;
      ctx.fill();
    }

    if (!reduceMotion) requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize, { passive: true });
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  resize();
  step();
  if (reduceMotion) step(); // draw a single static frame
})();