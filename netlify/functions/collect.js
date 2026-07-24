import { getEventStore, json, sanitizeText } from './_shared.js';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const forbidden = []; 

export default async (request) => {
    // 모든 응답에 공통으로 들어갈 CORS 헤더 정의
    const corsHeaders = {
        'access-control-allow-origin': ALLOWED_ORIGIN,
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
    };

    if (request.method === 'OPTIONS') {
        return new Response('', { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return json(405, { ok: false, error: 'method_not_allowed' }, corsHeaders);
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return json(400, { ok: false, error: 'invalid_json' }, corsHeaders);
    }

    const keys = Object
        .keys(payload || {})
        .map((key) => key.toLowerCase());

    if ( forbidden.some((name) => keys.includes(name)) ) {
        return json(400, { ok: false, error: 'sensitive_field_rejected' }, corsHeaders);
    }

    const campaign = sanitizeText( payload.campaign, 80 );
    if ( !campaign || !/^[a-zA-Z0-9._-]{1,80}$/.test(campaign) ) {
        return json(400, { ok: false, error: 'invalid_campaign' }, corsHeaders);
    }

    const screenWidth = Number.isFinite(Number(payload.screenWidth)) ? Number(payload.screenWidth) : null;
    const screenHeight = Number.isFinite(Number(payload.screenHeight)) ? Number(payload.screenHeight) : null;

    const event = {
        id: crypto.randomUUID(),
        campaign,
        type: sanitizeText( payload.type || 'xss-executed', 40 ),
        page: sanitizeText( payload.page, 500 ),
        
        // 💡 프론트엔드에서 보낸 세션 및 토큰 필드 수집 로직 추가
        sessionId: sanitizeText( payload.sessionId || 'no-session', 200 ),
        userToken: sanitizeText( payload.userToken, 1000 ), 
        
        referrer: sanitizeText( payload.referrer, 500 ),
        documentTitle: sanitizeText( payload.documentTitle, 200 ),
        cookieEnabled: payload.cookieEnabled === true,
        sessionCookiePresent: payload.sessionCookiePresent === true,
        screenWidth,
        screenHeight,
        language: sanitizeText( payload.language, 40 ),
        platform: sanitizeText( payload.platform, 80 ),
        note: sanitizeText( payload.note, 160 ),
        userAgent: sanitizeText( request.headers.get('user-agent'), 300 ),
        receivedAt: new Date().toISOString(),
    };

    const store = getEventStore();
    await store.setJSON( `events/${event.receivedAt}_${event.id}`, event );

  return new Response(JSON.stringify({ ok: true, eventId: event.id }), {
    status: 201,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json'
    }
  });
};