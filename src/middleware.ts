import { defineMiddleware } from 'astro:middleware';
import { PROMO_CODE, formatUtm, parseUtm, promoFromUrl, utmFromUrl } from './lib/tracking';

const cookieBase = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
};

export const onRequest = defineMiddleware(async (context, next) => {
  const secure = context.url.protocol === 'https:';
  const storedRaw = context.cookies.get('atk_utm')?.value || '';
  let stored = storedRaw;
  try {
    stored = decodeURIComponent(storedRaw);
  } catch {
    stored = storedRaw;
  }
  const merged = { ...parseUtm(stored), ...utmFromUrl(context.url) };
  const utm = formatUtm(merged);
  if (utm && utm !== stored) {
    context.cookies.set('atk_utm', encodeURIComponent(utm), { ...cookieBase, secure });
  }

  const storedPromo = context.cookies.get('atk_promo')?.value === PROMO_CODE ? PROMO_CODE : '';
  const promo = promoFromUrl(context.url) || storedPromo;
  if (promo && promo !== storedPromo) {
    context.cookies.set('atk_promo', promo, { ...cookieBase, secure });
  }

  context.locals.utm = utm;
  context.locals.promo = promo;
  return next();
});
