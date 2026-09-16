// EndpointGuard - Core Scanner Engine v1.0
// Zero-dependency native Node.js scanner

const TARGET_URL = 'https://jsonplaceholder.typicode.com/posts/1'; // Ganti dengan URL target yang ingin diuji

async function runSecurityAudit(url) {
  console.log(`\n🛡️  Starting EndpointGuard Security Audit for: ${url}\n`);

  let score = 100;
  const issues = [];
  const patches = [];

  try {
    // 1. Uji Celah Kebocoran Header & CORS
    const initialResponse = await fetch(url);
    const headers = initialResponse.headers;

    // Cek Information Leakage (X-Powered-By / Server)
    const poweredBy = headers.get('x-powered-by');
    const serverHeader = headers.get('server');

    if (poweredBy || serverHeader) {
      score -= 20;
      issues.push(`[HIGH] Technology Stack Leaked: "${poweredBy || serverHeader}" is exposed in response headers.`);
      patches.push({
        type: 'Hide Headers',
        patch: `// In Express.js:\napp.disable('x-powered-by');\n// Or use Helmet:\nconst helmet = require('helmet');\napp.use(helmet());`
      });
    }

    // Cek Wildcard CORS
    const cors = headers.get('access-control-allow-origin');
    if (cors === '*') {
      score -= 20;
      issues.push('[MEDIUM] Insecure CORS Configuration: "Access-Control-Allow-Origin" is set to "*" (Any domain can read this data).');
      patches.push({
        type: 'Restrict CORS',
        patch: `// In Express.js:\nconst cors = require('cors');\napp.use(cors({ origin: 'https://yourapp.com' }));`
      });
    }

    // 2. Uji Rate Limiting (Simulasi Serangan 10 Request Cepat)
    console.log('⚡ Testing Rate Limiting (Sending 10 burst requests)...');
    const burstRequests = Array.from({ length: 10 }, () => fetch(url));
    const responses = await Promise.all(burstRequests);

    const hasRateLimitStatus = responses.some(res => res.status === 429);
    const hasRateLimitHeaders = headers.has('x-ratelimit-limit') || headers.has('ratelimit-limit');

    if (!hasRateLimitStatus && !hasRateLimitHeaders) {
      score -= 30;
      issues.push('[CRITICAL] Missing Rate Limiting: Endpoint accepted 10 rapid requests without throttling (High risk for DoS / Bill Shock).');
      patches.push({
        type: 'Add Rate Limiter',
        patch: `// In Express.js:\nconst rateLimit = require('express-rate-limit');\nconst limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });\napp.use(limiter);`
      });
    }

    // 3. Tampilkan Hasil Audit
    console.log('\n================ AUDIT REPORT ================');
    console.log(`Security Score : ${score} / 100 ${score < 60 ? '🔴 (HIGH RISK)' : score < 85 ? '🟡 (WARNING)' : '🟢 (SECURE)'}`);
    console.log('----------------------------------------------');
    
    if (issues.length === 0) {
      console.log('✅ No obvious baseline vulnerabilities detected.');
    } else {
      console.log('Vulnerabilities Found:');
      issues.forEach((issue, idx) => console.log(`${idx + 1}. ${issue}`));

      console.log('\n💡 Recommended Instant Patches:');
      patches.forEach((p, idx) => {
        console.log(`\n[Patch ${idx + 1}: ${p.type}]`);
        console.log(p.patch);
      });
    }
    console.log('==============================================\n');

  } catch (err) {
    console.error('❌ Failed to reach target URL:', err.message);
  }
}

runSecurityAudit(TARGET_URL);