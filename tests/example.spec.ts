import { test, expect } from '@playwright/test';

test('示例测试', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
});
