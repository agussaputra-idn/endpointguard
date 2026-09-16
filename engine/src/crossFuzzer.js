export class CrossPersonaFuzzer {
  constructor(sessionManager, oracle) {
    this.sessionManager = sessionManager;
    this.oracle = oracle;
  }

  async probeEndpoint({ endpoint, victimRole, attackerRole, matrix }) {
    const victimResources = matrix[victimRole]?.[endpoint.resourceType] || [];
    if (victimResources.length === 0) {
      console.log(`[Fuzzer] No resource IDs found for victim ${victimRole} under type '${endpoint.resourceType}'. Skipping.`);
      return null;
    }

    const attackerPersona = this.sessionManager.getPersona(attackerRole);

    for (const resourceId of victimResources) {
      const resolvedPath = endpoint.path.replace(`:${endpoint.parameterKey}`, resourceId);
      console.log(`\n[Fuzzer] 🎯 Probing Target: ${endpoint.method} ${resolvedPath}`);
      console.log(`         Victim (Owner): ${victimRole} | Attacker: ${attackerRole}`);

      // 1. Establish Victim Baseline (Authorized request)
      let victimStatus = 0;
      let victimBody = null;
      try {
        const res = await this.sessionManager.request(victimRole, {
          method: endpoint.method,
          path: resolvedPath,
        });
        victimStatus = res.status;
        victimBody = res.data;
      } catch (err) {
        console.warn(`[Fuzzer] Could not establish victim baseline: ${err.message}`);
        continue;
      }

      // 2. Synthesize Attacker cURL Command
      const fullUrl = `${this.sessionManager.getBaseUrl()}${resolvedPath}`;
      let curlCmd = `curl -i -X ${endpoint.method} '${fullUrl}'`;
      if (attackerPersona.token) {
        curlCmd += ` -H 'Authorization: Bearer ${attackerPersona.token}'`;
      }

      // 3. Execute Unauthorized Probe (Cross-Persona Request)
      let attackerStatus = 0;
      let attackerBody = null;
      try {
        const res = await this.sessionManager.request(attackerRole, {
          method: endpoint.method,
          path: resolvedPath,
        });
        attackerStatus = res.status;
        attackerBody = res.data;
      } catch (err) {
        console.warn(`[Fuzzer] Attacker request error: ${err.message}`);
        continue;
      }

      // 4. Semantic Oracle Evaluation
      const evidence = this.oracle.evaluateBolaResponse({
        victimResponseStatus: victimStatus,
        victimResponseBody: victimBody,
        attackerResponseStatus: attackerStatus,
        attackerResponseBody: attackerBody,
        targetResourceId: resourceId,
        curlCommand: curlCmd,
      });

      console.log(`[Fuzzer] Result -> HTTP Status: ${attackerStatus} | Vulnerable: ${evidence.isVulnerable} (Score: ${evidence.confidenceScore}%)`);
      console.log(`         Verdict: ${evidence.reason}`);

      if (evidence.isVulnerable) {
        return {
          vulnerabilityId: `VULN-BOLA-${Date.now()}`,
          type: 'BOLA_IDOR',
          severity: 'CRITICAL',
          endpoint: endpoint.path,
          method: endpoint.method,
          testedResourceId: resourceId,
          victimPersona: victimRole,
          attackerPersona: attackerRole,
          evidence,
          remediationRecommendation: {
            rootCause: `Endpoint handler for '${endpoint.path}' queries resource '${resourceId}' directly by key without validating tenant or user ownership against the authenticated session.`,
            suggestedFix: `In the query/service layer, enforce an ownership clause: e.g. WHERE id = :id AND userId = :currentUserId.`,
          },
        };
      }
    }

    return null;
  }
}
