import path from 'path';
import { fileURLToPath } from 'url';
import { PatchAgent } from './blueTeam/patchAgent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const targetDir = path.resolve(__dirname);
  const patchesDir = path.resolve(rootDir, 'patches');
  const dossierPath = path.resolve(rootDir, 'exploit-dossier.json');

  const shouldApply = process.argv.includes('--apply');

  const agent = new PatchAgent({
    targetDir,
    patchesDir,
  });

  const results = await agent.run(dossierPath, shouldApply);

  console.log('\n===============================================================');
  console.log(`🎉 REMEDIATION PROCESS FINISHED. Total Patches: ${results.length}`);
  if (!shouldApply) {
    console.log('💡 Note: Run with --apply to write changes directly to source code:');
    console.log('   node src/runPatchAgent.js --apply');
  }
  console.log('===============================================================');
}

main().catch(console.error);
