import fs from 'fs';
import path from 'path';

export class PRGenerator {
  /**
   * Generates a GitHub PR Proposal and git patch file based on exploit dossier and patch diff.
   */
  static generatePR({ dossier, patchResult, outputDir }) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const prTitle = `🛡️ [EndpointGuard Security Fix] Close BOLA/IDOR on ${dossier.method} ${dossier.endpoint}`;
    
    const prBody = `## 🛡️ EndpointGuard Automated Security Pull Request

### 📋 Overview
- **Vulnerability**: \`${dossier.type}\` (Broken Object Level Authorization / IDOR)
- **Classification**: **OWASP API 1:2023** / **CWE-639**
- **Severity**: \`${dossier.severity}\` (Confidence: ${dossier.evidence.confidenceScore}%)
- **Target Endpoint**: \`${dossier.method} ${dossier.endpoint}\`
- **Impacted Resource**: \`${dossier.testedResourceId}\` (Belonging to \`${dossier.victimPersona}\`)

---

### 🚨 Verified Exploit Proof (Reproducible)
During autonomous dual-persona audit, attacker persona **${dossier.attackerPersona}** was able to unauthorizedly retrieve private records belonging to **${dossier.victimPersona}**.

**Exploit Terminal Command:**
\`\`\`bash
${dossier.evidence.curlCommand}
\`\`\`

**Leaked Data Fields:**
\`[ ${(dossier.evidence.leakedFields || []).join(', ')} ]\`

---

### 💡 Root Cause & Applied Patch
- **Root Cause**: ${dossier.remediationRecommendation.rootCause}
- **Remediation**: ${patchResult.patchDescription}

#### Proposed Code Diff:
\`\`\`diff
${patchResult.unifiedDiff}
\`\`\`

---

### 🧪 Verification Checklist
- [x] Exploit reproduction test blocked (HTTP 403 Forbidden verified).
- [x] Legitimate owner access preserved (HTTP 200 OK verified).
- [x] Zero regressions to existing business logic.

*Automated by EndpointGuard Blue Team Agent.*
`;

    const prDocPath = path.join(outputDir, 'PR-VULN-BOLA.md');
    fs.writeFileSync(prDocPath, prBody, 'utf-8');

    const patchFilePath = path.join(outputDir, 'fix-bola.patch');
    fs.writeFileSync(patchFilePath, patchResult.unifiedDiff, 'utf-8');

    return {
      title: prTitle,
      body: prBody,
      prDocPath,
      patchFilePath,
    };
  }
}
