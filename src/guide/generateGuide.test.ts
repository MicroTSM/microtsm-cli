import fs from 'fs';
import { expect } from 'vitest';
import { generateIndexPage } from './generateGuide';

describe('generateIndexPage', () => {
  it('should generate index.html with the correct content', async () => {
    process.env.__APP_NAME__ = 'test-app';
    const config = { entryFilePath: 'src/index.ts', outDir: 'dist' };
    await generateIndexPage(config);

    // Read the generated HTML file
    const outputPath = 'dist/index.html';
    const generatedHtml = fs.readFileSync(outputPath, 'utf-8');

    // Check if the generated HTML contains the expected content
    expect(generatedHtml).toContain(`const entryUrl = window.location.origin + ('/' + '${config.entryFilePath}').replace(/\\/+/g, '/');`);

    expect(generatedHtml).toContain(
      `Welcome! This guide provides step-by-step instructions for integrating and developing`,
    );
    expect(generatedHtml).toContain(`your test-app MicroApp within a single-spa application.`);
  });
});
