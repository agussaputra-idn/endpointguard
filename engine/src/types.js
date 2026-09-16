export type PersonaRole = 'Alice' | 'Bob' | 'Anonymous';

export interface Persona {
  role: PersonaRole;
  token?: string;
  tenantId?: string;
  email?: string;
  headers?: Record<string, string>;
}

export interface EndpointSpec {
  path: string;                // e.g. "/api/v1/invoices/:id"
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  resourceType: string;        // e.g. "invoice"
  parameterKey: string;        // e.g. "id"
  requiresAuth: boolean;
}

export interface OwnershipMatrix {
  [personaRole: string]: {
    [resourceType: string]: string[];
  };
}

export interface ProbeEvidence {
  curlCommand: string;
  httpStatus: number;
  responsePayload: any;
  authorizedOriginalPayload?: any;
  leakedFields?: string[];
  isVulnerable: boolean;
  confidenceScore: number;
  reason: string;
}

export interface ExploitDossier {
  vulnerabilityId: string;
  type: 'BOLA_IDOR' | 'BROKEN_AUTH' | 'BFLA';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  endpoint: string;
  method: string;
  testedResourceId: string;
  victimPersona: PersonaRole;
  attackerPersona: PersonaRole;
  evidence: ProbeEvidence;
  remediationRecommendation: {
    rootCause: string;
    suggestedFix: string;
  };
}
