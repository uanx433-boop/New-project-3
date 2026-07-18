import { defineConfig } from 'vite';

export default defineConfig({
  base: '/New-project-3/',
  assetsInclude: ['**/*.glb'],
  build: {
    assetsInlineLimit: 0
  }
});
