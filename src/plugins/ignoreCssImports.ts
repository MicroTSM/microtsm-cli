import { Plugin } from 'vite';

const ignoreCssImports = (): Plugin => ({
  name: 'ignore-css-imports',
  load(id: string): string | null {
    if (id.endsWith('style.css')) return ''; // Returns an empty module, removing the CSS
    return null;
  },
});

export default ignoreCssImports;
