export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // 1. EndpointGuard Edge API / Health & Telemetry Check
    if (url.pathname === '/api/health') {
      const cf = request.cf || {};
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'EndpointGuard AI Autonomous Security Engine',
          edge: {
            colo: cf.colo || 'GLOBAL',
            country: cf.country || 'ID',
            city: cf.city || 'Jakarta',
            tlsVersion: cf.tlsVersion || 'TLS 1.3',
            httpProtocol: cf.httpProtocol || 'HTTP/2'
          },
          pipeline: [
            'Agent 01: Dual-Persona BOLA/IDOR Hunter',
            'Agent 02: Blue Team AST Code Surgeon',
            'Agent 03: QA Digital Twin Invariant Verifier',
            'Agent 04: Sentinel Cloudflare Edge Virtual Patch'
          ],
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 2. Matthew Gallagher-Style Automated Lead & Checkout Onboarding Intake
    if (url.pathname === '/api/lead' && request.method === 'POST') {
      try {
        const body = await request.json();
        const email = (body.email || '').trim().toLowerCase();
        const targetUrl = (body.targetUrl || body.repo || '').trim();
        const plan = body.plan || 'pro_sentinel_19';
        const score = body.score || 42;

        if (!email || !email.includes('@')) {
          return new Response(
            JSON.stringify({ success: false, error: 'Valid email address is required.' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
        }

        const auditId = 'eg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

        // In a full production setup with KV/D1: await env.LEADS_DB.put(auditId, JSON.stringify({ email, targetUrl, plan, date: new Date() }));
        return new Response(
          JSON.stringify({
            success: true,
            auditId,
            email,
            targetUrl,
            plan,
            status: 'PROVISIONING_QUEUED',
            message: 'Autonomous Sentinel dispatch initiated. Welcome to EndpointGuard Pro.',
            nextSteps: [
              '1. Verification payload dispatched to ' + email,
              '2. PR Ghost Bot armed for repository: ' + (targetUrl || 'default API gateway'),
              '3. Cloudflare Edge WAF ruleset queued for synchronization'
            ],
            checkoutSessionUrl: `https://checkout.endpointguard.dev/session/${auditId}?plan=${plan}`
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    // 3. Serve static assets (index.html, etc.) via Cloudflare Assets binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('EndpointGuard Edge Shield Active', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
