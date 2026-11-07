import { navigate } from 'astro:transitions/client';
import { fleet } from '../data/fleet';

const KEY = 'at-penawaran';

type Draft = {
  mobil?: string;
  bandara?: string;
  penerbangan?: string;
  tanggal?: string;
  jam?: string;
  hotel?: string;
  penumpang?: number;
  koper?: number;
  driver?: boolean;
  nama?: string;
  whatsapp?: string;
  catatan?: string;
  consent?: boolean;
};

function load(): Draft {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}') as Draft;
  } catch {
    return {};
  }
}

function save(partial: Draft) {
  sessionStorage.setItem(KEY, JSON.stringify({ ...load(), ...partial }));
}

function stepOf(form: HTMLFormElement) {
  return Number(form.dataset.step || '1');
}

function showError(form: HTMLFormElement, message: string) {
  const el = form.querySelector<HTMLElement>('[data-error]');
  if (!el) return;
  el.hidden = !message;
  el.textContent = message;
}

function waDigits(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('62')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function waValid(value: string) {
  return /^8\d{7,12}$/.test(waDigits(value));
}

function field(form: HTMLFormElement, name: string) {
  return form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
}

function hydrate(form: HTMLFormElement) {
  const params = new URLSearchParams(location.search);
  const draft = load();
  const mobil = params.get('mobil') || draft.mobil || '';
  const mobilField = field(form, 'mobil') as HTMLSelectElement | null;
  if (mobilField && mobil) {
    const needle = mobil.trim().toLowerCase();
    const option = [...mobilField.options].find(
      (item) => item.value.toLowerCase() === needle || item.textContent?.trim().toLowerCase() === needle,
    );
    if (option) mobilField.value = option.value;
  }
  const set = (name: string, value: string | number | undefined) => {
    const input = field(form, name);
    if (input && value !== undefined && value !== '') input.value = String(value);
  };
  set('bandara', draft.bandara);
  set('penerbangan', draft.penerbangan);
  set('tanggal', draft.tanggal);
  set('jam', draft.jam);
  set('hotel', draft.hotel);
  set('penumpang', draft.penumpang ?? 1);
  set('koper', draft.koper ?? 0);
  set('nama', draft.nama);
  set('whatsapp', draft.whatsapp);
  set('catatan', draft.catatan);
  const driver = field(form, 'driver') as HTMLInputElement | null;
  if (driver) driver.checked = Boolean(draft.driver);
  const consent = field(form, 'consent') as HTMLInputElement | null;
  if (consent) consent.checked = Boolean(draft.consent);
  refreshWa(form);
}

function refreshWa(form: HTMLFormElement) {
  const input = field(form, 'whatsapp') as HTMLInputElement | null;
  if (!input) return;
  const control = input.closest('.control');
  const ok = form.querySelector<HTMLElement>('[data-wa-ok]');
  const valid = waValid(input.value);
  control?.classList.toggle('is-valid', valid);
  if (ok) ok.hidden = !valid;
}

function readTrip(form: HTMLFormElement): Draft | null {
  const mobil = (field(form, 'mobil') as HTMLSelectElement).value;
  const bandara = (field(form, 'bandara') as HTMLSelectElement).value;
  const penerbangan = (field(form, 'penerbangan') as HTMLInputElement).value.trim();
  const tanggal = (field(form, 'tanggal') as HTMLInputElement).value;
  const jam = (field(form, 'jam') as HTMLInputElement).value;
  const hotel = (field(form, 'hotel') as HTMLInputElement).value.trim();
  const penumpang = Number((field(form, 'penumpang') as HTMLInputElement).value);
  const koper = Number((field(form, 'koper') as HTMLInputElement).value);
  if (!mobil) return fail(form, 'Pilih kendaraan.');
  if (!bandara) return fail(form, 'Pilih bandara.');
  if (penerbangan.length < 2) return fail(form, 'Isi nomor penerbangan.');
  if (!tanggal || !jam) return fail(form, 'Isi tanggal dan jam landing.');
  if (hotel.length < 3) return fail(form, 'Isi alamat tujuan atau hotel.');
  if (!Number.isInteger(penumpang) || penumpang < 1) return fail(form, 'Jumlah penumpang wajib diisi.');
  showError(form, '');
  return {
    mobil,
    bandara,
    penerbangan,
    tanggal,
    jam,
    hotel,
    penumpang,
    koper: Number.isFinite(koper) ? koper : 0,
    driver: (field(form, 'driver') as HTMLInputElement).checked,
  };
}

function fail(form: HTMLFormElement, message: string) {
  showError(form, message);
  return null;
}

function go(step: number, mobil?: string) {
  const url = new URL(location.href);
  url.searchParams.set('langkah', String(step));
  if (mobil) url.searchParams.set('mobil', mobil);
  void navigate(`${url.pathname}${url.search}`);
}

function fillSummary() {
  const draft = load();
  const car = fleet.find((item) => item.slug === draft.mobil);
  const text = (key: string, value: string) => {
    const el = document.querySelector(`[data-sum="${key}"]`);
    if (el) el.textContent = value;
  };
  const landing = draft.tanggal && draft.jam ? `${draft.tanggal.split('-').reverse().join('/')} · ${draft.jam}` : '—';
  text('rute', `${draft.bandara || '—'} → ${draft.hotel || '—'}`);
  text('tanggal', landing);
  text('kendaraan', car?.name || '—');
  text('penumpang', `${draft.penumpang || 0} orang · ${draft.koper || 0} koper`);
  text('driver', draft.driver ? 'Bahasa Indonesia ✓' : 'Tidak diminta');
  const wa = draft.whatsapp ? `+62 ${waDigits(draft.whatsapp)}` : '';
  text('kontak', [draft.nama, wa].filter(Boolean).join(' · ') || '—');
  text('catatan', draft.catatan || '—');
}

async function playSuccess() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.getElementById('success-overlay');
  const art = document.getElementById('success-art');
  if (reduced || !overlay || !art) {
    goThanks();
    return;
  }
  overlay.hidden = false;
  try {
    const { playIn } = await import('./lottie-player');
    const anim = await playIn(art);
    await new Promise<void>((resolve) => {
      const timer = window.setTimeout(resolve, 1700);
      anim.addEventListener('complete', () => {
        window.clearTimeout(timer);
        resolve();
      });
    });
  } catch {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }
  goThanks();
}

function goThanks() {
  sessionStorage.removeItem(KEY);
  void navigate('/terima-kasih');
}

function trackSuccess() {
  window.umami?.track('penawaran_terkirim');
  const id = document.body.dataset.adsId;
  const conversion = document.body.dataset.adsConv;
  if (id && conversion && window.gtag) {
    window.gtag('event', 'conversion', { send_to: conversion.includes('/') ? conversion : `${id}/${conversion}` });
  }
}

function bind(form: HTMLFormElement) {
  if (form.dataset.bound === '1') return;
  form.dataset.bound = '1';
  hydrate(form);
  const step = stepOf(form);
  if (step > 1 && !load().bandara) {
    go(1);
    return;
  }
  if (step === 3) fillSummary();

  form.querySelectorAll<HTMLAnchorElement>('label a').forEach((anchor) => {
    anchor.addEventListener('click', (event) => event.stopPropagation());
  });

  form.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = field(form, button.dataset.for || '') as HTMLInputElement | null;
      if (!input) return;
      const next = Number(input.value) + Number(button.dataset.dir);
      const min = Number(input.min);
      const max = Number(input.max);
      input.value = String(Math.min(max, Math.max(min, next)));
    });
  });

  field(form, 'whatsapp')?.addEventListener('input', () => refreshWa(form));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (step === 1) {
      const trip = readTrip(form);
      if (!trip) return;
      save(trip);
      go(2, trip.mobil);
      return;
    }
    if (step === 2) {
      const nama = (field(form, 'nama') as HTMLInputElement).value.trim();
      const whatsapp = (field(form, 'whatsapp') as HTMLInputElement).value.trim();
      const consent = (field(form, 'consent') as HTMLInputElement).checked;
      if (nama.length < 2) return showError(form, 'Isi nama lengkap.');
      if (!waValid(whatsapp)) return showError(form, 'Nomor WhatsApp belum valid.');
      if (!consent) return showError(form, 'Setujui penggunaan data untuk dihubungi.');
      save({
        nama,
        whatsapp,
        catatan: (field(form, 'catatan') as HTMLTextAreaElement).value.trim(),
        consent,
      });
      showError(form, '');
      go(3, load().mobil);
      return;
    }

    const draft = load();
    const button = form.querySelector<HTMLButtonElement>('[data-submit]');
    if (button) button.disabled = true;
    showError(form, '');
    const response = await fetch('/api/penawaran', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        layanan: 'Airport Transfer',
        mobil: draft.mobil,
        bandara: draft.bandara,
        penerbangan: draft.penerbangan,
        tanggal: draft.tanggal,
        jam: draft.jam,
        hotel: draft.hotel,
        penumpang: draft.penumpang,
        koper: draft.koper,
        driverIndonesia: Boolean(draft.driver),
        nama: draft.nama,
        whatsapp: draft.whatsapp,
        catatan: draft.catatan || '',
        promo: document.body.dataset.promo || '',
        utm: document.body.dataset.utm || '',
        consent: true,
      }),
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!response.ok || !data?.ok) {
      if (button) button.disabled = false;
      showError(form, data?.error || 'Pengiriman gagal. Silakan coba lagi.');
      return;
    }
    trackSuccess();
    await playSuccess();
  });
}

function init() {
  const form = document.querySelector<HTMLFormElement>('#quote-form');
  if (!form) return;
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    void import('./lottie-player').then((mod) => mod.preload());
  }
  bind(form);
}

document.addEventListener('astro:page-load', init);
init();
