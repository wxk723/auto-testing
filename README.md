# Playwright 测试项目

基于 Playwright 的自动化测试项目，支持脚本录制和测试运行。

## 环境要求

- Node.js 18+
- pnpm

## 安装

```bash
pnpm install
```

## 配置文件

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `BASE_URL` | 系统基础地址 | `https://xxx.xxx.com` |
| `LOGIN_USERNAME` | 登录用户名 | - |
| `LOGIN_PASSWORD` | 登录密码 | - |
| `TEST_TIMEOUT` | 测试超时时间(ms) | `120000` |

### 代码中使用配置

```typescript
import { env } from './tests/utils/config';

// 使用配置
env.baseUrl      // 系统地址
env.loginUsername // 用户名
env.loginPassword // 密码
env.getUrl('/#/customer') // 拼接完整URL
```

## 录制测试脚本

### 方式一：无需登录的页面

```bash
# 默认保存到 tests/user.spec.ts
pnpm run codegen

# 自定义文件名
pnpm run codegen --file=login https://www.baidu.com
```

### 方式二：需要登录的页面（推荐）

**步骤1：先登录并保存状态**

```bash
pnpm run login:save
```

登录成功后，状态会保存到 `.auth/user.json`

**步骤2：使用登录状态录制脚本**

```bash
# 默认保存到 tests/user.spec.ts，已登录状态
pnpm run codegen:auth

# 自定义文件名
pnpm run codegen:auth --file=订单管理

# 录制指定页面
pnpm run codegen:auth --file=客户列表 https://xxx/#/customer
```

关闭浏览器窗口后，脚本会自动保存。

## 运行测试

```bash
# 运行所有测试
pnpm test

# 运行指定测试文件（动态指令）
pnpm run test:file --file=login
pnpm run test:file --file=baidu

# 运行指定测试文件 + 调试模式
pnpm run test:file --file=login --debug

# 运行指定测试文件 + UI 模式
pnpm run test:file --file=login --ui

# 运行单个测试文件（直接指定路径）
pnpm test tests/login.spec.ts

# 运行匹配名称的测试
npx playwright test -g "测试名称"

# UI 模式运行测试
pnpm test:ui

# 调试模式
pnpm test:debug
```

### 运行模式说明

| 模式 | 参数 | 说明 |
|------|------|------|
| **无头模式** | 默认 | 不显示浏览器窗口，适合 CI/CD |
| **有头模式** | `--headed` | 显示浏览器窗口，可视化调试 |
| **UI 模式** | `--ui` | 图形界面，支持单步调试 |
| **调试模式** | `--debug` | 进入调试模式，断点调试 |

```bash
# 有头模式 - 显示浏览器窗口
pnpm test tests/erp-login.spec.ts --headed

# UI 模式 - 图形化测试界面
pnpm test tests/erp-login.spec.ts --ui

# 调试模式 - 支持断点
pnpm test tests/erp-login.spec.ts --debug

# 慢速模式 - 减慢操作便于观察
pnpm test tests/erp-login.spec.ts --headed --slow-mo=500

# 移动端测试
pnpm test tests/erp-login-mobile.spec.ts --project=mobile-safari
```

## 查看测试报告

```bash
pnpm run report
```

## 项目结构

```
test/
├── .auth/                 # 登录状态存储
│   └── user.json          # 用户登录状态
├── package.json           # 项目配置
├── playwright.config.ts   # Playwright 配置
├── scripts/
│   ├── codegen.js         # 录制脚本
│   ├── codegen-auth.js    # 带登录状态的录制脚本
│   └── test-file.js       # 动态测试脚本
├── tests/                 # 测试文件目录
│   ├── utils/             # 公共模块
│   │   ├── config.ts      # 配置文件
│   │   └── slider.ts      # 滑块验证模块
│   ├── example.spec.ts    # 示例测试
│   ├── erp-login.spec.ts        # ERP登录测试（自动滑块）
│   ├── erp-login-manual.spec.ts # ERP登录测试（手动滑块）
│   └── erp-login-mobile.spec.ts # ERP移动端登录测试
├── test-results/          # 测试结果
└── playwright-report/     # 测试报告
```

## 滑块验证模块

滑块验证模块 `tests/utils/slider.ts` 可被其他测试脚本调用：

```typescript
import { SliderVerification, ERPSliderConfig } from './utils/slider';

// 使用预设配置
await SliderVerification.handleSlider(page, ERPSliderConfig);

// 自定义配置
await SliderVerification.handleSlider(page, {
  sliderSelector: '.your-slider',
  trackSelector: '.your-track',
  distanceRatio: 1.0,  // 滑动距离比例
  steps: 35,           // 滑动步数
  stepDelay: 12,       // 每步延迟(ms)
});
```

## 登录状态原理

### 状态保存机制

Playwright 通过 `context.storageState()` 保存浏览器的存储状态：

```typescript
// 登录成功后保存状态
await context.storageState({ path: '.auth/user.json' });
```

保存的内容包含：

| 类型 | 说明 |
|------|------|
| **cookies** | 浏览器 Cookie |
| **localStorage** | 本地存储数据（token、用户信息等） |

### 状态文件示例

```json
{
  "cookies": [],
  "origins": [{
    "origin": "https://xxx",
    "localStorage": [
      {
        "name": "sys-v3.0.1-user",
        "value": "{
          \"isLogin\": true,
          \"info\": {
            \"accessToken\": \"xxx\",
            \"refreshToken\": \"xxx\",
            \"expiresTime\": \"2026-03-20 11:59:38\"
          }
        }"
      }
    ]
  }]
}
```

### 工作流程

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  登录测试        │     │  保存状态文件     │     │  录制/运行测试   │
│  erp-           │───▶│  .auth/user.json │───▶│  --load-storage │
│  login.spec.ts  │     │  (cookies +      │     │  自动注入登录态  │
└─────────────────┘     │   localStorage)  │     └─────────────────┘
                        └──────────────────┘
```

1. **登录** - 运行 `pnpm run login:save` 执行登录测试
2. **保存** - 登录成功后调用 `storageState()` 保存到 `.auth/user.json`
3. **加载** - 录制或运行测试时通过 `--load-storage` 加载登录状态

### 注意事项

- **状态会过期** - token 有过期时间，过期后需重新运行 `pnpm run login:save`
- **不要提交到 git** - `.auth/user.json` 包含敏感信息，已加入 `.gitignore`
- **重新登录** - 如果录制时发现未登录，说明状态已过期，重新保存即可

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm test` | 运行所有测试 |
| `pnpm run test:file --file=名称` | 运行指定测试文件 |
| `pnpm run test:file --file=名称 --debug` | 调试模式运行指定文件 |
| `pnpm run test:file --file=名称 --ui` | UI 模式运行指定文件 |
| `pnpm test:ui` | UI 模式运行所有测试 |
| `pnpm test:debug` | 调试模式运行所有测试 |
| `pnpm run codegen` | 录制测试脚本（无需登录） |
| `pnpm run codegen --file=名称` | 录制并指定文件名 |
| `pnpm run codegen --file=名称 网站地址` | 录制指定网站 |
| `pnpm run login:save` | 登录并保存状态 |
| `pnpm run test:mobile` | 移动端登录测试 |
| `pnpm run codegen:auth` | 使用登录状态录制脚本 |
| `pnpm run codegen:auth --file=名称` | 带登录状态录制 |
| `pnpm run codegen:auth --file=名称 网站地址` | 带登录状态录制指定网站 |
| `pnpm run report` | 查看测试报告 |

### 录制指定网站示例

```bash
# 录制指定页面（无需登录）
pnpm run codegen --file=客户列表 https://xxx.xxx.com/#/customer

# 录制指定页面（使用登录状态）
pnpm run codegen:auth --file=订单管理 https://xxx.xxx.com/#/order

# 录制首页
pnpm run codegen:auth --file=首页

# 录制用户管理页面
pnpm run codegen:auth --file=用户管理 https://xxx.xxx.com/#/system/user
```

> 注意：不指定 URL 时，默认从配置文件 `BASE_URL` 读取地址

## 浏览器配置

默认使用 Chromium 浏览器。如需添加其他浏览器，编辑 `playwright.config.ts`：

```ts
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
],
```

安装浏览器：

```bash
npx playwright install firefox
npx playwright install webkit
```

运行指定浏览器测试：

```bash
npx playwright test --project=firefox
```
# 参考文章
- [playwright最详细使用教程](https://blog.csdn.net/m0_51156601/article/details/126886040)
- [爬虫利器](https://cuiqingcai.com/36045.html)

# 项目地址
- [auto-testing](https://github.com/wxk723/auto-testing)
