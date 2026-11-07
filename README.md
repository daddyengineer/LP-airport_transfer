# Airport Transfer Paris

Situs mobile TravelKIF untuk permintaan penawaran antar-jemput bandara CDG, Orly, dan Beauvais.

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
node ./dist/server/entry.mjs
```

Variabel lingkungan ada di `.env.example`. Isi nilainya di host, jangan di repo. `PUBLIC_SITE_URL` untuk kanonikal. Google Ads hanya dimuat jika `PUBLIC_GOOGLE_ADS_ID` terisi. Pengiriman lead butuh `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `TELEGRAM_BOT_TOKEN`, dan `TELEGRAM_CHAT_ID`.
