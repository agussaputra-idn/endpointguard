import fs from 'fs';
import path from 'path';
import { TestHarness } from './testHarness.js';

export class SandboxRunner {
  constructor({ reportOutputPath }) {
    this.reportOutputPath = reportOutputPath;
  }

  runVerification() {
    console.log('===============================================================');
    console.log('🧪  ENDPOINTGUARD SANDBOX VERIFICATION & QA RUNNER');
    console.log('===============================================================\n');

    console.log('[+] Initializing Sandboxed Test Environment (Digital Twin)...');
    const startTime = Date.now();

    const testResults = TestHarness.runAllTests();
    const totalDurationMs = Date.now() - startTime;

    const totalTests = testResults.length;
    const passedTests = testResults.filter((t) => t.passed).length;
    const failedTests = totalTests - passedTests;

    // Evaluate Invariant Results
    const securityPassed = testResults
      .filter((t) => t.category === 'SECURITY_INVARIANT')
      .every((t) => t.passed);

    const businessPassed = testResults
      .filter((t) => t.category !== 'SECURITY_INVARIANT')
      .every((t) => t.passed);

    let verdict = 'UNKNOWN';
    let summaryMessage = '';

    if (securityPassed && businessPassed) {
      verdict = 'VERIFIED_SAFE_TO_MERGE';
      summaryMessage = 'All security invariants and business regression invariants passed with 100% confidence. Safe for production.';
    } else if (!securityPassed) {
      verdict = 'PATCH_FAILED_INSECURE';
      summaryMessage = 'Security exploit was NOT blocked. Patch is ineffective.';
    } else {
      verdict = 'REGRESSION_DETECTED';
      summaryMessage = 'Security exploit was blocked, BUT legitimate user flows broke. Regression detected.';
    }

    // Print Test Execution Matrix
    console.log('\n--- 📋 Test Execution Results ---');
    for (const test of testResults) {
      const badge = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${badge} [${test.category}] ${test.testName}`);
      console.log(`        Expected: ${test.expectedStatus} | Actual: ${test.actualStatus} (${test.durationMs}ms)`);
      console.log(`        ${test.details}\n`);
    }

    console.log('===============================================================');
    console.log(`🏁 VERIFICATION SUMMARY`);
    console.log(`   Total Tests : ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log(`   Duration    : ${totalDurationMs}ms`);
    console.log(`   Verdict     : [${verdict}]`);
    console.log(`   Message     : ${summaryMessage}`);
    console.log('===============================================================');

    // Generate Verification Report Artifact
    const report = {
      timestamp: new Date().toISOString(),
      verdict,
      confidenceScore: verdict === 'VERIFIED_SAFE_TO_MERGE' ? 100 : 0,
      summary: summaryMessage,
      metrics: {
        totalTests,
        passedTests,
        failedTests,
        totalDurationMs,
      },
      invariants: {
        securityInvariantPassed: securityPassed,
        businessRegressionPassed: businessPassed,
      },
      testResults,
    };

    if (this.reportOutputPath) {
      fs.writeFileSync(this.reportOutputPath, JSON.stringify(report, null, 2), 'utf-8');
      console.log(`\n[✓] Official Verification Report generated: ${this.reportOutputPath}`);
    }

    return report;
  }
}
