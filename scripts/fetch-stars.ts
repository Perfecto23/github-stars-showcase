import { execSync } from "node:child_process";
import fs from "node:fs";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// 获取 GitHub Token: 优先使用环境变量，否则从 gh CLI 获取
function getGitHubToken(): string {
	if (process.env.GITHUB_TOKEN) {
		return process.env.GITHUB_TOKEN;
	}

	try {
		const token = execSync("gh auth token", { encoding: "utf-8" }).trim();
		if (token) {
			console.log("使用 gh CLI 认证");
			return token;
		}
	} catch {
		// gh CLI 未安装或未登录
	}

	throw new Error("未找到 GITHUB_TOKEN，请设置环境变量或运行 gh auth login");
}

interface StarredRepo {
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

const octokit = new Octokit({ auth: getGitHubToken() });

async function fetchStarredRepos(): Promise<StarredRepo[]> {
	const repos: StarredRepo[] = [];
	let page = 1;

	console.log("开始获取 starred 仓库...");

	while (true) {
		try {
			const { data } =
				await octokit.rest.activity.listReposStarredByAuthenticatedUser({
					per_page: 100,
					page,
				});

			if (data.length === 0) break;

			console.log(`获取第 ${page} 页，共 ${data.length} 个仓库`);

			for (const repo of data) {
				// 获取 README 前 500 字符（Token 优化）
				let readmePreview = "";
				try {
					const { data: readme } = await octokit.rest.repos.getReadme({
						owner: repo.owner.login,
						repo: repo.name,
					});
					const content = Buffer.from(readme.content, "base64").toString(
						"utf-8",
					);
					readmePreview = content.slice(0, 500);
				} catch {
					// README 不存在，跳过
				}

				repos.push({
					id: repo.id,
					name: repo.name,
					fullName: repo.full_name,
					description: repo.description || "",
					url: repo.html_url,
					stars: repo.stargazers_count,
					language: repo.language || "Unknown",
					topics: repo.topics || [],
					readmePreview,
					updatedAt: repo.updated_at || "",
				});
			}

			page++;
		} catch (error) {
			console.error(`获取第 ${page} 页失败:`, (error as Error).message);
			break;
		}
	}

	return repos;
}

// 执行并保存
const repos = await fetchStarredRepos();

// 确保 data 目录存在
if (!fs.existsSync("data")) {
	fs.mkdirSync("data", { recursive: true });
}

fs.writeFileSync("data/stars-raw.json", JSON.stringify(repos, null, 2));
console.log(`✅ 获取完成，共 ${repos.length} 个仓库`);
console.log(`数据已保存到 data/stars-raw.json`);
