import path from 'path';
import fs from 'fs';

export default function getAppName() {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return pkg.name || 'app';
}
