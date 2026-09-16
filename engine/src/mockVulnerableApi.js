import http from 'http';
import url from 'url';

const USERS = {
  'token-alice-secret': { userId: 'usr_alice', role: 'member', email: 'alice@company-a.com' },
  'token-bob-secret': { userId: 'usr_bob', role: 'member', email: 'bob@company-b.com' },
};

const INVOICES = [
  {
    id: 'inv_alice_101',
    userId: 'usr_alice',
    invoiceNumber: 'INV-2026-001',
    amount: 15400,
    clientName: 'Alice Global Logistics',
    bankDetails: 'Bank of America - ACCT: 9812-4412-00',
  },
  {
    id: 'inv_bob_201',
    userId: 'usr_bob',
    invoiceNumber: 'INV-2026-002',
    amount: 3200,
    clientName: 'Bob Marketing Hub',
    bankDetails: 'Chase Bank - ACCT: 1102-7721-99',
  },
];

const DOCUMENTS = [
  {
    id: 'doc_alice_01',
    userId: 'usr_alice',
    title: 'Alice Q3 Strategy',
    content: 'Confidential corporate strategy for Company A.',
  },
  {
    id: 'doc_bob_02',
    userId: 'usr_bob',
    title: 'Bob Public Notes',
    content: 'General team guidelines for Company B.',
  },
];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function getAuthUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  return USERS[token] || null;
}

export function dispatchMockRequest(method, pathname, headers = {}, body = null) {
  const authHeader = headers['authorization'] || headers['Authorization'];
  let user = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    user = USERS[token] || null;
  }

  // 1. GET /api/v1/invoices
  if (pathname === '/api/v1/invoices' && method === 'GET') {
    if (!user) {
      return { status: 401, data: { error: 'Unauthorized' } };
    }
    const userInvoices = INVOICES.filter((inv) => inv.userId === user.userId);
    return { status: 200, data: { count: userInvoices.length, data: userInvoices } };
  }

  // 2. GET /api/v1/invoices/:id (🚨 VULNERABLE TO BOLA / IDOR 🚨)
  const invoiceMatch = pathname.match(/^\/api\/v1\/invoices\/([^/]+)$/);
  if (invoiceMatch && method === 'GET') {
    if (!user) {
      return { status: 401, data: { error: 'Unauthorized' } };
    }
    const invoiceId = invoiceMatch[1];
    const invoice = INVOICES.find((inv) => inv.id === invoiceId);
    if (!invoice) {
      return { status: 404, data: { error: 'Invoice not found' } };
    }
    // Flaw: returns invoice without checking `invoice.userId === user.userId`
    // 🔒 [EndpointGuard Security Patch] Enforce tenant/user ownership check (OWASP API1:2023 - BOLA)
    if (invoice.userId !== user.userId) {
      return { status: 403, data: { error: 'Forbidden: You do not have access to this invoice' } };
    }
    return { status: 200, data: invoice };
  }

  // 3. GET /api/v1/documents
  if (pathname === '/api/v1/documents' && method === 'GET') {
    if (!user) {
      return { status: 401, data: { error: 'Unauthorized' } };
    }
    const userDocs = DOCUMENTS.filter((doc) => doc.userId === user.userId);
    return { status: 200, data: { count: userDocs.length, data: userDocs } };
  }

  // 4. GET /api/v1/documents/:id (✅ SECURE / PROTECTED ENDPOINT)
  const docMatch = pathname.match(/^\/api\/v1\/documents\/([^/]+)$/);
  if (docMatch && method === 'GET') {
    if (!user) {
      return { status: 401, data: { error: 'Unauthorized' } };
    }
    const docId = docMatch[1];
    const doc = DOCUMENTS.find((d) => d.id === docId);
    if (!doc) {
      return { status: 404, data: { error: 'Document not found' } };
    }
    if (doc.userId !== user.userId) {
      return { status: 403, data: { error: 'Forbidden: You do not have access to this document' } };
    }
    return { status: 200, data: doc };
  }

  return { status: 404, data: { error: 'Route not found' } };
}

