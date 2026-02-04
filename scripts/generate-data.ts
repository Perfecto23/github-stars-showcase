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

const finalData: FinalRepo[] = rawRepos.map((repo) => {
  const analysis = analyzed.find((a) => a.fullName === repo.fullName);
  return {
    ...repo,
    categories: analysis?.categories || [],
    tags: analysis?.tags || [],
    aiSummary: analysis?.aiSummary || repo.description,
  };
});

// 按 stars 数量排序
finalData.sort((a, b) => b.stars - a.stars);

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
