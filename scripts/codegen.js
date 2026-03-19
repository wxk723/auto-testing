const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);
const fileIndex = args.findIndex(arg => arg.startsWith('--file='));
const fileName = fileIndex !== -1 ? args[fileIndex].replace('--file=', '') : 'user';
const targetUrl = args.filter(arg => !arg.startsWith('--file='))[0] || process.env.BASE_URL || 'https://www.baidu.com';

const outputPath = path.join(__dirname, '..', 'tests', `${fileName}.spec.ts`);

let command = `npx playwright codegen -b chromium -o "${outputPath}" ${targetUrl}`;

console.log(`录制脚本: tests/${fileName}.spec.ts`);
console.log(`目标地址: ${targetUrl}`);
console.log(`命令: ${command}`);

execSync(command, { stdio: 'inherit' });
