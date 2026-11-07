import { PROMO_END } from '../lib/tracking';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function render(root: HTMLElement) {
  const end = Date.parse(root.dataset.end || PROMO_END);
  const live = root.querySelector<HTMLElement>('[data-live]');
  const ended = root.querySelector<HTMLElement>('[data-ended]');
  if (!live || !ended) return;
  const diff = end - Date.now();
  if (diff <= 0) {
    live.hidden = true;
    ended.hidden = false;
    return;
  }
  live.hidden = false;
  ended.hidden = true;
  const total = Math.floor(diff / 1000);
  const parts: Record<string, number> = {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
  for (const [unit, value] of Object.entries(parts)) {
    const el = root.querySelector(`[data-unit="${unit}"]`);
    if (el) el.textContent = unit === 'd' ? String(value) : pad(value);
  }
}

let timer = 0;

export function bootCountdown() {
  window.clearInterval(timer);
  const roots = document.querySelectorAll<HTMLElement>('[data-countdown]');
  const tick = () => roots.forEach(render);
  tick();
  timer = window.setInterval(tick, 1000);
}
