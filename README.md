# GitHub Stars Showcase

> **Demo**: [github-stars-showcase.itmirror.top](https://github-stars-showcase.itmirror.top)

AI 驱动的 GitHub Stars 管理和展示网站。支持多个主流 AI 模型厂商，自动分析你的 starred 仓库，生成分类和 AI 介绍，并通过纯静态网站展示。

## 功能特性

- 🤖 **多模型支持**：支持 Anthropic、OpenAI、Google、Cohere、DeepSeek 及自定义 provider
- 🎯 **AI 自动分析**：批量分析仓库，生成分类和 AI 介绍
- 🏷️ **智能分类**：自动将仓库归类到 28 个预定义分类
- 🔄 **增量更新**：只分析新 star 的仓库，不会改变已有分类
- 🔗 **GitHub Lists 同步**：Playwright 自动化同步到 GitHub Stars Lists
- 🔍 **强大筛选**：支持按分类、关键词搜索
- ⚡ **纯静态网站**：Next.js 静态导出，访问速度快，无服务器成本
- 💰 **Token 优化**：增量分析 + README 前 500 字符，节省约 90% token

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，配置 GitHub Token 和 AI Provider：

```env
# GitHub Token (必需)
GITHUB_TOKEN=your_github_token_here

# AI Provider 配置
AI_PROVIDER=anthropic  # 可选: anthropic, openai, google, cohere, deepseek, custom
AI_API_KEY=your_api_key_here
AI_MODEL=  # 可选，不填则使用默认模型
```

**获取 GitHub Token：**
1. 访问 https://github.com/settings/tokens
2. 创建 Personal Access Token (classic)
3. 勾选 `public_repo` 权限

**选择 AI Provider：**

| Provider      | 默认模型                 | 可用模型                                           | 获取 API Key                   |
| ------------- | ------------------------ | -------------------------------------------------- | ------------------------------ |
| **Anthropic** | claude-sonnet-4-20250514 | claude-opus-4-20250514, claude-3-5-sonnet-20241022 | https://console.anthropic.com/ |
| **OpenAI**    | gpt-4o-mini              | gpt-4o, gpt-4-turbo, gpt-3.5-turbo                 | https://platform.openai.com/   |
| **Google**    | gemini-2.0-flash-exp     | gemini-1.5-pro, gemini-1.5-flash                   | https://aistudio.google.com/   |
| **Cohere**    | command-r                | command-r-plus, command                            | https://dashboard.cohere.com/  |
| **DeepSeek**  | deepseek-chat            | deepseek-reasoner                                  | https://platform.deepseek.com/ |
| **Custom**    | 自定义                   | 自定义                                             | 需提供 `AI_BASE_URL`           |

**使用自定义 Provider：**
```env
AI_PROVIDER=custom
AI_API_KEY=your_custom_api_key
AI_MODEL=your_model_name
AI_BASE_URL=https://your-api-endpoint.com
```

### 3. 运行更新脚本

```bash
pnpm run update
```

这将执行以下步骤：
1. 获取你的 starred 仓库（包括 README 前 500 字符）
2. AI 批量分析（10 个仓库/批）
3. 生成最终数据文件
4. 构建静态网站

### 4. 预览网站

**开发模式：**
```bash
pnpm run dev
```

**生产模式：**
```bash
npx serve out
```

### 5. 部署到腾讯云 EdgeOne Pages

1. 运行 `pnpm run build` 生成静态文件到 `out/` 目录
2. 登录腾讯云 EdgeOne Pages 控制台
3. 创建新站点，上传 `out/` 目录
4. 配置自定义域名（可选）

## 项目结构

```
github-stars-showcase/
├── scripts/
│   ├── fetch-stars.ts              # 获取 starred 仓库
│   ├── analyze-repos.ts            # AI 增量分析
│   ├── generate-data.ts            # 生成前端数据
│   ├── ai-providers.ts             # AI Provider 抽象层
│   ├── github-lists-automation.ts  # Playwright 同步到 GitHub Lists
│   └── update.ts                   # 主流程脚本
├── app/
│   ├── page.tsx            # 首页
│   ├── layout.tsx          # 布局
│   ├── globals.css         # 全局样式
│   └── components/
│       ├── RepoCard.tsx    # 仓库卡片
│       ├── FilterBar.tsx   # 筛选栏
│       └── SearchBar.tsx   # 搜索栏
├── public/
│   └── data/
│       └── repos.json      # 生成的仓库数据
├── data/
│   ├── stars-raw.json              # 原始 starred 数据（gitignored）
│   ├── analyzed.json               # AI 分析结果（追踪）
│   └── github-lists-progress.json  # GitHub Lists 同步进度（追踪）
├── next.config.js          # Next.js 配置
├── tailwind.config.js      # Tailwind CSS 配置
└── package.json
```

## 成本估算

以 239 个仓库为例：

| Provider  | 模型             | 预估 Tokens | 预估成本 |
| --------- | ---------------- | ----------- | -------- |
| Anthropic | claude-sonnet-4  | 47K         | $0.24    |
| OpenAI    | gpt-4o-mini      | 47K         | $0.01    |
| Google    | gemini-2.0-flash | 47K         | 免费     |
| Cohere    | command-r        | 47K         | $0.02    |
| DeepSeek  | deepseek-chat    | 47K         | $0.01    |

**后续增量更新**：成本极低

## 技术栈

- **前端**：Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **AI 分析**：支持 Anthropic、OpenAI、Google、Cohere、DeepSeek 及自定义 provider
- **数据获取**：GitHub REST API
- **部署**：腾讯云 EdgeOne Pages（纯静态）

## 常见问题

### Q: 如何切换 AI 模型？
A: 编辑 `.env.local`，修改 `AI_PROVIDER` 和 `AI_MODEL`。例如：
```env
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
AI_API_KEY=your_openai_api_key
```

### Q: 如何使用自定义 API 端点？
A: 设置 `AI_PROVIDER=custom` 并提供 `AI_BASE_URL`：
```env
AI_PROVIDER=custom
AI_API_KEY=your_api_key
AI_MODEL=your_model_name
AI_BASE_URL=https://your-api-endpoint.com
```

### Q: 如何更新数据？

**增量更新（推荐）：**
```bash
# 1. 获取最新 stars（可能有新仓库）
npx tsx scripts/fetch-stars.ts

# 2. 增量分析新仓库（自动跳过已分析的）
npx tsx scripts/analyze-repos.ts

# 3. 生成前端数据
npx tsx scripts/generate-data.ts
```

**全量更新：**
```bash
pnpm run update
```

### Q: 如何同步到 GitHub Stars Lists？

使用 Playwright 自动化脚本将分类同步到 GitHub Stars Lists：

```bash
# 安装 Playwright（首次运行）
npx playwright install chromium

# 运行同步脚本
npx tsx scripts/github-lists-automation.ts
```

脚本会：
1. 打开浏览器并等待你登录 GitHub（首次需要手动登录）
2. 自动创建所有分类对应的 Lists（如果不存在）
3. 将每个仓库添加到对应的 List 中
4. 增量同步：只处理未同步的仓库

**进度保存**：同步进度保存在 `data/github-lists-progress.json`，中断后可以继续。

### Q: 如何自定义分类？
A: 编辑 `scripts/analyze-repos.js` 中的 prompt，修改分类列表。

### Q: 如何减少 token 消耗？
A: 可以调整 `scripts/fetch-stars.js` 中的 `readmePreview` 长度（默认 500 字符）。

### Q: 如何处理分析失败的仓库？
A: 失败的批次会保存到 `data/failed-batch-*.json`，可以手动重新分析。

## License

MIT
