import { authorized, getEventStore, json } from './_shared.js';

export default async (request) => {
  if (request.method !== 'DELETE') return json(405, { ok: false, error: 'method_not_allowed' });
  if (!authorized(request)) return json(401, { ok: false, error: 'unauthorized' });

  const store = getEventStore();
  const listing = await store.list({ prefix: 'events/' });
  await Promise.all(listing.blobs.map((item) => store.delete(item.key)));
  return json(200, { ok: true, deleted: listing.blobs.length });
};
