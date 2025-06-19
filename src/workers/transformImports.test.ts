import { describe, expect, it } from 'vitest';
import { transformImports } from './transformImports';

const importMap: Record<string, string> = {
  '@microtsm/vue': 'https://cdn.jsdelivr.net/npm/@microtsm/vue@0.0.22/dist/microtsm-vue.prod.js',
  'vue': 'https://cdn.jsdelivr.net/npm/vue@3.5.16/dist/vue.runtime.esm-browser.prod.js',
  'axios': 'https://cdn.jsdelivr.net/npm/axios@1.8.2/dist/esm/axios.min.js',
  'vue-router': 'https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.esm-bundler.js',
  'package/': 'https://cdn.jsdelivr.net/npm/@fewangsit/wangsvue-fats@1.0.1-rc.7/',
};

describe('transformImports', async () => {
  it('seharusnya mengubah side-effect import eksternal', async () => {
    const input = `import "@microtsm/vue";`;
    const expected = `import "https://cdn.jsdelivr.net/npm/@microtsm/vue@0.0.22/dist/microtsm-vue.prod.js";`;
    const output = await transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah import tanpa spasi ekstra', async () => {
    const input = `import{createApp}from"vue";`;
    const expected = `import {createApp} from "https://cdn.jsdelivr.net/npm/vue@3.5.16/dist/vue.runtime.esm-browser.prod.js";`;
    const output = await transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah import dengan alias', async () => {
    const input = `import axios, { AxiosError } from "axios";`;
    const expected = `import axios, { AxiosError } from "https://cdn.jsdelivr.net/npm/axios@1.8.2/dist/esm/axios.min.js";`;
    const output = await transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya tidak mengubah import relatif', async () => {
    const input = `import { helper } from "./utils.js";`;
    const expected = `import { helper } from "./utils.js";`;
    const output = await transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah dynamic import literal', async () => {
    const input = `await import("axios")`;
    const expected = `await MicroTSM.load("axios")`;
    const output = await transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah dynamic import dengan ekspresi (variabel)', async () => {
    const input = `await import(moduleName)`;
    const expected = `await MicroTSM.load(moduleName)`;
    const output = await transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah import dengan vue-router', async () => {
    const input = `import { createRouter as R, createWebHistory as $ } from "vue-router";`;
    const expected = `import { createRouter as R, createWebHistory as $ } from "https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.esm-bundler.js";`;
    const output = await transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah import dengan prefix dan resolve file index.es.js', async () => {
    const input = `import Button from "package/button";`;
    const expected = `import Button from "https://cdn.jsdelivr.net/npm/@fewangsit/wangsvue-fats@1.0.1-rc.7/button/index.es.js";`;
    const output = await transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya resolve url dari url cache dan lebih cepat dari resolve awal', async () => {
    const input = `import Button from "package/button";`;
    const expected = `import Button from "https://cdn.jsdelivr.net/npm/@fewangsit/wangsvue-fats@1.0.1-rc.7/button/index.es.js";`;

    const t0 = performance.now();
    let output = await transformImports(input, importMap);
    const uncachedTime = performance.now() - t0;

    expect(output).toBe(expected);

    const t1 = performance.now();
    output = await transformImports(input, importMap);
    const cachedTime = performance.now() - t1;

    expect(output).toBe(expected);

    console.log(`⏱️ Uncached: ${uncachedTime.toFixed(2)}ms, Cached: ${cachedTime.toFixed(2)}ms`);
    expect(cachedTime).toBeLessThan(uncachedTime);
  });
});
