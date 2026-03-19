import { test, expect } from '@playwright/test';
import { ERPSliderConfig } from './utils/slider';
import { env } from './utils/config';

/**
 * ERP登录测试
 * 登录成功后会自动保存状态到 .auth/user.json
 */
test.describe('ERP登录测试', () => {
  test.use({ actionTimeout: 60000 });

  test('登录测试', async ({ page, context }) => {
  // 从配置文件读取登录信息
  const username = env.loginUsername;
  const password = env.loginPassword;
  const baseUrl = env.baseUrl;

  console.log(`配置信息: baseUrl=${baseUrl}, username=${username}`);

  // 导航到登录页面
  await page.goto(baseUrl);
  await page.waitForLoadState('networkidle');

  // 等待登录表单加载
  await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 5000 });

  // 输入用户名
  const usernameInput = page.locator('input[placeholder="请输入账号"]');
  await usernameInput.click();
  await page.waitForTimeout(100);
  await usernameInput.fill(username);

  // 输入密码
  const passwordInput = page.locator('input[placeholder="请输入密码"]');
  await passwordInput.click();
  await page.waitForTimeout(100);
  await passwordInput.fill(password);

  // 先完成滑块验证
  console.log('开始滑块验证...');
  const { SliderVerification } = await import('./utils/slider');
  const sliderSuccess = await SliderVerification.handleSlider(page, ERPSliderConfig);
  
  expect(sliderSuccess).toBeTruthy();
  console.log('滑块验证完成');

  // 等待一下让验证状态生效
  await page.waitForTimeout(500);

  // 点击登录按钮
  const loginButton = page.getByRole('button', { name: '登录', exact: true });
  await loginButton.click();

  // 等待登录完成并跳转到首页
  console.log('等待登录跳转...');
  // 提取域名用于正则匹配
  const domainMatch = baseUrl.match(/https?:\/\/([^/]+)/);
  const domain = domainMatch ? domainMatch[1] : 'www.baidu.com';
  await page.waitForURL(new RegExp(`.*${domain.replace('.', '\\.')}/#/(?!auth).*`), { timeout: 15000 });
  console.log('登录成功，已跳转到首页');
  
  // 保存登录状态
  await context.storageState({ path: '.auth/user.json' });
  console.log('登录状态已保存到 .auth/user.json');
  
  // 验证登录成功
  await expect(page).not.toHaveURL(/.*login.*/);
  });
});
