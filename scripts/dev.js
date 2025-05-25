import { build } from 'vite';
import { spawn } from 'child_process';
import path from 'path';

async function run() {
  let firstBuildDone = false;

  const watcher = await build({
    configFile: path.resolve('vite.config.ts'),
    root: process.cwd(),
    build: {
      watch: {
        // Only watch changes in mfe-app
        ignored: ['**/packages/**', '!**/playground/mfe-app/**'],
      },
    },
    logLevel: 'info',
  });

  watcher.on('event', (event) => {
    if (event.code === 'BUNDLE_END') {
      if (!firstBuildDone) {
        firstBuildDone = true;
        console.log('✅ First build done — running `pnpm mfe.build`...');

        const child = spawn('pnpm', ['mfe.build'], {
          stdio: 'inherit',
          env: process.env,
          shell: true,
        });

        child.on('exit', (code) => {
          if (code !== 0) {
            console.error(`❌ pnpm mfe.build failed with exit code ${code}`);
          } else {
            console.log('🚀 mfe.build finished successfully');
          }
        });
      } else {
        console.log('🔄 Rebuild complete');
      }
    }

    if (event.code === 'ERROR') {
      console.error('❌ Build error:', event.error);
    }
  });
}

run();
