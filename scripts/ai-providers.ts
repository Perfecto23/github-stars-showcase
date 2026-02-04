import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CohereClient } from "cohere-ai";
import OpenAI from "openai";

/**
 * AI Provider 抽象层
 * 支持多个主流 AI 模型厂商和内置 Provider
 */

// Provider 接口
export interface AIProvider {
	name: string;
	model: string;
	analyze(prompt: string): Promise<string>;
}

// 模型信息
interface ModelInfo {
	id: string;
	name: string;
	cost: { input: number; output: number };
}

// 内置 Provider 配置类型
interface BuiltinProviderConfig {
	name: string;
	baseUrl: string;
	apiKeyEnv: string;
	api: "anthropic-messages" | "openai-responses" | "google-generative-ai";
	models: ModelInfo[];
	defaultModel: string;
}

// 内置 Provider 配置（可以添加自定义的代理服务）
// 注意：添加自己的代理时，请确保 API Key 通过环境变量配置，不要硬编码
const BUILTIN_PROVIDERS: Record<string, BuiltinProviderConfig> = {
	// 示例：如果你有自己的 API 代理，可以这样配置：
	// "my-proxy": {
	//   name: "My Proxy",
	//   baseUrl: "https://my-proxy.example.com",
	//   apiKeyEnv: "MY_PROXY_API_KEY",
	//   api: "openai-responses",
	//   models: [{ id: "gpt-4", name: "GPT-4", cost: { input: 10, output: 30 } }],
	//   defaultModel: "gpt-4",
	// },
};

// 环境变量 Provider 配置类型
interface EnvProviderConfig {
	name: string;
	models: string[];
	defaultModel: string;
	baseURL?: string;
}

// 环境变量 Provider 配置
const ENV_PROVIDERS: Record<string, EnvProviderConfig> = {
	anthropic: {
		name: "Anthropic",
		models: [
			"claude-sonnet-4-20250514",
			"claude-opus-4-20250514",
			"claude-3-5-sonnet-20241022",
		],
		defaultModel: "claude-sonnet-4-20250514",
	},
	openai: {
		name: "OpenAI",
		models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
		defaultModel: "gpt-4o-mini",
	},
	google: {
		name: "Google",
		models: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
		defaultModel: "gemini-2.0-flash-exp",
	},
	cohere: {
		name: "Cohere",
		models: ["command-r-plus", "command-r", "command"],
		defaultModel: "command-r",
	},
	deepseek: {
		name: "DeepSeek",
		models: ["deepseek-chat", "deepseek-reasoner"],
		defaultModel: "deepseek-chat",
		baseURL: "https://api.deepseek.com",
	},
	custom: {
		name: "Custom",
		models: [],
		defaultModel: "",
	},
};

/**
 * 创建内置 Provider 实例
 */
export function createBuiltinProvider(
	providerKey: string,
	modelId?: string,
): AIProvider {
	const config = BUILTIN_PROVIDERS[providerKey];
	if (!config) {
		throw new Error(`不支持的内置 provider: ${providerKey}`);
	}

	const apiKey = process.env[config.apiKeyEnv];
	if (!apiKey) {
		throw new Error(`缺少环境变量: ${config.apiKeyEnv}`);
	}

	const selectedModel = modelId || config.defaultModel;
	const modelInfo = config.models.find((m) => m.id === selectedModel);
	if (!modelInfo) {
		throw new Error(`Provider ${providerKey} 不支持模型: ${selectedModel}`);
	}

	switch (config.api) {
		case "anthropic-messages":
			return new AnthropicProxyProvider(apiKey, selectedModel, config.baseUrl);
		case "openai-responses":
			return new OpenAIProxyProvider(apiKey, selectedModel, config.baseUrl);
		case "google-generative-ai":
			return new GoogleProxyProvider(apiKey, selectedModel, config.baseUrl);
		default:
			throw new Error(`未实现的 API 类型: ${config.api}`);
	}
}

interface CreateProviderConfig {
	provider?: string;
	apiKey?: string;
	model?: string;
	baseURL?: string;
}

/**
 * 创建 AI Provider 实例
 */
export function createProvider(config: CreateProviderConfig): AIProvider {
	const { provider = "anthropic", apiKey, model, baseURL } = config;

	// 检查是否是内置 Provider
	if (BUILTIN_PROVIDERS[provider]) {
		return createBuiltinProvider(provider, model);
	}

	const providerConfig = ENV_PROVIDERS[provider];
	if (!providerConfig) {
		throw new Error(`不支持的 provider: ${provider}`);
	}

	if (!apiKey) {
		throw new Error(`Provider ${provider} 需要提供 API Key`);
	}

	const selectedModel = model || providerConfig.defaultModel;

	switch (provider) {
		case "anthropic":
			return new AnthropicProvider(apiKey, selectedModel);
		case "openai":
			return new OpenAIProvider(apiKey, selectedModel);
		case "google":
			return new GoogleProvider(apiKey, selectedModel);
		case "cohere":
			return new CohereProvider(apiKey, selectedModel);
		case "deepseek":
			return new DeepSeekProvider(
				apiKey,
				selectedModel,
				baseURL || providerConfig.baseURL || "",
			);
		case "custom":
			if (!baseURL) {
				throw new Error("自定义 provider 需要提供 baseURL");
			}
			return new CustomProvider(apiKey, selectedModel, baseURL);
		default:
			throw new Error(`未实现的 provider: ${provider}`);
	}
}

/**
 * Anthropic Provider
 */
class AnthropicProvider implements AIProvider {
	private client: Anthropic;
	name: string;
	model: string;

	constructor(apiKey: string, model: string) {
		this.client = new Anthropic({ apiKey });
		this.model = model;
		this.name = "Anthropic";
	}

	async analyze(prompt: string): Promise<string> {
		const message = await this.client.messages.create({
			model: this.model,
			max_tokens: 4000,
			messages: [{ role: "user", content: prompt }],
		});

		const content = message.content[0];
		if (content.type !== "text") {
			throw new Error("Unexpected response type");
		}
		return content.text;
	}
}

/**
 * OpenAI Provider
 */
class OpenAIProvider implements AIProvider {
	private client: OpenAI;
	name: string;
	model: string;

	constructor(apiKey: string, model: string) {
		this.client = new OpenAI({ apiKey });
		this.model = model;
		this.name = "OpenAI";
	}

	async analyze(prompt: string): Promise<string> {
		const completion = await this.client.chat.completions.create({
			model: this.model,
			messages: [{ role: "user", content: prompt }],
			max_tokens: 4000,
		});

		return completion.choices[0].message.content || "";
	}
}

/**
 * Google Provider
 */
class GoogleProvider implements AIProvider {
	private client: GoogleGenerativeAI;
	name: string;
	model: string;

	constructor(apiKey: string, model: string) {
		this.client = new GoogleGenerativeAI(apiKey);
		this.model = model;
		this.name = "Google";
	}

	async analyze(prompt: string): Promise<string> {
		const model = this.client.getGenerativeModel({ model: this.model });
		const result = await model.generateContent(prompt);
		return result.response.text();
	}
}

/**
 * Cohere Provider
 */
class CohereProvider implements AIProvider {
	private client: CohereClient;
	name: string;
	model: string;

	constructor(apiKey: string, model: string) {
		this.client = new CohereClient({ token: apiKey });
		this.model = model;
		this.name = "Cohere";
	}

	async analyze(prompt: string): Promise<string> {
		const response = await this.client.chat({
			model: this.model,
			message: prompt,
		});

		return response.text;
	}
}

/**
 * DeepSeek Provider (兼容 OpenAI API)
 */
class DeepSeekProvider implements AIProvider {
	private client: OpenAI;
	name: string;
	model: string;

	constructor(apiKey: string, model: string, baseURL: string) {
		this.client = new OpenAI({ apiKey, baseURL });
		this.model = model;
		this.name = "DeepSeek";
	}

	async analyze(prompt: string): Promise<string> {
		const completion = await this.client.chat.completions.create({
			model: this.model,
			messages: [{ role: "user", content: prompt }],
			max_tokens: 4000,
		});

		return completion.choices[0].message.content || "";
	}
}

/**
 * Custom Provider (兼容 OpenAI API 格式)
 */
class CustomProvider implements AIProvider {
	private client: OpenAI;
	name: string;
	model: string;

	constructor(apiKey: string, model: string, baseURL: string) {
		this.client = new OpenAI({ apiKey, baseURL });
		this.model = model;
		this.name = "Custom";
	}

	async analyze(prompt: string): Promise<string> {
		const completion = await this.client.chat.completions.create({
			model: this.model,
			messages: [{ role: "user", content: prompt }],
			max_tokens: 4000,
		});

		return completion.choices[0].message.content || "";
	}
}

/**
 * Anthropic Proxy Provider (支持自定义 baseURL)
 */
class AnthropicProxyProvider implements AIProvider {
	private client: Anthropic;
	name: string;
	model: string;

	constructor(apiKey: string, model: string, baseURL: string) {
		this.client = new Anthropic({ apiKey, baseURL });
		this.model = model;
		this.name = "Anthropic Proxy";
	}

	async analyze(prompt: string): Promise<string> {
		const message = await this.client.messages.create({
			model: this.model,
			max_tokens: 4000,
			messages: [{ role: "user", content: prompt }],
		});

		const content = message.content[0];
		if (content.type !== "text") {
			throw new Error("Unexpected response type");
		}
		return content.text;
	}
}

/**
 * OpenAI Proxy Provider (兼容 OpenAI API 格式的代理)
 */
class OpenAIProxyProvider implements AIProvider {
	private client: OpenAI;
	name: string;
	model: string;

	constructor(apiKey: string, model: string, baseURL: string) {
		this.client = new OpenAI({ apiKey, baseURL });
		this.model = model;
		this.name = "OpenAI Proxy";
	}

	async analyze(prompt: string): Promise<string> {
		const completion = await this.client.chat.completions.create({
			model: this.model,
			messages: [{ role: "user", content: prompt }],
			max_tokens: 4000,
		});

		return completion.choices[0].message.content || "";
	}
}

/**
 * Google Proxy Provider (支持自定义 baseURL 的 Google AI)
 */
class GoogleProxyProvider implements AIProvider {
	private client: OpenAI;
	name: string;
	model: string;

	constructor(apiKey: string, model: string, baseURL: string) {
		// Google AI 代理使用 OpenAI 兼容格式
		this.client = new OpenAI({ apiKey, baseURL });
		this.model = model;
		this.name = "Google Proxy";
	}

	async analyze(prompt: string): Promise<string> {
		const completion = await this.client.chat.completions.create({
			model: this.model,
			messages: [{ role: "user", content: prompt }],
			max_tokens: 4000,
		});

		return completion.choices[0].message.content || "";
	}
}

/**
 * 列出所有环境变量 providers
 */
export function listProviders() {
	return Object.entries(ENV_PROVIDERS).map(([key, config]) => ({
		key,
		name: config.name,
		models: config.models,
		defaultModel: config.defaultModel,
	}));
}

/**
 * 列出所有内置 providers
 */
export function listBuiltinProviders() {
	return Object.entries(BUILTIN_PROVIDERS).map(([key, config]) => ({
		key,
		name: config.name,
		api: config.api,
		models: config.models,
		defaultModel: config.defaultModel,
	}));
}

/**
 * 获取 provider 配置
 */
export function getProviderConfig(provider: string) {
	return ENV_PROVIDERS[provider];
}

/**
 * 获取内置 provider 配置
 */
export function getBuiltinProviderConfig(provider: string) {
	return BUILTIN_PROVIDERS[provider];
}

/**
 * 交互式选择 Provider 和 Model
 */
export async function selectProviderInteractive(): Promise<{
	providerKey: string;
	modelId: string;
	provider: AIProvider;
}> {
	const readline = await import("node:readline");
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const question = (q: string): Promise<string> =>
		new Promise((resolve) => rl.question(q, resolve));

	console.log("\n📦 可用的内置 Provider:\n");
	const providers = Object.entries(BUILTIN_PROVIDERS);
	providers.forEach(([key, config], index) => {
		console.log(`  ${index + 1}. ${config.name} (${key})`);
	});

	const providerIndex =
		parseInt(await question("\n请选择 Provider (输入数字): "), 10) - 1;
	if (providerIndex < 0 || providerIndex >= providers.length) {
		rl.close();
		throw new Error("无效的选择");
	}

	const [providerKey, providerConfig] = providers[providerIndex];

	console.log(`\n🤖 ${providerConfig.name} 可用的模型:\n`);
	providerConfig.models.forEach((model, index) => {
		console.log(
			`  ${index + 1}. ${model.name} (${model.id}) - $${model.cost.input}/$${model.cost.output} per 1M tokens`,
		);
	});

	const modelIndex = parseInt(await question("\n请选择模型 (输入数字): "), 10) - 1;
	if (modelIndex < 0 || modelIndex >= providerConfig.models.length) {
		rl.close();
		throw new Error("无效的选择");
	}

	const selectedModel = providerConfig.models[modelIndex];
	rl.close();

	console.log(`\n✅ 已选择: ${providerConfig.name} - ${selectedModel.name}\n`);

	return {
		providerKey,
		modelId: selectedModel.id,
		provider: createBuiltinProvider(providerKey, selectedModel.id),
	};
}
