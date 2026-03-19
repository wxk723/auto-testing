import { test, expect } from '@playwright/test';
import { env } from './utils/config';

/**
 * ERP登录测试（手动模式）
 * 使用 headed 模式运行，手动完成滑块验证
 */
test.describe('ERP登录测试 - 手动模式', () => {
  test('登录测试（手动滑块）', async ({ page }) => {
    // 从配置文件读取登录信息
    const username = env.loginUsername;
    const password = env.loginPassword;
    const baseUrl = env.baseUrl;

    // 导航到登录页面
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    // 等待登录表单加载
    await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 5000 });

    // 输入用户名
    const usernameInput = page.locator('input[placeholder="请输入账号"]');
    await usernameInput.click();
    await usernameInput.fill(username);

    // 输入密码
    const passwordInput = page.locator('input[placeholder="请输入密码"]');
    await passwordInput.click();
    await passwordInput.fill(password);

    // 等待用户手动完成滑块验证
    console.log('请在浏览器中手动完成滑块验证...');
    
    // 等待滑块验证成功（dv_text 变成"验证成功"）
    const dvText = page.locator('.dv_text');
    await dvText.waitFor({ state: 'visible', timeout: 6000 });
    
    // 等待文案变成"验证成功"
    await page.waitForFunction(
      () => document.querySelector('.dv_text')?.textContent?.includes('验证成功'),
      { timeout: 60000 }
    );
    console.log('检测到滑块验证成功');

    // 等待一下让验证状态生效
    await page.waitForTimeout(500);

    // 点击登录按钮
    const loginButton = page.getByRole('button', { name: '登录', exact: true });
    await loginButton.click();

    // 等待登录完成并跳转到首页
    console.log('等待登录跳转...');
    const domainMatch = baseUrl.match(/https?:\/\/([^/]+)/);
    const domain = domainMatch ? domainMatch[1] : 'www.baidu.com';
    await page.waitForURL(new RegExp(`.*${domain.replace('.', '\\.')}/#/(?!auth).*`), { timeout: 15000 });
    console.log('登录成功，已跳转到首页');
    
    // 验证登录成功
    await expect(page).not.toHaveURL(/.*login.*/);
  });
});
