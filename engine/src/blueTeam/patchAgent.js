import fs from 'fs';
import path from 'path';
import { CodeLocator } from './codeLocator.js';
import { PatchSynthesizer } from './patchSynthesizer.js';
import { PRGenerator } from './prGenerator.js';

export class PatchAgent {
  constructor({ targetDir, patchesDir }) {
    this.targetDir = targetDir;
    this.patchesDir = patchesDir;
  }

  async run(dossierPath, applyDirectly = false) {
    console.log('===============================================================');
    console.log('🛡️  ENDPOINTGUARD BLUE TEAM AUTOMATED CODE PATCH AGENT');
    console.log('===============================================================\n');

    if (!fs.existsSync(dossierPath)) {
      throw new Error(`Exploit dossier not found at: ${dossierPath}`);
    }

    const dossierContent = fs.readFileSync(dossierPath, 'utf-8');
    const vulnerabilities = JSON.parse(dossierContent);

    if (!vulnerabilities || vulnerabilities.length === 0) {
      console.log('ℹ️  No vulnerabilities found in dossier. System is clean!');
      return [];
    }

    console.log(`[+] Loaded ${vulnerabilities.length} vulnerability dossier(s) for remediation.`);

    const results = [];

    for (const vuln of vulnerabilities) {
      console.log(`\n🔍 Locating code responsible for: ${vuln.method} ${vuln.endpoint}`);
      const locations = CodeLocator.locateHandler(this.targetDir, vuln.endpoint, vuln.method);

      if (locations.length === 0) {
        console.warn(`⚠️  Could not locate handler code for ${vuln.endpoint}`);
        continue;
      }

      const primaryMatch = locations[0];
      console.log(`[✓] Handler located in: ${primaryMatch.filePath} (line ${primaryMatch.lineNumber})`);

      // Extract resource type (e.g. "/api/v1/invoices/:id" -> "invoice")
      const routeParts = vuln.endpoint.split('/').filter(Boolean);
      let resourceType = 'invoice';
      for (const part of routeParts) {
        if (!part.startsWith(':') && !part.startsWith('v1') && !part.startsWith('api')) {
          resourceType = part.endsWith('s') ? part.slice(0, -1) : part;
          break;
        }
      }

      console.log(`[+] Synthesizing precision patch for '${resourceType}' BOLA/IDOR vulnerability...`);
      const patchResult = PatchSynthesizer.generatePatch({
        filePath: primaryMatch.filePath,
        endpoint: vuln.endpoint,
        testedResourceId: vuln.testedResourceId,
        resourceType,
      });

      console.log(`[✓] Patch generated: ${patchResult.patchDescription}`);

      console.log(`[+] Generating GitHub Pull Request Proposal & Unified Diff...`);
      const prResult = PRGenerator.generatePR({
        dossier: vuln,
        patchResult,
        outputDir: this.patchesDir,
      });

      console.log(`[✓] PR Proposal generated at: ${prResult.prDocPath}`);
      console.log(`[✓] Patch file created at   : ${prResult.patchFilePath}`);

      if (applyDirectly) {
        console.log(`\n⚙️  Applying patch directly to source: ${primaryMatch.filePath}...`);
        fs.writeFileSync(primaryMatch.filePath, patchResult.patchedContent, 'utf-8');
        console.log(`[✓] Patch successfully applied! Vulnerability closed in source.`);
      }

      results.push({
        vulnerability: vuln,
        patchResult,
        prResult,
      });
    }

    return results;
  }
}
