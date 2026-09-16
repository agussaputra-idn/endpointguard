// EndpointGuard - Autonomous "Mythos Lite" Security Engine v2.5
// Full Architecture: SSRF Shield + Secret Scanner + HTTP Method Probing + Header Audit + Financial Risk

const BLOCKED_HOSTNAMES = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1',
  '169.254.169.254', 'metadata.google.internal'
];

const SECRET_PATTERNS = [
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9T3BlbkFJ]{20,48}/ },
  { name: 'AWS Access Key', regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: 'Stripe Secret/Publishable Key', regex: /(sk_live|pk_live|rk_live)_[0-9a-zA-Z]{24}/ },
  { name: 'Generic JWT / Bearer Token', regex: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/ },
  { name: 'Database Connection String / Password', regex: /mongodb(\+srv)?:\/\/[^\s]+|postgres:\/\/[^\s]+/ }
];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { url } = JSON.parse(event.body || '{}');

    if (!url || !url.startsWith('http')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid URL. Must start with http:// or https://' }) };
    }

    const parsedUrl = new URL(url);

    // 1. SSRF & Internal Network Shield
    if (BLOCKED_HOSTNAMES.includes(parsedUrl.hostname) || parsedUrl.hostname.startsWith('192.168.') || parsedUrl.hostname.startsWith('10.')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Security Shield: Probing internal/private network IP is strictly forbidden.' })
      };
    }

    let score = 100;
    const issues = [];
    const patches = [];

    const fetchWithTimeout = (targetUrl, options = {}, timeoutMs = 4000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      return fetch(targetUrl, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
    };

    // 2. Audit Response Utama
    const mainRes = await fetchWithTimeout(url);
    const headers = mainRes.headers;
    const rawBody = await mainRes.text().catch(() => '');

    // Cek Technology Fingerprint
    const poweredBy = headers.get('x-powered-by');
    const serverHeader = headers.get('server');
    if (poweredBy || (serverHeader && !serverHeader.toLowerCase().includes('cloudflare'))) {
      score -= 15;
      issues.push(`Stack Exposure: Server explicitly reveals "${poweredBy || serverHeader}" in response headers.`);
      patches.push({
        title: 'Obfuscate Server Technology Headers',
        code: `// Express.js:\napp.disable('x-powered-by');\n\n// Fastify:\nconst fastify = require('fastify')({ hidePoweredBy: true });`
      });
    }

    // Cek Missing Defense Headers (HSTS, Sniffing, Frame)
    const hsts = headers.get('strict-transport-security');
    const nosniff = headers.get('x-content-type-options');
    if (!hsts && parsedUrl.protocol === 'https:') {
      score -= 10;
      issues.push('Missing HSTS: Endpoint lacks "Strict-Transport-Security" header against downgrade attacks.');
    }
    if (!nosniff) {
      score -= 10;
      issues.push('Missing MIME Sniffing Protection: "X-Content-Type-Options: nosniff" is absent.');
    }

    // Cek CORS Boundaries
    const allowOrigin = headers.get('access-control-allow-origin');
    const allowCreds = headers.get('access-control-allow-credentials');
    if (allowOrigin === '*') {
      score -= 20;
      issues.push('Insecure Wildcard CORS: "Access-Control-Allow-Origin: *" permits any domain to read responses.');
      patches.push({
        title: 'Lock Down CORS Allowed Origins',
        code: `const cors = require('cors');\napp.use(cors({\n  origin: ['https://yourdomain.com'],\n  credentials: true\n}));`
      });
    } else if (allowOrigin && allowCreds === 'true') {
      score -= 25;
      issues.push('Critical CORS Exposure: Broad Origin paired with Allow-Credentials enabled.');
    }

    // 3. Probing Method Tampering via OPTIONS
    try {
      const optionsRes = await fetchWithTimeout(url, { method: 'OPTIONS' }, 3000);
      const allowMethods = optionsRes.headers.get('allow') || optionsRes.headers.get('access-control-allow-methods');
      if (allowMethods && (allowMethods.includes('DELETE') || allowMethods.includes('PUT'))) {
        issues.push(`Permissive HTTP Methods: Endpoint publicly advertises write methods (${allowMethods}).`);
      }
    } catch {
      // Ignored
    }

    // 4. Secret & API Key Deep Regex Scanner
    SECRET_PATTERNS.forEach(pat => {
      if (pat.regex.test(rawBody)) {
        score -= 30;
        issues.push(`CRITICAL LEAK: Potential ${pat.name} found in response body payload!`);
        patches.push({
          title: `Isolate ${pat.name} from Response`,
          code: `// Store API keys in environment variables (process.env) and NEVER expose them in JSON responses.`
        });
      }
    });

    // 5. Rate Limiting Burst Probe & Financial Exposure
    let rateLimitMissing = false;
    try {
      const burst = Array.from({ length: 10 }, () => fetchWithTimeout(url, {}, 3000));
      const burstResults = await Promise.all(burst);
      const isThrottled = burstResults.some(r => r.status === 429);
      const hasLimitHeaders = headers.has('x-ratelimit-limit') || headers.has('ratelimit-limit');

      if (!isThrottled && !hasLimitHeaders) {
        rateLimitMissing = true;
        score -= 25;
        issues.push('Missing Rate Limiting: 10 instant requests accepted with zero throttling (High DoS & Token Drain Risk).');
        patches.push({
          title: 'Implement Sliding Window Rate Limiter',
          code: `const rateLimit = require('express-rate-limit');\nconst limiter = rateLimit({\n  windowMs: 15 * 60 * 1000,\n  max: 100,\n  standardHeaders: true,\n  legacyHeaders: false\n});\napp.use(limiter);`
        });
      }
    } catch {
      // Ignored
    }

    // 6. Red Team Proof of Concept (PoC)
    const pocCommand = `for i in {1..10}; do curl -s -o /dev/null -w "Status: %{http_code} | Time: %{time_total}s\\n" "${url}"; done`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: Math.max(score, 10),
        issues,
        patches,
        pocCommand,
        rateLimitMissing
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Audit failed: ${err.message}` })
    };
  }
};