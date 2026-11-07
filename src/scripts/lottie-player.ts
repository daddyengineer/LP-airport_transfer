type LottiePlayer = {
  loadAnimation: (options: Record<string, unknown>) => { addEventListener: (name: string, cb: () => void) => void };
};

let player: LottiePlayer | null = null;

async function library(): Promise<LottiePlayer> {
  if (!player) {
    const mod = await import('lottie-web/build/player/lottie_light');
    player = (mod.default ?? mod) as LottiePlayer;
  }
  return player;
}

export function preload() {
  void library();
  void fetch('/lottie/success.json');
}

const jobs = new WeakMap<HTMLElement, number>();

export async function playIn(container: HTMLElement) {
  const id = (jobs.get(container) || 0) + 1;
  jobs.set(container, id);
  const lottie = await library();
  if (jobs.get(container) !== id) {
    return { addEventListener() {} };
  }
  container.replaceChildren();
  const host = document.createElement('div');
  host.style.width = '120px';
  host.style.height = '120px';
  container.append(host);
  return lottie.loadAnimation({
    container: host,
    renderer: 'svg',
    loop: false,
    autoplay: true,
    path: '/lottie/success.json',
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
  });
}
