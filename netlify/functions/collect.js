import { getEventStore, json, sanitizeText } from './_shared.js';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('', {
      status: 204,
      headers: {
        'access-control-allow-origin': ALLOWED_ORIGIN,
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      },
    });
  }

  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  // Deliberately reject common sensitive-data fields.
  const forbidden = ['cookie', 'cookies', 'authorization', 'password', 'token', 'localstorage', 'sessionstorage', 'html', 'dom'];
  const keys = Object.keys(payload || {}).map((key) => key.toLowerCase());
  if (forbidden.some((name) => keys.includes(name))) {
    return json(400, { ok: false, error: 'sensitive_field_rejected' });
  }

  const campaign = sanitizeText(payload.campaign, 80);
  if (!campaign || !/^[a-zA-Z0-9._-]{1,80}$/.test(campaign)) {
    return json(400, { ok: false, error: 'invalid_campaign' });
  }

  const event = {
    id: crypto.randomUUID(),
    campaign,
    type: sanitizeText(payload.type || 'xss-executed', 40),
    page: sanitizeText(payload.page, 500),
    referrer: sanitizeText(payload.referrer, 500),
    note: sanitizeText(payload.note, 160),
    userAgent: sanitizeText(request.headers.get('user-agent'), 300),
    receivedAt: new Date().toISOString(),
  };

  const store = getEventStore();
  await store.setJSON(`events/${event.receivedAt}_${event.id}`, event);

  return json(201, { ok: true, eventId: event.id }, {
    'access-control-allow-origin': ALLOWED_ORIGIN,
  });
};
