import { config } from 'dotenv';
import { resolve } from 'path';

// 加载根目录的 .env 文件
config({ path: resolve(__dirname, '..', '..', '.env') });

/**
 * 配置类
 */
export class Config {
  /**
   * 基础地址
   */
  static get baseUrl(): string {
    return process.env.BASE_URL || 'https://www.baidu.com';
  }

  /**
   * 登录用户名
   */
  static get loginUsername(): string {
    return process.env.LOGIN_USERNAME || '';
  }

  /**
   * 登录密码
   */
  static get loginPassword(): string {
    return process.env.LOGIN_PASSWORD || '';
  }

  /**
   * 测试超时时间
   */
  static get testTimeout(): number {
    return parseInt(process.env.TEST_TIMEOUT || '120000', 10);
  }

  /**
   * 获取完整 URL
   * @param path 路径，如 /#/customer
   */
  static getUrl(path: string = ''): string {
    const base = this.baseUrl.replace(/\/$/, '');
    const p = path.replace(/^\//, '');
    return p ? `${base}/${p}` : base;
  }
}

/**
 * 导出配置对象，方便使用
 */
export const env = {
  baseUrl: Config.baseUrl,
  loginUsername: Config.loginUsername,
  loginPassword: Config.loginPassword,
  testTimeout: Config.testTimeout,
  getUrl: Config.getUrl.bind(Config),
};
