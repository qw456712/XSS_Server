import { authorized, getEventStore, json } from './_shared.js';

export default async (request) => {
  if (request.method !== 'GET') return json(405, { ok: false, error: 'method_not_allowed' });
  if (!authorized(request)) return json(401, { ok: false, error: 'unauthorized' });

  const store = getEventStore();
  const listing = await store.list({ prefix: 'events/' });
  const selected = listing.blobs.slice(-200).reverse();
  const events = [];
  for (const item of selected) {
    const value = await store.get(item.key, { type: 'json' });
    if (value) events.push(value);
  }
  return json(200, { ok: true, events });
};
