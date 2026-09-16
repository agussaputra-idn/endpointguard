import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dispatchMockRequest } from './mockVulnerableApi.js';
import { SessionManager } from './sessionManager.js';
import { ResourceHarvester } from './harvester.js';
import { SemanticOracle } from './semanticOracle.js';
import { CrossPersonaFuzzer } from './crossFuzzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('===============================================================');
  console.log('🛡️  ENDPOINTGUARD AUTONOMOUS RECON & DUAL-PERSONA BOLA ENGINE');
  console.log('===============================================================\n');

  const TARGET_API_URL = 'http://127.0.0.1:3088';
  console.log(`[+] Target SaaS API configured at: ${TARGET_API_URL}`);

  // 1. Initialize Persona Session Manager (with dispatchMockRequest for sandbox & cURL synthesis)
  const sessionManager = new SessionManager(TARGET_API_URL, dispatchMockRequest);

    sessionManager.registerPersona({
      role: 'Alice',
      token: 'token-alice-secret',
      email: 'alice@company-a.com',
      tenantId: 'tenant_alice_alpha',
    });

    sessionManager.registerPersona({
      role: 'Bob',
      token: 'token-bob-secret',
      email: 'bob@company-b.com',
      tenantId: 'tenant_bob_beta',
    });

    sessionManager.registerPersona({
      role: 'Anonymous',
    });

    console.log('[+] Dual-Persona credentials loaded:');
    console.log('    • Victim Persona   : Alice (tenant_alice_alpha)');
    console.log('    • Attacker Persona : Bob   (tenant_bob_beta)');
    console.log('    • Unauth Persona   : Anonymous');

    // 2. Resource Discovery & Harvesting Phase
    const harvester = new ResourceHarvester(sessionManager);
    const harvestConfigs = [
      { listEndpoint: '/api/v1/invoices', resourceType: 'invoice' },
      { listEndpoint: '/api/v1/documents', resourceType: 'document' },
    ];

    console.log('\n[+] 🌾 Phase 1: Discovering & Harvesting Tenant Resources...');
    await harvester.harvestForPersona('Alice', harvestConfigs);
    await harvester.harvestForPersona('Bob', harvestConfigs);

    const matrix = harvester.getOwnershipMatrix();
    console.log('\n[+] 📊 Generated Object Ownership Matrix:');
    console.log(JSON.stringify(matrix, null, 2));

    // 3. Define Endpoints to Audit
    const endpointsToAudit = [
      {
        path: '/api/v1/invoices/:id',
        method: 'GET',
        resourceType: 'invoice',
        parameterKey: 'id',
        requiresAuth: true,
      },
      {
        path: '/api/v1/documents/:id',
        method: 'GET',
        resourceType: 'document',
        parameterKey: 'id',
        requiresAuth: true,
      },
    ];

    // 4. Cross-Persona Fuzzing & Semantic Oracle Phase
    const oracle = new SemanticOracle();
    const fuzzer = new CrossPersonaFuzzer(sessionManager, oracle);
    const discoveredVulnerabilities = [];

    console.log('\n[+] 🚀 Phase 2: Commencing Cross-Persona Probing & Semantic Oracle Analysis...');

    for (const endpoint of endpointsToAudit) {
      // Test 1: Cross-tenant BOLA (Bob attacks Alice's resource)
      const bolaDossier = await fuzzer.probeEndpoint({
        endpoint,
        victimRole: 'Alice',
        attackerRole: 'Bob',
        matrix,
      });

      if (bolaDossier) {
        discoveredVulnerabilities.push(bolaDossier);
      }

      // Test 2: Unauthenticated probe (Anonymous attacks Alice's resource)
      const unauthDossier = await fuzzer.probeEndpoint({
        endpoint,
        victimRole: 'Alice',
        attackerRole: 'Anonymous',
        matrix,
      });

      if (unauthDossier) {
        discoveredVulnerabilities.push(unauthDossier);
      }
    }

    // 5. Final Report Summary
    console.log('\n===============================================================');
    console.log(`🔍 AUDIT COMPLETED. Total Vulnerabilities Found: ${discoveredVulnerabilities.length}`);
    console.log('===============================================================');

    for (const vuln of discoveredVulnerabilities) {
      console.log(`\n🚨 [${vuln.severity}] ${vuln.type}`);
      console.log(`   Endpoint    : ${vuln.method} ${vuln.endpoint}`);
      console.log(`   Target ID   : ${vuln.testedResourceId} (Belongs to ${vuln.victimPersona})`);
      console.log(`   Attacker    : ${vuln.attackerPersona}`);
      console.log(`   Confidence  : ${vuln.evidence.confidenceScore}%`);
      console.log(`   Verdict     : ${vuln.evidence.reason}`);
      console.log(`   Leaked Keys : [${(vuln.evidence.leakedFields || []).join(', ')}]`);
      console.log(`   Exploit cURL:`);
      console.log(`   ${vuln.evidence.curlCommand}\n`);
      console.log(`   💡 Remediation Scope:`);
      console.log(`   Root Cause  : ${vuln.remediationRecommendation.rootCause}`);
      console.log(`   Suggested   : ${vuln.remediationRecommendation.suggestedFix}`);
    }

    // Write Dossier to File for Next Pipeline Stages (Blue Team Agent)
    const outputPath = path.resolve(__dirname, '../exploit-dossier.json');
    fs.writeFileSync(outputPath, JSON.stringify(discoveredVulnerabilities, null, 2), 'utf-8');
    console.log(`\n[✓] Exploit Dossier saved to: ${outputPath}`);
}

main().catch(console.error);
