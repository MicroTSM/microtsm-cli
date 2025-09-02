import path from 'path';
import fs from 'fs';

export default function getAppInfo() {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return {
    name: pkg.name || 'app',
    version: pkg.version || '0.0.0',
  };
}
