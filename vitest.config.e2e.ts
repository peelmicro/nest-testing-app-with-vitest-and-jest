import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    setupFiles: ['./test/vitest-setup.ts'],
    deps: {
      interopDefault: true,
      // For proper ESM/CommonJS interoperability
      inline: [/supertest/],
    }
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  resolve: {
    // This ensures proper CommonJS module resolution
    conditions: ['node'],
  },
}); 