import { dispatchMockRequest } from '../mockVulnerableApi.js';

export class TestHarness {
  static runAllTests() {
    const tests = [
      this.testSecurityInvariant(),
      this.testBusinessRegressionInvariant(),
      this.testPeerAccessInvariant(),
      this.testListingIntegrityInvariant(),
    ];

    return tests;
  }

  // 1. Negative Invariant: Exploit MUST be blocked (HTTP 403)
  static testSecurityInvariant() {
    const testName = 'Security Invariant: Cross-tenant BOLA attack must be blocked';
    const startTime = Date.now();

    const response = dispatchMockRequest(
      'GET',
      '/api/v1/invoices/inv_alice_101',
      { Authorization: 'Bearer token-bob-secret' }
    );

    const durationMs = Date.now() - startTime;
    const passed = response.status === 403;

    return {
      testName,
      category: 'SECURITY_INVARIANT',
      expectedStatus: 403,
      actualStatus: response.status,
      passed,
      durationMs,
      details: passed
        ? 'Attacker (Bob) was successfully blocked with HTTP 403 Forbidden.'
        : `FAILURE: Attacker was NOT blocked! Status received: ${response.status}`,
    };
  }

  // 2. Positive Invariant: Legitimate owner MUST retain access (HTTP 200)
  static testBusinessRegressionInvariant() {
    const testName = 'Business Invariant: Legitimate owner (Alice) can access her own resource';
    const startTime = Date.now();

    const response = dispatchMockRequest(
      'GET',
      '/api/v1/invoices/inv_alice_101',
      { Authorization: 'Bearer token-alice-secret' }
    );

    const durationMs = Date.now() - startTime;
    const isOkStatus = response.status === 200;
    const hasValidData = response.data && response.data.id === 'inv_alice_101';
    const passed = isOkStatus && hasValidData;

    return {
      testName,
      category: 'BUSINESS_REGRESSION',
      expectedStatus: 200,
      actualStatus: response.status,
      passed,
      durationMs,
      details: passed
        ? 'Owner (Alice) successfully retrieved her invoice with valid data intact.'
        : `REGRESSION: Owner was unable to access her invoice! Status: ${response.status}`,
    };
  }

  // 3. Multi-Tenant Symmetry: Bob can still access his own data normally
  static testPeerAccessInvariant() {
    const testName = 'Tenant Symmetry: Bob can access his own resource normally';
    const startTime = Date.now();

    const response = dispatchMockRequest(
      'GET',
      '/api/v1/invoices/inv_bob_201',
      { Authorization: 'Bearer token-bob-secret' }
    );

    const durationMs = Date.now() - startTime;
    const isOkStatus = response.status === 200;
    const hasValidData = response.data && response.data.id === 'inv_bob_201';
    const passed = isOkStatus && hasValidData;

    return {
      testName,
      category: 'TENANT_SYMMETRY',
      expectedStatus: 200,
      actualStatus: response.status,
      passed,
      durationMs,
      details: passed
        ? 'Bob successfully retrieved his own invoice without issues.'
        : `REGRESSION: Bob was unable to access his own invoice! Status: ${response.status}`,
    };
  }

  // 4. Collection Integrity: List endpoints filter data per tenant accurately
  static testListingIntegrityInvariant() {
    const testName = 'Collection Integrity: Invoices list returns only tenant-scoped records';
    const startTime = Date.now();

    const response = dispatchMockRequest(
      'GET',
      '/api/v1/invoices',
      { Authorization: 'Bearer token-alice-secret' }
    );

    const durationMs = Date.now() - startTime;
    const isOkStatus = response.status === 200;
    const items = response.data?.data || [];
    const allBelongToAlice = items.every((inv) => inv.userId === 'usr_alice');
    const passed = isOkStatus && items.length > 0 && allBelongToAlice;

    return {
      testName,
      category: 'COLLECTION_INTEGRITY',
      expectedStatus: 200,
      actualStatus: response.status,
      passed,
      durationMs,
      details: passed
        ? `List returned ${items.length} records, 100% strictly scoped to Alice.`
        : `INTEGRITY FAILED: Records leaked or unauthorized status: ${response.status}`,
    };
  }
}
