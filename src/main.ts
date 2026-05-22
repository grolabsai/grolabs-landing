import './style.css';
import { renderFunnel } from './funnel';
import { renderGrowthChart } from './growth-chart';

const funnelRoot = document.getElementById('funnel-root');
if (funnelRoot) renderFunnel(funnelRoot);

const chartRoot = document.getElementById('growth-chart');
if (chartRoot) renderGrowthChart(chartRoot);

const footerYear = document.getElementById('footer-year');
if (footerYear) footerYear.textContent = String(new Date().getFullYear());

// Reveal-on-scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
