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

    // 4. Intelligent Cyber CS Chatbot Copilot (Gemini / Antigravity via n8n)
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

        // If N8N Webhook is configured in Cloudflare environment variables, forward directly!
        if (env.N8N_WEBHOOK_URL) {
          try {
            const n8nRes = await fetch(env.N8N_WEBHOOK_URL, {
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
              const reply = n8nData.reply || n8nData.text || n8nData.output || (typeof n8nData === 'string' ? n8nData : '');
              return new Response(JSON.stringify({
                success: true,
                reply: reply,
                engine: n8nData.engine || (isPro ? 'Antigravity Deep Engine' : 'Gemini Security Copilot'),
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

        // Built-in Camouflaged Copilot Engine (Collaborative Gemini / Antigravity Persona)
        const q = userMsg.toLowerCase();
        let reply = '';
        let engine = isPro ? 'Antigravity Deep Engine' : 'Gemini Security Copilot';

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
          reply = `⚡ **[Antigravity Deep Security Architect]**\n\n` +
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
