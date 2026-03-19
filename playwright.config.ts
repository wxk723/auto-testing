import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 120000,
  use: {
    trace: 'on-first-retry',
    actionTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      testMatch: /.*mobile.*\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      testMatch: /.*mobile.*\.spec\.ts/,
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],
});
