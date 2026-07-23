import { getStore } from '@netlify/blobs';

export const STORE_NAME = 'authorized-security-events';

export function json(statusCode, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function authorized(request) {
  const expected = process.env.DASHBOARD_TOKEN;
  const supplied = request.headers.get('x-dashboard-token');
  return Boolean(expected && supplied && supplied === expected);
}

export function sanitizeText(value, max = 300) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, max);
}

export function getEventStore() {
  return getStore(STORE_NAME);
}
