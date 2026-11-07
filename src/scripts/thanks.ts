function mount() {
  const art = document.querySelector<HTMLElement>('[data-lottie]');
  if (!art || art.dataset.booted === '1') return;
  art.dataset.booted = '1';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  void import('../scripts/lottie-player').then((mod) => mod.playIn(art));
}

document.addEventListener('astro:page-load', mount);
mount();
