import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { findUpSync } from 'find-up';

export default function getVersion() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const packagePath = findUpSync('package.json', {
    cwd: __dirname,
    type: 'file',
  });

  const { version = '0.0.0' } = packagePath ? JSON.parse(readFileSync(packagePath, 'utf-8')) : {};
  return version;
}
