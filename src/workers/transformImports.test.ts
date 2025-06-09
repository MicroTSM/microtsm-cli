import { describe, expect, it } from 'vitest';
import { transformImports } from './transformImports';

const importMap: Record<string, string> = {
  '@microtsm/vue': 'https://cdn.jsdelivr.net/npm/@microtsm/vue@0.0.22/dist/microtsm-vue.prod.js',
  'vue': 'https://cdn.jsdelivr.net/npm/vue@3.5.16/dist/vue.runtime.esm-browser.prod.js',
  'axios': 'https://cdn.jsdelivr.net/npm/axios@1.8.2/dist/esm/axios.min.js',
  'vue-router': 'https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.esm-bundler.js',
};

describe('transformImports', () => {
  it('seharusnya mengubah side-effect import eksternal', () => {
    const input = `import "@microtsm/vue";`;
    const expected = `import "https://cdn.jsdelivr.net/npm/@microtsm/vue@0.0.22/dist/microtsm-vue.prod.js";`;
    const output = transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah import tanpa spasi ekstra', () => {
    const input = `import{createApp}from"vue";`;
    const expected = `import {createApp} from "https://cdn.jsdelivr.net/npm/vue@3.5.16/dist/vue.runtime.esm-browser.prod.js";`;
    const output = transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah import dengan alias', () => {
    const input = `import axios, { AxiosError } from "axios";`;
    const expected = `import axios, { AxiosError } from "https://cdn.jsdelivr.net/npm/axios@1.8.2/dist/esm/axios.min.js";`;
    const output = transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya tidak mengubah import relatif', () => {
    const input = `import { helper } from "./utils.js";`;
    const expected = `import { helper } from "./utils.js";`;
    const output = transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah dynamic import literal', () => {
    const input = `await import("axios")`;
    const expected = `await MicroTSM.load("axios")`;
    const output = transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah dynamic import dengan ekspresi (variabel)', () => {
    const input = `await import(moduleName)`;
    const expected = `await MicroTSM.load(moduleName)`;
    const output = transformImports(input, importMap);
    expect(output).toBe(expected);
  });

  it('seharusnya mengubah import dengan vue-router', () => {
    const input = `import { createRouter as R, createWebHistory as $ } from "vue-router";`;
    const expected = `import { createRouter as R, createWebHistory as $ } from "https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.esm-bundler.js";`;
    const output = transformImports(input, importMap);
    expect(output).toBe(expected);
  });
});
