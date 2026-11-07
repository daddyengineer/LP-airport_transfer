import type { APIRoute } from 'astro';
import { parseLead } from '../../lib/lead';
import { appendLead, readServiceAccount } from '../../lib/sheets';
import { sendLead } from '../../lib/telegram';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 20_000) return json({ ok: false, error: 'Data terlalu besar.' }, 413);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Data tidak valid.' }, 400);
  }

  let cookieUtm = cookies.get('atk_utm')?.value || '';
  try {
    cookieUtm = decodeURIComponent(cookieUtm);
  } catch {
    cookieUtm = '';
  }
  const cookiePromo = cookies.get('atk_promo')?.value === 'AKHIRTAHUN26' ? 'AKHIRTAHUN26' : '';
  const parsed = parseLead(payload, cookieUtm, cookiePromo);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  if (!readServiceAccount()) {
    return json({ ok: false, error: 'Pengiriman belum aktif.' }, 503);
  }

  try {
    await appendLead(parsed.lead);
  } catch (error) {
    console.error('Sheet gagal', error instanceof Error ? error.message : 'unknown');
    return json({ ok: false, error: 'Pengiriman gagal. Silakan coba lagi.' }, 502);
  }

  try {
    await sendLead(parsed.lead);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown';
    if (reason === 'telegram-missing') {
      console.error('Telegram gagal: token atau chat id belum diisi');
    } else {
      console.error('Telegram gagal setelah sheet berhasil');
    }
  }

  return json({ ok: true });
};

export const ALL: APIRoute = () => json({ ok: false, error: 'Gunakan POST.' }, 405);
