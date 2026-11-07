import { airportByValue, mobilByValue } from '../data/fleet';

export type Lead = {
  waktu: string;
  layanan: string;
  mobil: string;
  bandara: string;
  penerbangan: string;
  landing: string;
  hotel: string;
  penumpang: number;
  koper: number;
  driverIndonesia: boolean;
  nama: string;
  whatsapp: string;
  catatan: string;
  promo: string;
  utm: string;
};

const HEADER = [
  'waktu',
  'layanan',
  'mobil',
  'bandara',
  'penerbangan',
  'landing',
  'hotel',
  'penumpang',
  'koper',
  'driver Indonesia',
  'nama',
  'WhatsApp',
  'catatan',
  'kode promo',
  'UTM',
] as const;

export function leadRow(lead: Lead): string[] {
  return [
    lead.waktu,
    lead.layanan,
    lead.mobil,
    lead.bandara,
    lead.penerbangan,
    lead.landing,
    lead.hotel,
    String(lead.penumpang),
    String(lead.koper),
    lead.driverIndonesia ? 'Ya' : 'Tidak',
    lead.nama,
    lead.whatsapp,
    lead.catatan,
    lead.promo,
    lead.utm,
  ];
}

export function sheetHeader(): string[] {
  return [...HEADER];
}

function text(value: unknown, max: number): string {
  return String(value ?? '').replace(/[\u0000-\u001F]/g, ' ').trim().slice(0, max);
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function normalizeWhatsapp(value: string): string | null {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('62')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^8\d{7,12}$/.test(digits)) return null;
  return `+62${digits}`;
}

export function formatLanding(date: string, time: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year} · ${time}`;
}

export function waktuJakarta(now = new Date()): string {
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  return `${formatted} WIB`;
}

export function parseLead(input: unknown, utmFallback = '', promoFallback = ''): { ok: true; lead: Lead } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Data tidak lengkap.' };
  const body = { ...(input as Record<string, unknown>) };
  delete body.email;

  const layanan = text(body.layanan, 40);
  if (layanan !== 'Airport Transfer') return { ok: false, error: 'Layanan harus Airport Transfer.' };

  const mobil = mobilByValue(text(body.mobil, 80));
  if (!mobil) return { ok: false, error: 'Pilih kendaraan.' };

  const bandara = airportByValue(text(body.bandara, 40));
  if (!bandara) return { ok: false, error: 'Pilih bandara CDG, Orly, atau Beauvais.' };

  const penerbangan = text(body.penerbangan, 20);
  if (penerbangan.length < 2) return { ok: false, error: 'Isi nomor penerbangan.' };

  const tanggal = text(body.tanggal, 10);
  const jam = text(body.jam, 5);
  if (!validDate(tanggal) || !validTime(jam)) return { ok: false, error: 'Isi tanggal dan jam landing.' };

  const hotel = text(body.hotel, 300);
  if (hotel.length < 3) return { ok: false, error: 'Isi alamat tujuan atau hotel.' };

  const penumpang = Number(body.penumpang);
  const koper = Number(body.koper);
  if (!Number.isInteger(penumpang) || penumpang < 1 || penumpang > 16) {
    return { ok: false, error: 'Jumlah penumpang wajib diisi.' };
  }
  if (!Number.isInteger(koper) || koper < 0 || koper > 30) {
    return { ok: false, error: 'Jumlah koper tidak valid.' };
  }

  const nama = text(body.nama, 120);
  if (nama.length < 2) return { ok: false, error: 'Isi nama lengkap.' };

  const whatsapp = normalizeWhatsapp(text(body.whatsapp, 24));
  if (!whatsapp) return { ok: false, error: 'Nomor WhatsApp belum valid.' };

  if (body.consent !== true) return { ok: false, error: 'Setujui penggunaan data untuk dihubungi.' };

  const promoRaw = text(body.promo, 32).toUpperCase();
  const promo = promoRaw === 'AKHIRTAHUN26' ? 'AKHIRTAHUN26' : promoFallback === 'AKHIRTAHUN26' ? 'AKHIRTAHUN26' : '';

  return {
    ok: true,
    lead: {
      waktu: waktuJakarta(),
      layanan,
      mobil: mobil.name,
      bandara: bandara.id,
      penerbangan,
      landing: formatLanding(tanggal, jam),
      hotel,
      penumpang,
      koper,
      driverIndonesia: body.driverIndonesia === true,
      nama,
      whatsapp,
      catatan: text(body.catatan, 1000),
      promo,
      utm: text(body.utm, 500) || utmFallback.slice(0, 500),
    },
  };
}
