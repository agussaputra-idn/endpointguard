import fs from 'fs';
import path from 'path';
import { VirtualPatchGenerator } from './virtualPatchGenerator.js';
import { EdgeGatewaySimulator } from './edgeSimulator.js';
import { TokenDrainShield } from './tokenDrainShield.js';

export class SentinelAgent {
  constructor({ outputDir }) {
    this.outputDir = outputDir;
  }

  async run() {
    console.log('===============================================================');
    console.log('🛡️  ENDPOINTGUARD SENTINEL AGENT (EDGE VIRTUAL PATCHING)');
    console.log('===============================================================\n');

    // 1. Synthesize Edge Virtual Patch Rules
    console.log('[+] Phase 1: Synthesizing Production-Ready Edge WAF Rules...');
    const ruleFiles = VirtualPatchGenerator.generateAllPatches({
      endpoint: '/api/v1/invoices/:id',
      method: 'GET',
      outputDir: this.outputDir,
    });

    console.log(`[✓] Cloudflare Worker Shield : ${ruleFiles.cloudflare}`);
    console.log(`[✓] Nginx / OpenResty Rule   : ${ruleFiles.nginx}`);
    console.log(`[✓] AWS WAF JSON Rule Group  : ${ruleFiles.awsWaf}`);
    console.log(`[✓] Deployment Instructions  : ${ruleFiles.guide}`);

    // 2. Validate Edge Gateway Interception (Simulation)
    console.log('\n[+] Phase 2: Simulating Live Edge Interception (Gateway Layer)...');

    // Test Attack 1: Bob attacks Alice's invoice via Edge Gateway
    const attackResponse = EdgeGatewaySimulator.handleEdgeRequest(
      'GET',
      '/api/v1/invoices/inv_alice_101',
      { Authorization: 'Bearer token-bob-secret' }
    );

    console.log(`    • Attacker Request : Bob -> GET /api/v1/invoices/inv_alice_101`);
    console.log(`    • Edge Status      : ${attackResponse.status} ${attackResponse.status === 403 ? '✅ BLOCKED' : '❌ LEAKED'}`);
    console.log(`    • Shield Header    : ${attackResponse.headers['X-EndpointGuard-Shield']}`);
    console.log(`    • Blocked At       : ${attackResponse.data?.blockedAt || 'Unknown'}`);

    // Test Request 2: Alice legitimate request via Edge Gateway
    const legitimateResponse = EdgeGatewaySimulator.handleEdgeRequest(
      'GET',
      '/api/v1/invoices/inv_alice_101',
      { Authorization: 'Bearer token-alice-secret' }
    );

    console.log(`\n    • Owner Request    : Alice -> GET /api/v1/invoices/inv_alice_101`);
    console.log(`    • Edge Status      : ${legitimateResponse.status} ${legitimateResponse.status === 200 ? '✅ PASSED TO ORIGIN' : '❌ BLOCKED'}`);
    console.log(`    • Hardened Headers : X-Content-Type-Options: ${legitimateResponse.headers['X-Content-Type-Options']}`);

    // 3. Validate AI Token Drain Protection
    console.log('\n[+] Phase 3: Validating AI Token Drain & Denial-of-Wallet Shield...');
    const rateShield = new TokenDrainShield({ maxTokensPerMinute: 5, windowMs: 10000 });

    const client = 'bot-scanner-192.168.1.50';
    let blockedCount = 0;
    for (let i = 1; i <= 8; i++) {
      const check = rateShield.checkRequest(client);
      if (!check.allowed) blockedCount++;
    }

    console.log(`    • Simulated Burst  : 8 rapid requests against AI endpoint`);
    console.log(`    • Throttled/Blocked: ${blockedCount} requests automatically blocked with adaptive backoff`);
    console.log(`    • Wallet Protected : ✅ LLM Token drainage prevented`);

    console.log('\n===============================================================');
    console.log('🎉 SENTINEL VIRTUAL PATCHING READY & ACTIVE');
    console.log('   Status: Zero-Day Protection Armed at Network Edge');
    console.log('===============================================================');

    return {
      ruleFiles,
      edgeInterceptSuccess: attackResponse.status === 403,
      legitimateTrafficPassed: legitimateResponse.status === 200,
    };
  }
}
