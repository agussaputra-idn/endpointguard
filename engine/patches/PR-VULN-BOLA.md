## 🛡️ EndpointGuard Automated Security Pull Request

### 📋 Overview
- **Vulnerability**: `BOLA_IDOR` (Broken Object Level Authorization / IDOR)
- **Classification**: **OWASP API 1:2023** / **CWE-639**
- **Severity**: `CRITICAL` (Confidence: 98%)
- **Target Endpoint**: `GET /api/v1/invoices/:id`
- **Impacted Resource**: `inv_alice_101` (Belonging to `Alice`)

---

### 🚨 Verified Exploit Proof (Reproducible)
During autonomous dual-persona audit, attacker persona **Bob** was able to unauthorizedly retrieve private records belonging to **Alice**.

**Exploit Terminal Command:**
```bash
curl -i -X GET 'http://127.0.0.1:3088/api/v1/invoices/inv_alice_101' -H 'Authorization: Bearer token-bob-secret'
```

**Leaked Data Fields:**
`[ id, userId, invoiceNumber, amount, clientName, bankDetails ]`

---

### 💡 Root Cause & Applied Patch
- **Root Cause**: Endpoint handler for '/api/v1/invoices/:id' queries resource 'inv_alice_101' directly by key without validating tenant or user ownership against the authenticated session.
- **Remediation**: Injected ownership verification for 'invoice.userId === user.userId' before returning resource data.

#### Proposed Code Diff:
```diff
--- a//Users/user/endpointguard/engine/src/mockVulnerableApi.js
+++ b//Users/user/endpointguard/engine/src/mockVulnerableApi.js
@@ -86,5 +86,9 @@
     // Flaw: returns invoice without checking `invoice.userId === user.userId`
+    // 🔒 [EndpointGuard Security Patch] Enforce tenant/user ownership check (OWASP API1:2023 - BOLA)
+    if (invoice.userId !== user.userId) {
+      return { status: 403, data: { error: 'Forbidden: You do not have access to this invoice' } };
+    }
     return { status: 200, data: invoice };

```

---

### 🧪 Verification Checklist
- [x] Exploit reproduction test blocked (HTTP 403 Forbidden verified).
- [x] Legitimate owner access preserved (HTTP 200 OK verified).
- [x] Zero regressions to existing business logic.

*Automated by EndpointGuard Blue Team Agent.*
