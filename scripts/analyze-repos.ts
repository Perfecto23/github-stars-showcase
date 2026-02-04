import fs from "node:fs";
import dotenv from "dotenv";
import {
	type AIProvider,
	createBuiltinProvider,
	createProvider,
	getBuiltinProviderConfig,
	listBuiltinProviders,
	listProviders,
	selectProviderInteractive,
} from "./ai-providers.js";

dotenv.config({ path: ".env.local" });

interface RawRepo {
	fullName: string;
	description: string;
	language: string;
	topics: string[];
	readmePreview: string;
}

interface AnalyzedRepo {
	fullName: string;
	category: string;
	aiSummary: string;
}

// 兼容旧格式的输出接口
interface AnalyzedRepoOutput {
	fullName: string;
	categories: string[];
	tags: string[];
	aiSummary: string;
}

// 从环境变量读取配置
const AI_PROVIDER = process.env.AI_PROVIDER || "anthropic";
const AI_MODEL = process.env.AI_MODEL || "";
const AI_API_KEY =
	process.env.AI_API_KEY ||
	process.env.ANTHROPIC_API_KEY ||
	process.env.OPENAI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL || "";

// 检查是否使用交互式选择模式
const useInteractive =
	process.argv.includes("--select") || process.argv.includes("-s");

// 创建 AI provider
let aiProvider: AIProvider;

async function initProvider(): Promise<AIProvider> {
	// 交互式选择模式
	if (useInteractive) {
		const selection = await selectProviderInteractive();
		return selection.provider;
	}

	// 检查是否是内置 Provider
	const builtinConfig = getBuiltinProviderConfig(AI_PROVIDER);
	if (builtinConfig) {
		console.log(`使用内置 Provider: ${builtinConfig.name}`);
		const model = AI_MODEL || builtinConfig.defaultModel;
		const modelInfo = builtinConfig.models.find((m) => m.id === model);
		console.log(`模型: ${modelInfo?.name || model}`);
		return createBuiltinProvider(AI_PROVIDER, model);
	}

	// 使用环境变量配置的 Provider
	return createProvider({
		provider: AI_PROVIDER,
		apiKey: AI_API_KEY,
		model: AI_MODEL,
		baseURL: AI_BASE_URL,
	});
}

try {
	aiProvider = await initProvider();
	console.log(`使用 AI Provider: ${aiProvider.name} (${aiProvider.model})`);
} catch (error) {
	console.error("❌ 创建 AI Provider 失败:", (error as Error).message);
	console.log("\n📦 内置 providers (无需配置 API Key):");
	listBuiltinProviders().forEach((p) => {
		console.log(`  - ${p.key}: ${p.name}`);
		console.log(`    模型: ${p.models.map((m) => m.name).join(", ")}`);
	});
	console.log("\n🔧 环境变量 providers:");
	listProviders().forEach((p) => {
		console.log(`  - ${p.key}: ${p.name}`);
		console.log(`    默认模型: ${p.defaultModel}`);
	});
	console.log("\n💡 提示: 使用 --select 或 -s 参数进入交互式选择模式");
	process.exit(1);
}

async function analyzeReposBatch(repos: RawRepo[]): Promise<AnalyzedRepo[]> {
	const prompt = `
# 任务：GitHub 仓库分类

你是一个专业的技术分类专家。请为每个仓库选择**最合适的一个分类**，并生成简介。

## 可选分类（共 30 个，必须精确匹配）

### AI & ML
- LLM 大模型
- AI Agent 智能体
- ML 机器学习
- Computer Vision 视觉
- NLP 自然语言

### 开发工具
- CLI 命令行
- DevTools 开发者工具
- Editor 编辑器
- Build 构建工具
- Testing 测试

### Web 开发
- Frontend 前端
- UI Components 组件
- CSS Styling 样式
- Full-Stack 全栈

### 后端 & 基础设施
- Backend 后端
- Database 数据库
- DevOps 运维
- Cloud 云服务
- Security 安全

### 跨平台
- Mobile 移动端
- Desktop 桌面端

### 数据 & 内容
- Data Processing 数据处理
- Visualization 可视化
- CMS 内容管理
- Scraping 爬虫

### 专业领域
- Web3 区块链
- Network 网络
- System 系统工具
- Learning 学习资源
- Algorithm 算法
- Awesome List 资源列表

## Few-shot 示例

输入：langchain-ai/langchain - Build context-aware reasoning applications
输出：{"fullName": "langchain-ai/langchain", "category": "LLM 大模型", "aiSummary": "构建 context-aware 推理应用的 Python 框架，支持多种 LLM 和工具链集成。"}

输入：vercel/next.js - The React Framework for the Web
输出：{"fullName": "vercel/next.js", "category": "Full-Stack 全栈", "aiSummary": "基于 React 的全栈框架，支持 SSR、SSG 和 API Routes，是现代 Web 开发首选。"}

输入：sindresorhus/awesome - Awesome lists about all kinds of topics
输出：{"fullName": "sindresorhus/awesome", "category": "Awesome List 资源列表", "aiSummary": "GitHub 上最全面的 Awesome List 汇总，涵盖编程、技术、学习资源等各领域精选列表。"}

输入：nicehash/NiceHashMiner - Mining made easy
输出：{"fullName": "nicehash/NiceHashMiner", "category": "Web3 区块链", "aiSummary": "简单易用的加密货币挖矿软件，支持自动选择最佳算法和矿池。"}

## 待分类仓库

${repos
	.map(
		(repo, idx) => `
[${idx + 1}] ${repo.fullName}
描述: ${repo.description || "无"}
语言: ${repo.language || "未知"}
Topics: ${repo.topics.join(", ") || "无"}
README: ${repo.readmePreview.slice(0, 300) || "无"}
`,
	)
	.join("\n")}

## 输出要求

返回一个 JSON 数组，每个对象包含：
- fullName: 仓库全名
- category: **只能选择一个**分类（必须精确匹配上面的分类名称）
- aiSummary: 中英文结合的简介（50-100字，技术术语用英文）

\`\`\`json
[
  {"fullName": "owner/repo", "category": "分类名称", "aiSummary": "简介..."}
]
\`\`\`

注意：
1. 每个仓库**只能有一个分类**
2. 分类名称必须**完全匹配**上面的列表
3. 必须返回**所有 ${repos.length} 个仓库**的结果
`;

	const responseText = await aiProvider.analyze(prompt);

	// 提取 JSON
	const jsonMatch = responseText.match(/\[[\s\S]*\]/);
	if (!jsonMatch) {
		throw new Error("无法从 AI 响应中提取 JSON");
	}

	return JSON.parse(jsonMatch[0]) as AnalyzedRepo[];
}

// 加载已分析的数据（增量分析的关键）
function loadExistingAnalyzed(): AnalyzedRepoOutput[] {
	const ANALYZED_FILE = "data/analyzed.json";
	try {
		if (fs.existsSync(ANALYZED_FILE)) {
			return JSON.parse(fs.readFileSync(ANALYZED_FILE, "utf-8"));
		}
	} catch {
		console.log("⚠️ 无法加载已有分析数据，将进行全量分析");
	}
	return [];
}

// 主流程：增量批量处理
console.log("开始 AI 增量分析...");

// 1. 加载原始数据和已分析数据
const rawRepos: RawRepo[] = JSON.parse(
	fs.readFileSync("data/stars-raw.json", "utf-8"),
);
const existingAnalyzed = loadExistingAnalyzed();
const existingSet = new Set(existingAnalyzed.map((r) => r.fullName));

// 2. 找出新仓库（在 stars-raw 但不在 analyzed 中）
const newRepos = rawRepos.filter((r) => !existingSet.has(r.fullName));

console.log(
	`📊 统计: 总共 ${rawRepos.length} 个仓库，已分析 ${existingAnalyzed.length} 个`,
);

if (newRepos.length === 0) {
	console.log("✅ 没有新仓库需要分析，数据已是最新");
	process.exit(0);
}

console.log(`🆕 发现 ${newRepos.length} 个新仓库需要分析`);

// 3. 只对新仓库进行 AI 分析
const analyzed: AnalyzedRepo[] = [];
const batchSize = 10;

for (let i = 0; i < newRepos.length; i += batchSize) {
	const batch = newRepos.slice(i, i + batchSize);
	console.log(
		`分析第 ${i + 1}-${Math.min(i + batchSize, newRepos.length)} 个新仓库...`,
	);

	try {
		const results = await analyzeReposBatch(batch);
		analyzed.push(...results);
		console.log(
			`✅ 批次完成，已分析 ${analyzed.length}/${newRepos.length} 个新仓库`,
		);
	} catch (error) {
		console.error(`❌ 批次失败:`, (error as Error).message);
		// 记录失败的批次
		fs.writeFileSync(
			`data/failed-batch-${i}.json`,
			JSON.stringify(batch, null, 2),
		);
	}

	// 避免速率限制
	await new Promise((resolve) => setTimeout(resolve, 1000));
}

// 4. 转换新分析的结果为兼容格式
const newOutput: AnalyzedRepoOutput[] = analyzed.map((repo) => ({
	fullName: repo.fullName,
	categories: [repo.category],
	tags: [],
	aiSummary: repo.aiSummary,
}));

// 5. 合并现有数据和新数据
const mergedOutput = [...existingAnalyzed, ...newOutput];

fs.writeFileSync("data/analyzed.json", JSON.stringify(mergedOutput, null, 2));
console.log(`✅ 增量分析完成！`);
console.log(`   新分析: ${analyzed.length} 个仓库`);
console.log(`   总计: ${mergedOutput.length} 个仓库`);
console.log(`数据已保存到 data/analyzed.json`);
