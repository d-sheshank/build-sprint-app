import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  timeout: 90000,
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:5173',
    launchOptions: { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] },
  },
  webServer: process.env.TEST_URL ? undefined : {
    command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true,
  },
});
