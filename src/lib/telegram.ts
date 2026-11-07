import type { Lead } from './lead';

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
}

export async function sendLead(lead: Lead): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) throw new Error('telegram-missing');
  const lines = [
    'Permintaan Airport Transfer',
    `Waktu: ${lead.waktu}`,
    `Nama: ${lead.nama}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Layanan: ${lead.layanan}`,
    `Mobil: ${lead.mobil}`,
    `Bandara: ${lead.bandara}`,
    `Penerbangan: ${lead.penerbangan}`,
    `Landing: ${lead.landing}`,
    `Hotel: ${lead.hotel}`,
    `Penumpang: ${lead.penumpang}`,
    `Koper: ${lead.koper}`,
    `Driver Indonesia: ${lead.driverIndonesia ? 'Ya' : 'Tidak'}`,
    `Catatan: ${lead.catatan || '-'}`,
    `Kode promo: ${lead.promo || '-'}`,
    `UTM: ${lead.utm || '-'}`,
  ];
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n').slice(0, 3900) }),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error('Telegram gagal', response.status, detail.slice(0, 400));
    throw new Error('telegram');
  }
}
