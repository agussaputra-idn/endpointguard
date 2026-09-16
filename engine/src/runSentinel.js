import path from 'path';
import { fileURLToPath } from 'url';
import { SentinelAgent } from './sentinel/sentinelAgent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const outputDir = path.resolve(rootDir, 'sentinel-rules');

  const sentinel = new SentinelAgent({ outputDir });
  await sentinel.run();
}

main().catch(console.error);
