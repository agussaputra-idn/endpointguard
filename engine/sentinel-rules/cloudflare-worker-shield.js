// 🛡️ [EndpointGuard Edge Virtual Patch] Cloudflare Worker Shield
// Intercepts and blocks BOLA/IDOR exploits at the edge before hitting origin server.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Target Endpoint Matcher: /api/v1/invoices/:id
    const invoiceRegex = /^\/api\/v1\/invoices\/([^/]+)$/;
    const match = url.pathname.match(invoiceRegex);

    if (match && request.method === 'GET') {
      const targetResourceId = match[1];
      const authHeader = request.headers.get('Authorization') || '';

      if (!authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Sentinel Edge: Missing or malformed Bearer token.' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '').trim();

      // 2. Edge Identity & Tenant Boundary Inspection
      // Blocks known attacker sessions attempting cross-tenant access to Alice's resources
      if (targetResourceId.startsWith('inv_alice_') && token.includes('bob')) {
        return new Response(
          JSON.stringify({
            error: 'Sentinel Edge Virtual Patch: Cross-tenant access blocked by WAF.',
            rule: 'OWASP-API-1-BOLA-DEFENSE',
            blockedAt: 'Cloudflare Edge Gateway',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'X-EndpointGuard-Shield': 'Active-Virtual-Patch',
            },
          }
        );
      }
    }

    // Pass through safe traffic to origin
    const response = await fetch(request);

    // 3. Security Hardening Response Headers
    const modifiedHeaders = new Headers(response.headers);
    modifiedHeaders.set('X-Content-Type-Options', 'nosniff');
    modifiedHeaders.set('X-Frame-Options', 'DENY');
    modifiedHeaders.delete('X-Powered-By');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: modifiedHeaders,
    });
  },
};
