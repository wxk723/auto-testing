import { test, expect, devices } from '@playwright/test';
import { env } from './utils/config';
import { SliderVerification, ERPSliderConfig } from './utils/slider';

/**
 * ERP移动端登录测试
 * 使用 iPhone 12 模拟移动设备
 */
test('移动端登录测试', async ({ page }) => {
  const username = env.loginUsername;
  const password = env.loginPassword;
  const baseUrl = env.baseUrl;

  console.log(`移动端测试: ${username}`);

  // 导航到登录页面
  await page.goto(baseUrl);
  await page.waitForLoadState('networkidle');

  // 等待登录表单加载
  await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });

  // 输入用户名
  const usernameInput = page.locator('input[placeholder="请输入账号"]');
  await usernameInput.tap();
  await usernameInput.fill(username);

  // 输入密码
  const passwordInput = page.locator('input[placeholder="请输入密码"]');
  await passwordInput.tap();
  await passwordInput.fill(password);

  // 点击登录按钮（移动端可能触发滑块）
  const loginButton = page.getByRole('button', { name: '登录', exact: true });
  await loginButton.tap();

  // 等待滑块出现（如果有）
  await page.waitForTimeout(500);
  const slider = page.locator('.dv_handler');
  const sliderVisible = await slider.isVisible().catch(() => false);

  if (sliderVisible) {
    console.log('检测到滑块，尝试自动滑动...');
    await SliderVerification.handleSlider(page, ERPSliderConfig);
    
    // 滑块验证成功后，点击登录按钮
    console.log('滑块验证完成，再次点击登录...');
    await page.waitForTimeout(500);
    await loginButton.tap();
  }

  // 等待登录跳转
  console.log('等待登录跳转...');
  const domainMatch = baseUrl.match(/https?:\/\/([^/]+)/);
  const domain = domainMatch ? domainMatch[1] : 'www.baidu.com';

  try {
    await page.waitForURL(
      new RegExp(`.*${domain.replace('.', '\\.')}/#/(?!auth).*`),
      { timeout: 15000 }
    );
    console.log('登录成功');
  } catch {
    // 如果没有跳转，检查页面状态
    const errorMsg = page.locator('.el-message--error, [class*="error"]').first();
    if (await errorMsg.isVisible().catch(() => false)) {
      const text = await errorMsg.textContent();
      console.log(`登录失败: ${text}`);
    }
  }

  // 验证登录成功
  await expect(page).not.toHaveURL(/.*login.*/);
});
