import './style.css';
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
// Ambient grid + hero glow follow the mouse
// ============================================================
const heroGlow = document.getElementById('hero-glow');
document.addEventListener('mousemove', (e) => {
  const xPercent = (e.clientX / window.innerWidth) * 100;
  const yPercent = (e.clientY / window.innerHeight) * 100;

  document.documentElement.style.setProperty('--grid-x', `${xPercent}%`);
  document.documentElement.style.setProperty('--grid-y', `${yPercent}%`);

  if (heroGlow) {
    const mx = (e.clientX / window.innerWidth - 0.5) * 60;
    const my = (e.clientY / window.innerHeight - 0.5) * 60;
    heroGlow.style.transform = `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px))`;
  }
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
// Interactive Tab Buttons (Apps & sites tab strip)
// ============================================================
const tabButtons = document.querySelectorAll<HTMLButtonElement>('button.rounded-full');
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => {
      b.classList.remove('bg-primary', 'text-on-primary', 'scale-105');
      b.classList.add('border', 'border-zinc-700', 'text-zinc-400');
    });
    btn.classList.add('bg-primary', 'text-on-primary', 'scale-105');
    btn.classList.remove('border', 'border-zinc-700', 'text-zinc-400');
  });
});
