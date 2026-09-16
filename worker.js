export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // EndpointGuard Edge API / Health Check
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'EndpointGuard AI Autonomous Security Engine',
          pipeline: ['Dual-Persona BOLA/IDOR Engine', 'Blue Team Code Patching', 'Sandbox Verification', 'Sentinel Edge Shield'],
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

    // Serve static assets (index.html, etc.) via Cloudflare Assets binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('EndpointGuard Edge Shield Active', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
