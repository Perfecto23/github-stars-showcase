import { listBuiltinProviders, listProviders } from "./ai-providers.js";

console.log("═══════════════════════════════════════════════════════════════");
console.log("                    📦 内置 AI Providers                        ");
console.log(
	"              (无需配置 API Key，直接可用)                       ",
);
console.log(
	"═══════════════════════════════════════════════════════════════\n",
);

listBuiltinProviders().forEach((provider) => {
	console.log(`🚀 ${provider.name} (${provider.key})`);
	console.log(`   API 类型: ${provider.api}`);
	console.log(`   默认模型: ${provider.defaultModel}`);
	console.log("   可用模型:");
	provider.models.forEach((model) => {
		console.log(`     - ${model.name} (${model.id})`);
		console.log(
			`       成本: $${model.cost.input} input / $${model.cost.output} output per 1M tokens`,
		);
	});
	console.log("");
});

console.log("═══════════════════════════════════════════════════════════════");
console.log(
	"                  🔧 环境变量 AI Providers                       ",
);
console.log("                 (需要配置 API Key)                             ");
console.log(
	"═══════════════════════════════════════════════════════════════\n",
);

listProviders().forEach((provider) => {
	console.log(`📦 ${provider.name} (${provider.key})`);
	console.log(`   默认模型: ${provider.defaultModel}`);
	if (provider.models.length > 0) {
		console.log(`   可用模型: ${provider.models.join(", ")}`);
	}
	console.log("");
});

console.log("═══════════════════════════════════════════════════════════════");
console.log(
	"                        📖 使用方法                              ",
);
console.log(
	"═══════════════════════════════════════════════════════════════\n",
);

console.log("方式 1: 使用内置 Provider（推荐）");
console.log("  在 .env.local 中设置:");
console.log("    AI_PROVIDER=cch-claude");
console.log("    AI_MODEL=claude-sonnet-4-5-20250929  # 可选");
console.log("");
console.log("方式 2: 交互式选择");
console.log("  运行: npx tsx scripts/analyze-repos.ts --select");
console.log("");
console.log("方式 3: 使用自己的 API Key");
console.log("  在 .env.local 中设置:");
console.log("    AI_PROVIDER=openai");
console.log("    AI_API_KEY=sk-...");
console.log("    AI_MODEL=gpt-4o-mini  # 可选");
console.log("");
