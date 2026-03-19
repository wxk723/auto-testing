const { execSync } = require('child_process');

const args = process.argv.slice(2);
const fileIndex = args.findIndex(arg => arg.startsWith('--file='));
const fileName = fileIndex !== -1 ? args[fileIndex].replace('--file=', '') : null;
const extraArgs = args.filter(arg => !arg.startsWith('--file='));

if (!fileName) {
  console.log('用法: pnpm run test:file --file=文件名 [其他参数]');
  console.log('');
  console.log('示例:');
  console.log('  pnpm run test:file --file=login');
  console.log('  pnpm run test:file --file=login --debug');
  console.log('  pnpm run test:file --file=baidu --ui');
  process.exit(1);
}

const testPath = `tests/${fileName}.spec.ts`;

let command = `npx playwright test ${testPath}`;
if (extraArgs.length > 0) {
  command += ' ' + extraArgs.join(' ');
}

console.log(`运行测试: tests/${fileName}.spec.ts`);
console.log(`命令: ${command}`);
console.log('');

execSync(command, { stdio: 'inherit' });
