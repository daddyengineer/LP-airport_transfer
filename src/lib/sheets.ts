import crypto from 'node:crypto';
import { leadRow, sheetHeader, type Lead } from './lead';

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

let tokenCache: { token: string; exp: number } | null = null;

export function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SHEETS_ID?.trim();
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw || !json) return null;
  try {
    const parsed = JSON.parse(json) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key) return null;
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  } catch {
    console.error('Google service account JSON tidak valid');
    return null;
  }
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

async function accessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp > now + 60) return tokenCache.token;
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  signer.end();
  const assertion = `${header}.${claim}.${signer.sign(account.private_key).toString('base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!response.ok) {
    console.error('Google token gagal', response.status);
    throw new Error('sheet');
  }
  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error('sheet');
  tokenCache = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return data.access_token;
}

async function sheetTitle(id: string, token: string): Promise<string> {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?fields=sheets.properties.title`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    console.error('Google sheet metadata gagal', response.status);
    throw new Error('sheet');
  }
  const data = (await response.json()) as { sheets?: { properties?: { title?: string } }[] };
  const title = data.sheets?.[0]?.properties?.title;
  if (!title) throw new Error('sheet');
  return title;
}

async function append(id: string, token: string, title: string, row: string[]) {
  const range = encodeURIComponent(`${title}!A1`);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    },
  );
  if (!response.ok) {
    console.error('Google sheet append gagal', response.status);
    throw new Error('sheet');
  }
}

async function firstCell(id: string, token: string, title: string): Promise<string> {
  const range = encodeURIComponent(`${title}!A1`);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${range}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (response.status === 200) {
    const data = (await response.json()) as { values?: string[][] };
    return data.values?.[0]?.[0] || '';
  }
  if (response.status === 400 || response.status === 404) return '';
  console.error('Google sheet baca gagal', response.status);
  throw new Error('sheet');
}

export async function appendLead(lead: Lead): Promise<void> {
  const account = readServiceAccount();
  const id = process.env.GOOGLE_SHEETS_ID?.trim();
  if (!account || !id) throw new Error('unconfigured');
  const token = await accessToken(account);
  const title = await sheetTitle(id, token);
  const head = await firstCell(id, token, title);
  if (!head) await append(id, token, title, sheetHeader());
  await append(id, token, title, leadRow(lead));
}
