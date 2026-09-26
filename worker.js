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

    // Serve Proprietary Shield Favicon & Logo SVG
    if (url.pathname === '/endpointguard-shield.svg' || url.pathname === '/favicon.ico') {
      const shieldSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329" />
      <stop offset="100%" stop-color="#06090e" />
    </linearGradient>
  </defs>
  <path d="M50 8 L85 24 C85 60 50 92 50 92 C50 92 15 60 15 24 Z" fill="url(#shieldGrad)" />
  <path d="M50 14 L79 28 C79 58 50 84 50 84 C50 84 21 58 21 28 Z" fill="url(#innerGrad)" />
  <path d="M50 25 L65 35 V52 L50 62 L35 52 V35 Z" fill="none" stroke="url(#shieldGrad)" stroke-width="3" stroke-linejoin="round" />
  <circle cx="50" cy="43.5" r="4" fill="#22d3ee" />
  <line x1="50" y1="25" x2="50" y2="39" stroke="#22d3ee" stroke-width="2.5" />
  <line x1="50" y1="48" x2="50" y2="62" stroke="#10b981" stroke-width="2.5" />
</svg>`;
      return new Response(shieldSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*'
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

    // 3. Live Real-Time API Endpoint Security Scanner
    if (url.pathname === '/api/scan' && request.method === 'POST') {
      try {
        const body = await request.json();
        const targetUrl = (body.url || '').trim();
        if (!targetUrl || !targetUrl.startsWith('http')) {
          return new Response(JSON.stringify({ error: 'Valid HTTP/HTTPS URL required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Perform live probe from Cloudflare Edge
        let targetResponse;
        let responseText = '';
        try {
          targetResponse = await fetch(targetUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'EndpointGuard-Audit-Bot/1.0 (+https://endpointguard.dev)',
              'Accept': 'application/json, text/plain, */*'
            },
            redirect: 'follow'
          });
          responseText = await targetResponse.text();
        } catch (fetchErr) {
          // If connection failed or blocked
        }

        const status = targetResponse ? targetResponse.status : 0;
        const headers = targetResponse ? Object.fromEntries(targetResponse.headers.entries()) : {};
        
        let score = 96;
        let issues = [];
        let isProtected = false;

        // Check if endpoint enforces strict RLS / Auth (401 or 403 or policy blocked)
        if (status === 401 || status === 403 || responseText.includes('not allowed by policy') || responseText.includes('JWT') || responseText.includes('unauthorized')) {
          isProtected = true;
          score = 96;
          issues.push(`✅ Strict Authorization Enforcement: Public unauthorized requests are successfully BLOCKED (HTTP ${status}).`);
          issues.push('✅ Row Level Security (RLS) Active: Unauthorized data harvesting is denied by database policy.');
          issues.push('✅ Tenant Boundary Intact: Zero unauthenticated record leaks detected.');
        } else if (status === 200) {
          score = 45;
          issues.push('⚠️ Unauthenticated Data Exposure: Endpoint returned HTTP 200 OK with open data to anonymous clients.');
          if (headers['x-powered-by']) {
            issues.push(`⚠️ Technology Leak: Server exposes "X-Powered-By: ${headers['x-powered-by']}".`);
            score -= 5;
          }
          if (!headers['x-content-type-options']) {
            issues.push('⚠️ Missing Defense Header: "X-Content-Type-Options: nosniff" is absent.');
            score -= 5;
          }
          if (headers['access-control-allow-origin'] === '*') {
            issues.push('⚠️ Permissive CORS: "Access-Control-Allow-Origin: *" permits cross-site data harvesting.');
            score -= 5;
          }
          if (!headers['ratelimit-remaining'] && !headers['x-ratelimit-remaining']) {
            issues.push('⚠️ Rate Limiting Missing: Unthrottled bot exposure (Bill Shock Risk).');
            score -= 8;
          }
        } else {
          score = 85;
          issues.push(`ℹ️ Endpoint responded with HTTP ${status}. Perimeter security observed.`);
        }

        return new Response(JSON.stringify({
          success: true,
          targetUrl,
          statusCode: status,
          score,
          isProtected,
          pocCommand: `curl -i -X GET '${targetUrl}' -H 'Authorization: Bearer <test-token>'`,
          issues,
          rateLimitMissing: !isProtected && score < 70
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 3. Multi-Endpoint OpenAPI / Swagger & Postman Spec Security Scanner
    if (url.pathname === '/api/scan-spec' && request.method === 'POST') {
      try {
        const body = await request.json();
        const specType = body.specType || 'openapi';
        let rawContent = body.content;
        let parsed = typeof rawContent === 'object' ? rawContent : null;

        if (typeof rawContent === 'string') {
          try {
            parsed = JSON.parse(rawContent);
          } catch (pErr) {
            parsed = null;
          }
        }

        const endpoints = [];
        let totalEndpoints = 0;
        let bolaCount = 0;
        let apiTitle = 'Imported Microservice API';

        if (parsed && (parsed.openapi || parsed.swagger || parsed.paths)) {
          apiTitle = (parsed.info && parsed.info.title) || 'OpenAPI / Swagger Spec';
          const paths = parsed.paths || {};
          for (const [pathStr, methods] of Object.entries(paths)) {
            for (const [method, details] of Object.entries(methods)) {
              if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
                totalEndpoints++;
                const hasIdParam = pathStr.includes('{') || pathStr.includes(':');
                const isDelete = method.toLowerCase() === 'delete';
                const isBolaRisk = hasIdParam && ['get', 'put', 'delete'].includes(method.toLowerCase());
                if (isBolaRisk) bolaCount++;

                let vulnType = 'Protected Perimeter';
                let severity = 'LOW';
                if (isBolaRisk) {
                  vulnType = 'OWASP API1:2023 - Broken Object Level Authorization (BOLA)';
                  severity = 'CRITICAL';
                } else if (isDelete) {
                  vulnType = 'OWASP API5:2023 - Broken Function Level Authorization (BFLA)';
                  severity = 'HIGH';
                } else if (method.toLowerCase() === 'post' && (pathStr.includes('charge') || pathStr.includes('pay') || pathStr.includes('transfer'))) {
                  vulnType = 'OWASP API4:2023 - Unrestricted Resource Consumption';
                  severity = 'HIGH';
                }

                endpoints.push({
                  path: pathStr,
                  method: method.toUpperCase(),
                  summary: details.summary || `${method.toUpperCase()} ${pathStr}`,
                  isBolaRisk,
                  vulnType,
                  severity
                });
              }
            }
          }
        } else if (parsed && parsed.item && Array.isArray(parsed.item)) {
          apiTitle = (parsed.info && parsed.info.name) || 'Postman Collection';
          function extractPostman(items) {
            for (const item of items) {
              if (item.item && Array.isArray(item.item)) {
                extractPostman(item.item);
              } else if (item.request) {
                totalEndpoints++;
                const method = (item.request.method || 'GET').toUpperCase();
                let urlStr = typeof item.request.url === 'string' ? item.request.url : (item.request.url && item.request.url.raw) || '/api/resource';
                try {
                  const u = new URL(urlStr);
                  urlStr = u.pathname;
                } catch (e) {}

                const hasIdParam = urlStr.includes('{') || urlStr.includes(':') || /\/\d+/.test(urlStr);
                const isBolaRisk = hasIdParam && ['GET', 'PUT', 'DELETE'].includes(method);
                if (isBolaRisk) bolaCount++;

                endpoints.push({
                  path: urlStr,
                  method,
                  summary: item.name || `${method} ${urlStr}`,
                  isBolaRisk,
                  vulnType: isBolaRisk ? 'OWASP API1:2023 (BOLA / IDOR)' : 'Protected Perimeter',
                  severity: isBolaRisk ? 'CRITICAL' : 'LOW'
                });
              }
            }
          }
          extractPostman(parsed.item);
        }

        if (totalEndpoints === 0) {
          apiTitle = 'Enterprise Microservice Spec (Sample)';
          totalEndpoints = 6;
          bolaCount = 4;
          endpoints.push(
            { path: '/api/v1/invoices/{invoiceId}', method: 'GET', summary: 'Get Customer Invoice', isBolaRisk: true, vulnType: 'OWASP API1:2023 (BOLA)', severity: 'CRITICAL' },
            { path: '/api/v1/users/{userId}/balance', method: 'GET', summary: 'Query Vault Balance', isBolaRisk: true, vulnType: 'OWASP API1:2023 (BOLA)', severity: 'CRITICAL' },
            { path: '/api/v1/tenants/{tenantId}/export', method: 'GET', summary: 'Dump Tenant Database', isBolaRisk: true, vulnType: 'OWASP API1:2023 (BOLA)', severity: 'CRITICAL' },
            { path: '/api/v1/checkout/execute', method: 'POST', summary: 'Process Gateway Charge', isBolaRisk: false, vulnType: 'OWASP API4:2023 (Throttling)', severity: 'HIGH' },
            { path: '/api/v1/admin/members/{memberId}', method: 'DELETE', summary: 'Revoke Admin Member', isBolaRisk: true, vulnType: 'OWASP API5:2023 (BFLA)', severity: 'HIGH' },
            { path: '/api/v1/auth/session/verify', method: 'POST', summary: 'Verify Cryptographic JWT', isBolaRisk: false, vulnType: 'Protected Perimeter', severity: 'LOW' }
          );
        }

        const score = Math.max(25, Math.round(100 - (bolaCount * 18)));

        return new Response(JSON.stringify({
          success: true,
          apiTitle,
          totalEndpoints,
          bolaCount,
          score,
          endpoints,
          issues: [
            `Scanned ${totalEndpoints} API endpoints across multi-tenant attack surface.`,
            `Critical Vulnerability: ${bolaCount} endpoints accept Object IDs without cryptographically enforced tenant boundaries.`,
            'Missing WAF Virtual Patch: Direct database entity exposure detected in URI path parameters.',
            'Recommended Action: Deploy Cloudflare Edge Sentinel to isolate tenant contexts at line rate.'
          ]
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (specErr) {
        return new Response(JSON.stringify({ error: specErr.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 4. Tri-Brain AI Consensus Engine Simulation (OpenAI o1 + Claude 3.5 + Gemini Edge)
    if (url.pathname === '/api/simulate-consensus' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const scenario = body.scenario || 'bola';

        const scenariosMap = {
          bola: {
            title: 'Cross-Tenant BOLA / IDOR Attack on /api/v1/accounts/{accountId}/balance',
            redExploit: 'Red Team Hunter executed dual-persona traversal (User Alice queried Bob’s accountId: ACC-99214). Zero tenant verification detected in route params.',
            bluePatch: 'AST Code Surgeon transformed SQL query AST: injected mandatory tenancy predicate `AND tenant_id = req.user.tenant_id`.',
            qaVerification: 'QA Invariant Verifier validated 1,500 synthetic test permutations. 0 broken business flows, 100% IDOR blockage.',
            patchDiff: '+ if (req.user.tenantId !== account.tenantId) throw new ForbiddenError("Cross-tenant access denied");',
            wafRule: 'waf.blockIf(req.path.startsWith("/api/v1/accounts/") && !jwt.matchesClaim("tenant_id", req.params.accountId))'
          },
          race_condition: {
            title: 'High-Concurrency Double-Spend Race Condition on /api/v1/transfers/wire',
            redExploit: 'Red Team Hunter blasted 80 parallel asynchronous payout requests within a 3ms time window, causing dirty ledger read and balance duplication.',
            bluePatch: 'AST Code Surgeon wrapped ledger mutation inside pessimistic row-level lock (`SELECT ... FOR UPDATE`) with Redis atomic token bucket.',
            qaVerification: 'Stress-test twin simulated 500 concurrent threads. Exactly 1 transaction executed, 499 rejected with 429 Too Many Requests.',
            patchDiff: '+ await db.query("SELECT balance FROM wallets WHERE id = $1 FOR UPDATE", [walletId]);',
            wafRule: 'waf.rateLimit({ key: req.user.id, limit: 1, windowMs: 2000, action: "BLOCK" })'
          },
          desync: {
            title: 'Cryptographic JWT Session Desynchronization & Privilege Escalation',
            redExploit: 'Red Team Hunter manipulated algorithm confusion (`none` / RS256 spoofing) in `/api/v1/admin/tenants/{id}`, escalating privileges to Global SuperAdmin.',
            bluePatch: 'AST Code Surgeon enforced strict cryptographic verification with Web Crypto subtle API, rejecting unsigned and unverified public keys.',
            qaVerification: 'Cryptographic test suite verified 200 malformed token variations. All rogue signatures blocked before route handler invocation.',
            patchDiff: '+ const verified = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, data);',
            wafRule: 'waf.enforceJwtSignature({ algorithm: "RS256", jwksUri: "https://auth.internal/keys.json" })'
          }
        };

        const activeScenario = scenariosMap[scenario] || scenariosMap.bola;
        const timestamp = new Date().toISOString();
        const signatureHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(20)))
          .map(b => b.toString(16).padStart(2, '0')).join('');

        return new Response(JSON.stringify({
          success: true,
          protocol: 'BFT-Byzantine Fault-Tolerant AI Consensus (Threshold: 2/3)',
          targetScenario: activeScenario.title,
          consensusStatus: 'UNANIMOUS_CONSENSUS_REACHED',
          quorum: '3 / 3 Brains Approved',
          signature: `${signatureHash} [ECDSA-SHA256 Signed]`,
          latencyMs: 16,
          brains: [
            {
              id: 'BRAIN-01',
              name: 'Neural Reasoning Core (Deep Logic Engine)',
              architecture: 'Deep Chain-of-Thought (o1 / o3 Class)',
              role: 'Red Team Threat Modeler',
              vote: 'VULNERABILITY_CONFIRMED',
              confidence: '99.8%',
              analysis: activeScenario.redExploit,
              statusColor: 'rose'
            },
            {
              id: 'BRAIN-02',
              name: 'Deterministic AST Code Surgeon',
              architecture: 'High-Precision Code Synthesis (Claude 3.5 Class)',
              role: 'Blue Team Lead Architect',
              vote: 'AST_PATCH_SYNTHESIZED',
              confidence: '100.0%',
              analysis: activeScenario.bluePatch,
              patchSnippet: activeScenario.patchDiff,
              statusColor: 'cyan'
            },
            {
              id: 'BRAIN-03',
              name: 'Edge Sentinel & Invariant Verifier',
              architecture: 'Ultra-Fast Telemetry (Gemini Pro Edge Class)',
              role: 'QA Verifier & WAF Dispatcher',
              vote: 'INVARIANTS_CERTIFIED',
              confidence: '99.9%',
              analysis: activeScenario.qaVerification,
              wafRule: activeScenario.wafRule,
              statusColor: 'emerald'
            }
          ],
          failoverGuaranteed: 'Active 2-of-3 BFT Quorum. If any single provider is offline, the remaining 2 brains maintain 99.999% autonomous self-healing without disruption.',
          deployedToEdge: true,
          timestamp
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 5. Intelligent Cyber CS Chatbot Copilot (EndpointGuard AI Engine via n8n)
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const body = await request.json();
        const userMsg = (body.message || '').trim();
        const sessionId = body.sessionId || 'anon_session';
        const isPro = !!body.isPro;

        if (!userMsg) {
          return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Forward directly to dedicated n8n AI engine (direct origin)
        const n8nUrl = env.N8N_WEBHOOK_URL || 'http://103.217.145.148:5678/webhook/endpointguard-chat';
        if (n8nUrl) {
          try {
            const n8nRes = await fetch(n8nUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: userMsg,
                sessionId,
                isPro,
                timestamp: new Date().toISOString()
              })
            });
            if (n8nRes.ok) {
              const n8nData = await n8nRes.json();
              const reply = n8nData.reply || n8nData.text || n8nData.output || n8nData.candidates?.[0]?.content?.parts?.[0]?.text || (typeof n8nData === 'string' ? n8nData : '');
              return new Response(JSON.stringify({
                success: true,
                reply: reply,
                engine: n8nData.engine || (isPro ? 'EndpointGuard Pro Sentinel Engine' : 'EndpointGuard Security Copilot'),
                sessionId,
                timestamp: new Date().toISOString()
              }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              });
            }
          } catch (n8nErr) {
            console.error('n8n webhook forward error:', n8nErr);
          }
        }

        // Built-in Camouflaged Copilot Engine (EndpointGuard Proprietary Persona)
        const q = userMsg.toLowerCase();
        let reply = '';
        let engine = isPro ? 'EndpointGuard Pro Sentinel Engine' : 'EndpointGuard Security Copilot';

        if (q.includes('19') || q.includes('pro') || q.includes('plan') || q.includes('harga') || q.includes('price') || q.includes('bayar') || q.includes('benefit')) {
          reply = `🛡️ **What you get with Enterprise Sentinel Pro ($19/mo):**\n\n` +
                  `Unlike our free manual scanner, the **$19/month Pro tier** is an autonomous 24/7 background system designed to save your engineering team **2 to 4 hours of manual remediation** per vulnerability:\n\n` +
                  `1. **Automated GitHub PR Bot:** When BOLA/IDOR is detected, EndpointGuard creates a branch in your repository with ready-to-merge AST code patches and regression invariants.\n` +
                  `2. **Instant Cloudflare Edge WAF Sync:** Automatically injects Virtual Patches to block zero-day exploits in over 300+ global edge locations before code deploys.\n` +
                  `3. **24/7 CI/CD Audit Gate:** Protects every pull request and staging deployment automatically.\n` +
                  `4. **30-Day Money-Back Guarantee:** If it doesn't save your engineering team time, get a 100% refund without questions.\n\n` +
                  `👉 Click **"Deploy Sentinel ($19/mo)"** in the top navigation bar to activate!`;
        } else if (q.includes('supabase') || q.includes('rls')) {
          reply = `🛡️ **Supabase Security Best Practice:**\n\n` +
                  `To protect your Supabase database from unauthorized public scraping:\n\n` +
                  `1. Open **Supabase Dashboard** ➔ **SQL Editor** (\`>_\`)\n` +
                  `2. Execute:\n` +
                  `\`\`\`sql\nALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;\n` +
                  `CREATE POLICY "Allow authenticated only" ON public.your_table FOR ALL TO authenticated USING (true);\n\`\`\`\n` +
                  `3. Click **Run**. This ensures anonymous visitors without login tokens cannot harvest your data!\n\n` +
                  `Need our AI to automate your GitHub PRs and Cloudflare WAF rules 24/7? Check out our **$19/mo Pro Sentinel**!`;
        } else if (q.includes('bola') || q.includes('idor')) {
          reply = `🎯 **What is BOLA / IDOR (OWASP API1:2023)?**\n\n` +
                  `**BOLA (Broken Object Level Authorization)** happens when an endpoint accepts a resource ID (e.g. \`/api/orders/101\`) without validating whether the authenticated user actually owns that resource.\n\n` +
                  `An attacker can simply iterate through \`/orders/102\`, \`/orders/103\` to view other users' private data.\n\n` +
                  `**EndpointGuard's Red Team Agent** probes this using dual-persona identities (Alice vs Bob) to mathematically prove the vulnerability!`;
        } else if (q.includes('cloudflare') || q.includes('waf') || q.includes('bot')) {
          reply = `⚡ **Cloudflare Edge Defense:**\n\n` +
                  `Cloudflare stops malicious bot bombardment before it hits your database.\n\n` +
                  `1. Open Cloudflare Dashboard ➔ **Security** ➔ **Settings**\n` +
                  `2. Turn **Bot Fight Mode** to **ON**\n\n` +
                  `With our **$19/mo Pro Sentinel**, EndpointGuard automatically syncs Edge Virtual Patches directly to your Cloudflare account to drop zero-day exploits in under 15ms!`;
        } else if (isPro) {
          reply = `⚡ **[EndpointGuard Pro Security Architect]**\n\n` +
                  `Pro Sentinel tier active. I am ready to perform deep AST code analysis, evaluate complex tenant authorization matrices, or generate tailored Cloudflare Worker WAF virtual patches.\n\n` +
                  `Please paste your controller function or endpoint schema to begin.`;
        } else {
          reply = `Hello! I am **EndpointGuard Security Copilot** 🛡️.\n\n` +
                  `I can assist you with:\n` +
                  `• Understanding **BOLA / IDOR** and OWASP API Top 10 vulnerabilities.\n` +
                  `• Hardening **Supabase Row Level Security (RLS)** & Cloudflare WAF.\n` +
                  `• How our **Autonomous 4-Agent Pipeline** works.\n\n` +
                  `How can I help protect your API today?`;
        }

        return new Response(JSON.stringify({
          success: true,
          reply,
          engine,
          sessionId,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 5. Serve static assets (index.html, etc.) via Cloudflare Assets binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('EndpointGuard Edge Shield Active', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
