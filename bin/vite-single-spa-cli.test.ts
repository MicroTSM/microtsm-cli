import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';

const outputPath = path.resolve(__dirname, '../dist/bin/vite-single-spa-cli.js');
const distFolder = path.resolve(__dirname, '../dist');

function execCommand(cmd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err && !stdout && !stderr) return reject(err);
      resolve({ stdout, stderr });
    });
  });
}

async function execTsCLI(args = '') {
  return execCommand(`node "${outputPath}" ${args}`);
}

beforeAll(async () => {
  // Clean up previous build
  if (fs.existsSync(distFolder)) {
    await execCommand(`rm -r "${distFolder}" --force`);
  }

  // Build using Vite
  const { stderr } = await execCommand(`npx vite build --config ./vite.config.cli.ts`);
  if (stderr) console.warn('⚠️ Vite Build Warning:', stderr);
});

describe('CLI', () => {
  it('should run the CLI with build command', async () => {
    const { stdout } = await execTsCLI('build');
    console.log('🚀 ~ it ~ stdout:', stdout);
    expect(stdout).toMatch(/build/i);
  });

  it('should show unknown command error', async () => {
    const { stderr } = await execTsCLI('notarealcmd');
    expect(stderr.toLowerCase()).toContain('unknown command');
  });
});
