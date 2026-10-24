import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium', channel: 'chrome' },
  webServer: { command: 'node scripts/serve.mjs', port: 5173, reuseExistingServer: !process.env.CI },
});
