import path from 'path';
import { fileURLToPath } from 'url';
import { SandboxRunner } from './verifier/sandboxRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const reportOutputPath = path.resolve(rootDir, 'verification-report.json');

  const runner = new SandboxRunner({
    reportOutputPath,
  });

  const report = runner.runVerification();

  if (report.verdict !== 'VERIFIED_SAFE_TO_MERGE') {
    process.exit(1);
  }
}

main().catch(console.error);
