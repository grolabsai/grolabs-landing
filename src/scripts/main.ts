import '../styles/global.css';
import { renderFunnel } from './funnel';

// ============================================================
// Funnel diagram (Funnel Benchmark section)
// ============================================================
const funnelRoot = document.getElementById('funnel-root');
if (funnelRoot) renderFunnel(funnelRoot);

// ============================================================
// Footer year
// ============================================================
const footerYear = document.getElementById('footer-year');
if (footerYear) footerYear.textContent = String(new Date().getFullYear());

// ============================================================
// Magnetic effect + local mouse tracking on glass cards
// ============================================================
const cards = document.querySelectorAll<HTMLElement>('.glass-card');
cards.forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--card-x', `${x}%`);
    card.style.setProperty('--card-y', `${y}%`);
  });
});

// ============================================================
// Reveal on Scroll with Stagger
// ============================================================
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('active');
        }, index * 100);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 },
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// ============================================================
// Scroll Progress Indicator
// ============================================================
window.addEventListener('scroll', () => {
  const scrollPercent =
    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  const indicator = document.getElementById('scroll-indicator');
  if (indicator) indicator.style.height = `${scrollPercent}%`;
});

// ============================================================
// Subtle Background Particle Drift
// ============================================================
type ParticleData = {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
};

const particlesContainer = document.getElementById('particles-container');
if (particlesContainer) {
  const particleCount = 40;
  const particles: ParticleData[] = [];

  function createParticle(): ParticleData {
    const el = document.createElement('div');
    el.className = 'particle';
    const size = Math.random() * 2 + 1;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    const opacity = Math.random() * 0.3 + 0.1;
    el.style.opacity = String(opacity);
    particlesContainer!.appendChild(el);

    return {
      el,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      opacity,
    };
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(createParticle());
  }

  function updateParticles() {
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = window.innerWidth;
      if (p.x > window.innerWidth) p.x = 0;
      if (p.y < 0) p.y = window.innerHeight;
      if (p.y > window.innerHeight) p.y = 0;

      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    });
    requestAnimationFrame(updateParticles);
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    updateParticles();
  }
}

// ============================================================
// Luminous Equation — reveal the Returns block once the section is 50%
// into the viewport. 400 ms delay so the user reads the baseline equation
// (Traffic × Conversion = Revenue) before the disruption injects "− Returns".
// ============================================================
const revenueEquation = document.getElementById('revenue-equation');
const returnsReveal = document.getElementById('returns-reveal');
if (revenueEquation && returnsReveal) {
  const equationObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => {
          returnsReveal.classList.add('revealed');
        }, 400);
        equationObserver.unobserve(entry.target);
      });
    },
    { root: null, threshold: 0.5 },
  );
  equationObserver.observe(revenueEquation);
}
