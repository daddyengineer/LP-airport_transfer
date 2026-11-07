const videos = () => [...document.querySelectorAll<HTMLVideoElement>('[data-testi-video]')];
let observer: IntersectionObserver | null = null;

function ensureSrc(video: HTMLVideoElement) {
  if (video.getAttribute('src') || !video.dataset.src) return;
  video.src = video.dataset.src;
  video.load();
}

async function start(video: HTMLVideoElement, withSound: boolean) {
  video.muted = !withSound;
  try {
    await video.play();
  } catch {
    video.muted = true;
    await video.play().catch(() => undefined);
  }
}

function mount() {
  observer?.disconnect();
  const items = videos();
  if (!items.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ratios = new WeakMap<HTMLVideoElement, number>();

  const sync = () => {
    let best: HTMLVideoElement | null = null;
    let bestRatio = 0;
    for (const video of items) {
      const ratio = ratios.get(video) ?? 0;
      if (ratio > bestRatio) {
        best = video;
        bestRatio = ratio;
      }
    }
    for (const video of items) {
      const visible = video === best && bestRatio >= 0.6;
      if (!visible) video.dataset.ended = '';
      if (visible && !reduced && video.dataset.userPaused !== '1' && video.dataset.ended !== '1') {
        ensureSrc(video);
        if (video.paused) void start(video, video.dataset.sound === '1');
      } else if (!video.paused) {
        video.pause();
      }
    }
  };

  for (const video of items) {
    if (video.dataset.bound === '1') continue;
    video.dataset.bound = '1';
    video.addEventListener('playing', () => {
      video.dataset.playing = '1';
    });
    video.addEventListener('ended', () => {
      video.dataset.ended = '1';
    });
    const toggle = () => {
      ensureSrc(video);
      if (video.paused) {
        video.dataset.userPaused = '';
        video.dataset.ended = '';
        video.dataset.sound = '1';
        void start(video, true);
        return;
      }
      if (video.muted) {
        video.dataset.sound = '1';
        video.muted = false;
        return;
      }
      video.pause();
      video.dataset.userPaused = '1';
    };
    video.addEventListener('click', toggle);
    video.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        ratios.set(video, entry.intersectionRatio);
        if (entry.isIntersecting) ensureSrc(video);
      }
      sync();
    },
    { threshold: [0, 0.6, 1] },
  );
  for (const video of items) observer.observe(video);
}

document.addEventListener('astro:page-load', mount);
mount();
