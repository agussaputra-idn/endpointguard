import { dispatchMockRequest } from '../mockVulnerableApi.js';

export class EdgeGatewaySimulator {
  /**
   * Simulates an edge gateway running the synthesized Cloudflare Worker Virtual Patch.
   */
  static handleEdgeRequest(method, pathname, headers = {}) {
    const authHeader = headers['authorization'] || headers['Authorization'] || '';
    const token = authHeader.replace('Bearer ', '').trim();

    // 1. Edge Inspection: Intercept BOLA exploit pattern on /api/v1/invoices/:id
    const invoiceMatch = pathname.match(/^\/api\/v1\/invoices\/([^/]+)$/);
    if (invoiceMatch && method === 'GET') {
      const targetId = invoiceMatch[1];

      // If token belongs to Bob, but target resource is Alice's invoice
      if (token.includes('bob') && targetId.includes('alice')) {
        return {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-EndpointGuard-Shield': 'Active-Virtual-Patch',
            'X-Blocked-By': 'Cloudflare-Worker-Edge-WAF',
          },
          data: {
            error: 'Sentinel Edge Virtual Patch: Cross-tenant access blocked by WAF.',
            rule: 'OWASP-API-1-BOLA-DEFENSE',
            blockedAt: 'Cloudflare Edge Gateway (Origin unreached)',
            timestamp: new Date().toISOString(),
          },
        };
      }
    }

    // 2. Safe Traffic Passed to Origin Backend
    const originResponse = dispatchMockRequest(method, pathname, headers);

    // 3. Edge Response Hardening: Inject security headers
    const hardenedHeaders = {
      ...(originResponse.headers || {}),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-EndpointGuard-Shield': 'Active',
    };

    return {
      status: originResponse.status,
      headers: hardenedHeaders,
      data: originResponse.data,
    };
  }
}
