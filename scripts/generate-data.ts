import fs from 'node:fs';

interface RawRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  topics: string[];
  readmePreview: string;
  updatedAt: string;
  starredAt: string;
}

interface AnalyzedRepo {
  fullName: string;
  categories: string[];
  tags: string[];
  aiSummary: string;
}

interface FinalRepo extends RawRepo {
  categories: string[];
  tags: string[];
  aiSummary: string;
}

interface OutputData {
  repos: FinalRepo[];
  categories: string[];
  tags: string[];
  updatedAt: string;
}

console.log('开始生成最终数据...');

// 合并原始数据和分析结果
const rawRepos: RawRepo[] = JSON.parse(fs.readFileSync('data/stars-raw.json', 'utf-8'));
const analyzed: AnalyzedRepo[] = JSON.parse(fs.readFileSync('data/analyzed.json', 'utf-8'));
const analyzedByFullName = new Map(analyzed.map((repo) => [repo.fullName, repo]));
const missingAnalysis = rawRepos.filter((repo) => !analyzedByFullName.has(repo.fullName));

if (missingAnalysis.length > 0 && process.env.ALLOW_INCOMPLETE_DATA !== '1') {
  const sample = missingAnalysis.slice(0, 10).map((repo) => repo.fullName).join(', ');
  throw new Error(
    `缺少 ${missingAnalysis.length} 个仓库的分析结果，先运行 pnpm run analyze。示例: ${sample}`,
  );
}

if (missingAnalysis.length > 0) {
  console.warn(`⚠️ 允许生成不完整数据：${missingAnalysis.length} 个仓库缺少分析结果`);
}

const missingStarredAt = rawRepos.filter((repo) => !repo.starredAt);

if (missingStarredAt.length > 0) {
  const sample = missingStarredAt.slice(0, 10).map((repo) => repo.fullName).join(', ');
  throw new Error(
    `缺少 ${missingStarredAt.length} 个仓库的 star 时间，先运行 pnpm run fetch-stars。示例: ${sample}`,
  );
}

const finalData: FinalRepo[] = rawRepos.map((repo) => {
  const analysis = analyzedByFullName.get(repo.fullName);
  return {
    ...repo,
    categories: analysis?.categories || [],
    tags: analysis?.tags || [],
    aiSummary: analysis?.aiSummary || repo.description,
  };
});

finalData.sort(
  (a, b) =>
    new Date(b.starredAt).getTime() - new Date(a.starredAt).getTime(),
);

// 提取所有分类和标签（用于筛选）
const allCategories = [...new Set(finalData.flatMap((r) => r.categories))];
const allTags = [...new Set(finalData.flatMap((r) => r.tags))];

const output: OutputData = {
  repos: finalData,
  categories: allCategories,
  tags: allTags,
  updatedAt: new Date().toISOString(),
};

// 确保 public/data 目录存在
if (!fs.existsSync('public/data')) {
  fs.mkdirSync('public/data', { recursive: true });
}

fs.writeFileSync('public/data/repos.json', JSON.stringify(output, null, 2));
console.log(`✅ 生成最终数据：${finalData.length} 个仓库`);
console.log(`分类数量：${allCategories.length}`);
console.log(`标签数量：${allTags.length}`);
console.log(`数据已保存到 public/data/repos.json`);
