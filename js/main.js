/* =========================================================
   Портфолио Андрея Бунина — основная логика
   ========================================================= */
'use strict';

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================================
   1. ФОН: частицы + связи (Canvas)
   ========================================================= */
function initBackground() {
  if (prefersReduced) return;

  const canvas = $('#bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w = 0, h = 0, dpr = 1;
  let particles = [];
  let shapes = [];
  let rafId = null;
  const mouse = { x: -999, y: -999 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const density = Math.min(Math.round((w * h) / 16000), 110);
    particles = Array.from({ length: density }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.6,
      hue: Math.random() > 0.65 ? 292 : 265
    }));

    const shapeCount = w < 780 ? 4 : 7;
    shapes = Array.from({ length: shapeCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.7 + 0.3,
      size: Math.random() * 46 + 26,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.004,
      vy: (Math.random() - 0.5) * 0.16,
      vx: (Math.random() - 0.5) * 0.16,
      type: Math.random() > 0.5 ? 'cube' : 'octa'
    }));
  }

  function drawShape(s) {
    const size = s.size * s.z;
    const cx = s.x, cy = s.y;
    const a = s.rot;
    const cos = Math.cos(a), sin = Math.sin(a);
    const pts = [];

    if (s.type === 'cube') {
      const v = [];
      for (let i = 0; i < 8; i++) {
        const dx = (i & 1 ? 1 : -1) * size / 2;
        const dy = (i & 2 ? 1 : -1) * size / 2;
        const dz = (i & 4 ? 1 : -1) * size / 2;
        const rx = dx * cos - dz * sin;
        const rz = dx * sin + dz * cos;
        const k = 1 / (1 + rz / 340);
        v.push([cx + rx * k, cy + dy * k]);
      }
      const edges = [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
      edges.forEach(([i, j]) => { pts.push(v[i], v[j]); });
    } else {
      const v = [];
      const n = 4;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + a;
        v.push([cx + Math.cos(ang) * size, cy + Math.sin(ang) * size * 0.42]);
        v.push([cx + Math.cos(ang) * size * 0.6, cy + size * 0.62]);
      }
      for (let i = 0; i < n; i++) {
        pts.push(v[i * 2], v[((i + 1) % n) * 2]);
        pts.push(v[i * 2], v[i * 2 + 1]);
        pts.push(v[i * 2 + 1], v[((i + 1) % n) * 2 + 1]);
      }
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(180, 130, 255, 0.16)';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
    }
    ctx.stroke();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    // фигуры
    shapes.forEach((s) => {
      s.x += s.vx; s.y += s.vy; s.rot += s.vr;
      if (s.x < -120) s.x = w + 120;
      if (s.x > w + 120) s.x = -120;
      if (s.y < -120) s.y = h + 120;
      if (s.y > h + 120) s.y = -120;
      drawShape(s);
    });

    // частицы
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

      const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      const near = dm < 160;

      ctx.beginPath();
      ctx.arc(p.x, p.y, near ? p.r * 1.9 : p.r, 0, Math.PI * 2);
      ctx.fillStyle = near
        ? `hsla(${p.hue}, 90%, 78%, 0.95)`
        : `hsla(${p.hue}, 85%, 70%, 0.6)`;
      ctx.fill();
    });

    // связи
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 15000) {
          const alpha = (1 - d2 / 15000) * 0.22;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(150, 100, 240, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  resize();
  frame();

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(resize, 180);
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseout', () => { mouse.x = mouse.y = -999; }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(frame);
    }
  });
}

/* =========================================================
   2. НАВИГАЦИЯ + прогресс прокрутки
   ========================================================= */
function initNav() {
  const nav = $('#nav');
  const burger = $('#navBurger');
  const links = $$('#navLinks a');
  const linksBox = $('#navLinks');
  const progress = $('#scrollProgress');

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 40);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    // активная ссылка
    let current = '';
    $$('main section[id]').forEach((sec) => {
      if (y >= sec.offsetTop - 160) current = sec.id;
    });
    links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger) {
    burger.addEventListener('click', () => {
      const open = linksBox.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    linksBox.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        linksBox.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  $('#year').textContent = new Date().getFullYear();
}

/* =========================================================
   3. ПОЯВЛЕНИЕ ПРИ ПРОКРУТКЕ + счётчики + полосы навыков
   ========================================================= */
function initReveal() {
  const items = $$('[data-reveal]');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('revealed'));
    $$('.bar i').forEach((b) => { b.style.width = b.style.getPropertyValue('--val') || '0%'; });
    animateCounters();
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('revealed');

      // снимаем задержку, чтобы она не мешала 3D-наклону карточки
      setTimeout(() => { el.style.transitionDelay = ''; }, 1000);

      // анимация полос навыков внутри карточки
      $$('.bar i', el).forEach((bar, i) => {
        setTimeout(() => {
          bar.style.width = bar.style.getPropertyValue('--val') || '0%';
        }, i * 120);
      });

      obs.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });

  items.forEach((el, i) => {
    el.style.transitionDelay = (i % 6) * 60 + 'ms';
    io.observe(el);
  });

  // счётчики
  const stats = $('.hero__stats');
  if (stats) {
    const so = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { animateCounters(); so.disconnect(); }
    }, { threshold: 0.4 });
    so.observe(stats);
  }
}

function animateCounters() {
  $$('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (prefersReduced) { el.textContent = target; return; }
    const dur = 1300;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/* =========================================================
   4. 3D-НАКЛОН КАРТОЧЕК ЗА КУРСОРОМ
   ========================================================= */
function initTilt() {
  if (prefersReduced || window.matchMedia('(hover: none)').matches) return;

  const MAX = 9;

  document.addEventListener('mousemove', (e) => {
    $$('.tilt').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -60 || r.top > window.innerHeight + 60) return;
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      if (px < -0.3 || px > 1.3 || py < -0.3 || py > 1.3) {
        el.style.transform = '';
        return;
      }
      const rx = (0.5 - py) * MAX * 2;
      const ry = (px - 0.5) * MAX * 2;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    $$('.tilt').forEach((el) => { el.style.transform = ''; });
  });
}

/* =========================================================
   5. СВЕТЯЩИЙСЯ КУРСОР
   ========================================================= */
function initCursorGlow() {
  if (prefersReduced || window.matchMedia('(hover: none)').matches) return;
  const glow = $('#cursorGlow');
  if (!glow) return;

  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let tx = x, ty = y;

  document.body.classList.add('has-cursor');

  window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });

  (function loop() {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    glow.style.left = x + 'px';
    glow.style.top = y + 'px';
    requestAnimationFrame(loop);
  })();
}

/* =========================================================
   6. ПРОЕКТЫ: рендер, локальные проекты, модалка «Подробнее»
   ========================================================= */
const STORAGE_KEY = 'ab_portfolio_projects_v1';

const statusClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('готов')) return 'status--ready';
  if (s.includes('идея')) return 'status--idea';
  return 'status--dev';
};

const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

function getCustomProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomProjects(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

function allProjects() {
  const base = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];
  return base.concat(getCustomProjects());
}

function projectCard(p, index) {
  const tech = (p.tech || []).map((t) => `<li>${escapeHtml(t)}</li>`).join('');
  const featured = p.featured ? ' project--featured' : '';
  const link = p.link
    ? `<a class="project__btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">Открыть проект ↗</a>`
    : '';
  const del = p.custom
    ? `<button class="project__btn project__btn--del" data-delete="${escapeHtml(p.id)}">Удалить</button>`
    : '';

  return `
    <article class="project${featured} tilt reveal" data-project="${escapeHtml(p.id)}">
      ${p.featured ? '<div class="project__badge">Главный проект</div>' : ''}
      <div class="project__top">
        <div class="project__icon">${escapeHtml(p.icon || '📁')}</div>
        <span class="project__status ${statusClass(p.status)}">${escapeHtml(p.status || 'Проект')}</span>
      </div>
      <h3>${escapeHtml(p.title || 'Без названия')}</h3>
      <p>${escapeHtml(p.description || '')}</p>
      ${tech ? `<ul class="project__tech">${tech}</ul>` : '<div style="flex-grow:1"></div>'}
      <div class="project__actions">
        <button class="project__btn" data-details="${escapeHtml(p.id)}">Подробнее</button>
        ${link}
        ${del}
      </div>
    </article>`;
}

function renderProjects() {
  const grid = $('#projectsGrid');
  if (!grid) return;
  const list = allProjects();

  grid.innerHTML = list.length
    ? list.map(projectCard).join('')
    : '<p style="color:var(--dim)">Пока проектов нет — добавь первый!</p>';

  // перезапускаем reveal для новых карточек
  requestAnimationFrame(() => {
    $$('.project.reveal', grid).forEach((el, i) => {
      setTimeout(() => el.classList.add('revealed'), 60 + i * 70);
    });
  });
}

function openModal(modal) {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (!$('.modal.is-open')) document.body.style.overflow = '';
}

function initProjects() {
  renderProjects();

  const projectModal = $('#projectModal');
  const modalContent = $('#modalContent');

  // клики внутри сетки проектов
  $('#projectsGrid').addEventListener('click', (e) => {
    const detailsBtn = e.target.closest('[data-details]');
    const delBtn = e.target.closest('[data-delete]');

    if (detailsBtn) {
      const p = allProjects().find((x) => String(x.id) === detailsBtn.dataset.details);
      if (!p) return;
      const tech = (p.tech || []).map((t) => `<li>${escapeHtml(t)}</li>`).join('');
      modalContent.innerHTML = `
        <h3>${escapeHtml(p.icon || '📁')} ${escapeHtml(p.title)}</h3>
        <span class="project__status ${statusClass(p.status)}">${escapeHtml(p.status || '')}</span>
        <p style="margin-top:16px">${escapeHtml(p.details || p.description || '')}</p>
        ${tech ? `<ul class="project__tech">${tech}</ul>` : ''}
        ${p.link ? `
          <div class="project__linkbox">
            <a class="btn btn--primary" href="${escapeHtml(p.link)}" target="_blank" rel="noopener"><span>Открыть проект ↗</span></a>
            <p class="project__linkurl">${escapeHtml(p.link)}</p>
          </div>` : ''}
      `;
      openModal(projectModal);
    }

    if (delBtn) {
      const id = delBtn.dataset.delete;
      if (confirm('Удалить этот проект из портфолио?')) {
        saveCustomProjects(getCustomProjects().filter((x) => String(x.id) !== id));
        renderProjects();
      }
    }
  });

  // закрытие модалки
  $$('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close')) closeModal(modal);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.modal.is-open').forEach(closeModal);
  });
}

/* =========================================================
   СТАРТ
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initBackground();
  initNav();
  initReveal();
  initTilt();
  initCursorGlow();
  initProjects();
});
