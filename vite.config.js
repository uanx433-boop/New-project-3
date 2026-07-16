import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.glb'],
  build: {
    assetsInlineLimit: 0
  }
});
