const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);
const fileIndex = args.findIndex(arg => arg.startsWith('--file='));
const fileName = fileIndex !== -1 ? args[fileIndex].replace('--file=', '') : 'user';
const defaultUrl = process.env.BASE_URL || 'https://www.baidu.com';
const targetUrl = args.filter(arg => !arg.startsWith('--file='))[0] || defaultUrl;

const authPath = path.join(__dirname, '..', '.auth', 'user.json');

// 检查登录状态文件是否存在
if (!fs.existsSync(authPath)) {
  console.log('');
  console.log('⚠️  未找到登录状态文件: .auth/user.json');
  console.log('');
  console.log('请先运行登录测试保存状态:');
  console.log('  pnpm run login:save');
  console.log('');
  process.exit(1);
}

const outputPath = path.join(__dirname, '..', 'tests', `${fileName}.spec.ts`);

let command = `npx playwright codegen --load-storage="${authPath}" -b chromium -o "${outputPath}" ${targetUrl}`;

console.log(`录制脚本: tests/${fileName}.spec.ts`);
console.log(`目标地址: ${targetUrl}`);
console.log(`登录状态: .auth/user.json`);
console.log('');

execSync(command, { stdio: 'inherit' });
