import { readFileSync } from 'fs';
import { resolve } from 'path';

export default function getVersion() {
  const { version } = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));
  return version;
}
