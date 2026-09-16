import fs from 'fs';
import path from 'path';

export class CodeLocator {
  /**
   * Search through files in targetDir to locate the handler for a given endpoint and method.
   */
  static locateHandler(targetDir, endpointPattern, method = 'GET') {
    const results = [];
    const files = this.scanDir(targetDir);

    // Normalize endpoint patterns: e.g. "/api/v1/invoices/:id"
    // matches router.get('/api/v1/invoices/:id', ...) or pathname.match(/^\/api\/v1\/invoices\/.../)
    const routeParts = endpointPattern.split('/').filter(Boolean);
    const basePrefix = routeParts.slice(0, -1).join('/'); // e.g. "api/v1/invoices"

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip comment lines or test config lists
        if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('endpointsToAudit')) {
          continue;
        }

        // Look at window of 3 lines to capture split declarations
        const windowText = lines.slice(i, Math.min(lines.length, i + 3)).join(' ');

        // Check if window contains endpoint path/prefix
        const hasDirectPath = windowText.includes(endpointPattern);
        const hasPrefix = basePrefix && windowText.includes(basePrefix);
        const hasRegexParam = windowText.includes('([^/]+)') || windowText.includes(':id') || windowText.includes('params.');

        const hasRoute = hasDirectPath || (hasPrefix && hasRegexParam);
        const hasMethod = windowText.includes(method) || windowText.toLowerCase().includes(`.${method.toLowerCase()}(`);

        if (hasRoute && hasMethod) {
          results.push({
            filePath: file,
            lineNumber: i + 1,
            lineContent: line.trim(),
            context: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 25)).join('\n')
          });
          break;
        }
      }
    }

    return results;
  }

  static scanDir(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    const engineInternalFiles = [
      'codeLocator',
      'runPatchAgent',
      'patchAgent',
      'patchSynthesizer',
      'prGenerator',
      'harvester',
      'crossFuzzer',
      'semanticOracle',
      'sessionManager',
      'types',
      'index.js'
    ];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'patches', 'blueTeam'].includes(entry.name)) {
          files = files.concat(this.scanDir(fullPath));
        }
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) &&
        !engineInternalFiles.some(f => entry.name.includes(f))
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }
}
