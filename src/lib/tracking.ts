export const PROMO_CODE = 'AKHIRTAHUN26';
export const PROMO_END = '2026-12-29T23:59:00+07:00';

export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type UtmMap = Partial<Record<(typeof UTM_KEYS)[number], string>>;

function clean(value: string): string {
  return value.replace(/[\r\n;|]/g, ' ').trim().slice(0, 180);
}

export function utmFromUrl(url: URL): UtmMap {
  const out: UtmMap = {};
  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key);
    if (value) {
      const cleaned = clean(value);
      if (cleaned) out[key] = cleaned;
    }
  }
  return out;
}

export function formatUtm(utm: UtmMap): string {
  return UTM_KEYS.filter((key) => utm[key]).map((key) => `${key}=${utm[key]}`).join(' | ');
}

export function parseUtm(value: string): UtmMap {
  const out: UtmMap = {};
  if (!value) return out;
  for (const part of value.split(' | ')) {
    const index = part.indexOf('=');
    if (index < 1) continue;
    const key = part.slice(0, index) as (typeof UTM_KEYS)[number];
    if (!UTM_KEYS.includes(key)) continue;
    const cleaned = clean(part.slice(index + 1));
    if (cleaned) out[key] = cleaned;
  }
  return out;
}

export function promoFromUrl(url: URL): string {
  const direct = ['promo', 'kode', 'kode_promo'].map((key) => url.searchParams.get(key));
  const utmValues = UTM_KEYS.map((key) => url.searchParams.get(key));
  for (const value of [...direct, ...utmValues]) {
    if (value && value.trim().toUpperCase() === PROMO_CODE) return PROMO_CODE;
  }
  if (url.search.toUpperCase().includes(PROMO_CODE)) return PROMO_CODE;
  return '';
}

export function trackHref(
  path: string,
  locals: { utm?: string; promo?: string },
  extra?: Record<string, string>,
): string {
  const url = new URL(path, 'https://airtransfer.travelkif.com');
  const utm = parseUtm(locals.utm || '');
  for (const key of UTM_KEYS) {
    if (utm[key] && !url.searchParams.has(key)) url.searchParams.set(key, utm[key]);
  }
  if (locals.promo && !url.searchParams.has('promo')) url.searchParams.set('promo', locals.promo);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ''}`;
}

export function siteUrl(): string {
  return (process.env.PUBLIC_SITE_URL || 'https://airtransfer.travelkif.com').replace(/\/$/, '');
}

export function adsConfig(): { id: string; conversion: string } {
  const safe = (value: string) => (/^[A-Za-z0-9_./-]{1,80}$/.test(value) ? value : '');
  return {
    id: safe((process.env.PUBLIC_GOOGLE_ADS_ID || '').trim()),
    conversion: safe((process.env.PUBLIC_GOOGLE_ADS_CONVERSION || '').trim()),
  };
}
