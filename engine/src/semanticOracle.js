export class SemanticOracle {
  /**
   * Evaluates if a response indicates a confirmed vulnerability (BOLA / Data Leak).
   */
  evaluateBolaResponse({
    victimResponseStatus,
    victimResponseBody,
    attackerResponseStatus,
    attackerResponseBody,
    targetResourceId,
    curlCommand,
  }) {
    // Case 1: Attacker received 401, 403, or 404
    if ([401, 403, 404].includes(attackerResponseStatus)) {
      return {
        curlCommand,
        httpStatus: attackerResponseStatus,
        responsePayload: attackerResponseBody,
        isVulnerable: false,
        confidenceScore: 0,
        reason: `Access correctly denied with status ${attackerResponseStatus}.`,
      };
    }

    // Case 2: Attacker received 200 OK
    if (attackerResponseStatus >= 200 && attackerResponseStatus < 300) {
      // Check for pseudo-success (False positive: 200 OK with empty body or error message)
      if (!attackerResponseBody || (typeof attackerResponseBody === 'object' && Object.keys(attackerResponseBody).length === 0)) {
        return {
          curlCommand,
          httpStatus: attackerResponseStatus,
          responsePayload: attackerResponseBody,
          isVulnerable: false,
          confidenceScore: 10,
          reason: 'Received 200 OK but payload is completely empty.',
        };
      }

      if (
        attackerResponseBody.error ||
        attackerResponseBody.data === null ||
        attackerResponseBody.status === 'unauthorized'
      ) {
        return {
          curlCommand,
          httpStatus: attackerResponseStatus,
          responsePayload: attackerResponseBody,
          isVulnerable: false,
          confidenceScore: 20,
          reason: 'Status 200 OK returned, but payload contains explicit error or null body.',
        };
      }

      // Check if attacker received the actual resource belonging to the victim
      const attackerStr = JSON.stringify(attackerResponseBody || '');
      
      const leakedFields = [];
      if (typeof attackerResponseBody === 'object') {
        for (const [key, value] of Object.entries(attackerResponseBody)) {
          if (value && victimResponseBody && victimResponseBody[key] === value) {
            leakedFields.push(key);
          }
        }
      }

      const containsResourceId = attackerStr.includes(targetResourceId);

      if (containsResourceId && leakedFields.length > 0) {
        return {
          curlCommand,
          httpStatus: attackerResponseStatus,
          responsePayload: attackerResponseBody,
          authorizedOriginalPayload: victimResponseBody,
          leakedFields,
          isVulnerable: true,
          confidenceScore: 98,
          reason: `CRITICAL BOLA: Attacker received victim's data including target resource ID ${targetResourceId} and ${leakedFields.length} matching data fields.`,
        };
      }
    }

    // Case 3: Server 500 error (potential unhandled exception or SQL leakage)
    if (attackerResponseStatus >= 500) {
      return {
        curlCommand,
        httpStatus: attackerResponseStatus,
        responsePayload: attackerResponseBody,
        isVulnerable: false,
        confidenceScore: 40,
        reason: `Server threw internal error (${attackerResponseStatus}). Potential unhandled exception.`,
      };
    }

    return {
      curlCommand,
      httpStatus: attackerResponseStatus,
      responsePayload: attackerResponseBody,
      isVulnerable: false,
      confidenceScore: 10,
      reason: `Unexpected status code: ${attackerResponseStatus}.`,
    };
  }
}
