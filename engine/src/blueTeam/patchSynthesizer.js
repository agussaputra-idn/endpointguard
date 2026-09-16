import fs from 'fs';

export class PatchSynthesizer {
  /**
   * Synthesize a BOLA / IDOR security patch for a given handler.
   */
  static generatePatch({ filePath, endpoint, testedResourceId, resourceType = 'invoice' }) {
    const originalContent = fs.readFileSync(filePath, 'utf-8');
    const lines = originalContent.split('\n');

    let patchedLines = [...lines];
    let patchApplied = false;
    let patchDescription = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect where the invoice/resource is fetched by ID without ownership check
      if (line.includes(`const ${resourceType} =`) || line.includes(`const item =`)) {
        // Find where the vulnerable response is returned
        for (let j = i + 1; j < Math.min(lines.length, i + 15); j++) {
          const checkLine = lines[j];
          
          if (
            (checkLine.includes(`return { status: 200, data: ${resourceType} }`) ||
             checkLine.includes(`res.json(${resourceType})`)) &&
            !lines.slice(i, j).some(l => l.includes('userId') && l.includes('!=='))
          ) {
            // Determine indentation
            const matchIndent = checkLine.match(/^(\s*)/);
            const indent = matchIndent ? matchIndent[1] : '    ';

            const patchSnippet = [
              `${indent}// 🔒 [EndpointGuard Security Patch] Enforce tenant/user ownership check (OWASP API1:2023 - BOLA)`,
              `${indent}if (${resourceType}.userId !== user.userId) {`,
              `${indent}  return { status: 403, data: { error: 'Forbidden: You do not have access to this ${resourceType}' } };`,
              `${indent}}`
            ];

            patchedLines.splice(j, 0, ...patchSnippet);
            patchApplied = true;
            patchDescription = `Injected ownership verification for '${resourceType}.userId === user.userId' before returning resource data.`;
            break;
          }
        }
        if (patchApplied) break;
      }
    }

    if (!patchApplied) {
      throw new Error(`Could not determine safe injection point for patch in ${filePath}`);
    }

    const patchedContent = patchedLines.join('\n');
    const unifiedDiff = this.createUnifiedDiff(filePath, originalContent, patchedContent);

    return {
      filePath,
      originalContent,
      patchedContent,
      unifiedDiff,
      patchDescription,
    };
  }

  static createUnifiedDiff(filename, oldStr, newStr) {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    
    let diff = `--- a/${filename}\n+++ b/${filename}\n`;
    let i = 0, j = 0;
    
    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        i++;
        j++;
      } else {
        const startLine = i + 1;
        diff += `@@ -${startLine},5 +${startLine},9 @@\n`;
        // Context line
        if (i > 0) diff += ` ${oldLines[i - 1]}\n`;
        
        while (j < newLines.length && (i >= oldLines.length || oldLines[i] !== newLines[j])) {
          diff += `+${newLines[j]}\n`;
          j++;
        }
        if (i < oldLines.length) {
          diff += ` ${oldLines[i]}\n`;
          i++;
        }
        break;
      }
    }
    return diff;
  }
}
