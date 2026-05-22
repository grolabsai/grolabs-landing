// Compound growth chart — 5 vertical bars showing L1 baseline through 1.85× lift.

type Bar = { label: string; sublabel: string; value: number; highlight: boolean };

const BARS: Bar[] = [
  { label: 'Today', sublabel: '1.00×', value: 1.0, highlight: false },
  { label: '+10% stage 1', sublabel: '1.10×', value: 1.1, highlight: false },
  { label: '+10% stage 2', sublabel: '1.21×', value: 1.21, highlight: false },
  { label: '+10% stage 3', sublabel: '1.46×', value: 1.46, highlight: false },
  { label: '+10% all 5', sublabel: '1.85×', value: 1.85, highlight: true },
];

export function renderGrowthChart(root: HTMLElement): void {
  const VIEWBOX_W = 560;
  const VIEWBOX_H = 360;
  const PADDING_X = 40;
  const PADDING_TOP = 30;
  const PADDING_BOTTOM = 70;

  const chartWidth = VIEWBOX_W - PADDING_X * 2;
  const chartHeight = VIEWBOX_H - PADDING_TOP - PADDING_BOTTOM;
  const max = 2.0;
  const barCount = BARS.length;
  const slotWidth = chartWidth / barCount;
  const barWidth = slotWidth * 0.55;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', 'auto');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Compound growth chart — 10% gain per stage compounds to 1.85× total lift');

  // Gridlines + labels (y axis: 1.00× → 2.00×)
  const yTicks = [1.0, 1.25, 1.5, 1.75, 2.0];
  yTicks.forEach((tick) => {
    const y = PADDING_TOP + (1 - (tick - 1) / (max - 1)) * chartHeight;

    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', String(PADDING_X));
    line.setAttribute('x2', String(VIEWBOX_W - PADDING_X));
    line.setAttribute('y1', String(y));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', 'rgba(255,255,255,0.05)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', String(PADDING_X - 10));
    label.setAttribute('y', String(y + 4));
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', '#6b6b73');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-family', 'Hanken Grotesk, system-ui, sans-serif');
    label.textContent = `${tick.toFixed(2)}×`;
    svg.appendChild(label);
  });

  // Bars
  BARS.forEach((bar, i) => {
    const barX = PADDING_X + slotWidth * i + (slotWidth - barWidth) / 2;
    const barH = ((bar.value - 1) / (max - 1)) * chartHeight;
    const barY = PADDING_TOP + chartHeight - barH;

    const fill = bar.highlight ? '#fae194' : '#33333a';
    const stroke = bar.highlight ? '#fae194' : '#43434a';

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', String(barX));
    rect.setAttribute('y', String(barY));
    rect.setAttribute('width', String(barWidth));
    rect.setAttribute('height', String(Math.max(barH, 2)));
    rect.setAttribute('rx', '6');
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', stroke);
    rect.setAttribute('stroke-width', '1');
    svg.appendChild(rect);

    // Value label above bar
    const value = document.createElementNS(svgNS, 'text');
    value.setAttribute('x', String(barX + barWidth / 2));
    value.setAttribute('y', String(barY - 10));
    value.setAttribute('text-anchor', 'middle');
    value.setAttribute('fill', bar.highlight ? '#fae194' : '#a3a3aa');
    value.setAttribute('font-size', '14');
    value.setAttribute('font-weight', '500');
    value.setAttribute('font-family', 'Hanken Grotesk, system-ui, sans-serif');
    value.textContent = bar.sublabel;
    svg.appendChild(value);

    // Stage label below bar
    const stageLabel = document.createElementNS(svgNS, 'text');
    stageLabel.setAttribute('x', String(barX + barWidth / 2));
    stageLabel.setAttribute('y', String(PADDING_TOP + chartHeight + 24));
    stageLabel.setAttribute('text-anchor', 'middle');
    stageLabel.setAttribute('fill', bar.highlight ? '#fae194' : '#8b8b95');
    stageLabel.setAttribute('font-size', '11');
    stageLabel.setAttribute('font-family', 'Hanken Grotesk, system-ui, sans-serif');
    stageLabel.textContent = bar.label;
    svg.appendChild(stageLabel);
  });

  // Caption
  const caption = document.createElement('p');
  caption.className = 'mt-6 text-sm text-neutral-500';
  caption.textContent = 'Five stages, +10% each. The lift multiplies — it doesn’t add.';

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'relative overflow-hidden rounded-3xl bg-zinc-card p-8';
  wrapper.style.backgroundImage =
    'radial-gradient(ellipse 60% 50% at 80% 0%, rgba(250, 225, 148, 0.06) 0%, transparent 70%)';

  const svgHost = document.createElement('div');
  svgHost.appendChild(svg);
  wrapper.appendChild(svgHost);
  wrapper.appendChild(caption);

  root.innerHTML = '';
  root.appendChild(wrapper);
}
