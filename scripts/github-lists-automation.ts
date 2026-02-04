/**
 * GitHub Stars Lists 自动化脚本
 * 使用 Playwright 批量创建 Lists 并分类仓库
 */

import fs from "node:fs";
import { chromium, type Page } from "playwright";

// 所有可能的分类（用于参考，实际使用 analyzed.json 中的分类）
const _CATEGORIES = [
	"AI Agent 智能体",
	"DevTools 开发者工具",
	"Learning 学习资源",
	"Awesome List 资源列表",
	"CLI 命令行",
	"UI Components 组件",
	"LLM 大模型",
	"Frontend 前端",
	"Desktop 桌面端",
	"Build 构建工具",
	"Backend 后端",
	"Full-Stack 全栈",
	"Scraping 爬虫",
	"Editor 编辑器",
	"CMS 内容管理",
	"Testing 测试",
	"System 系统工具",
	"Database 数据库",
	"Web3 区块链",
	"Mobile 移动端",
	"DevOps 运维",
	"Data Processing 数据处理",
	"Computer Vision 视觉",
	"Algorithm 算法",
	"Visualization 可视化",
	"Security 安全",
	"Network 网络",
	"NLP 自然语言",
];

interface Repo {
	fullName: string;
	categories: string[];
}

interface RepoData {
	repos: Repo[];
}

// 进度记录
interface Progress {
	createdLists: string[];
	categorizedRepos: { [category: string]: string[] };
}

const PROGRESS_FILE = "data/github-lists-progress.json";

function loadProgress(): Progress {
	try {
		if (fs.existsSync(PROGRESS_FILE)) {
			return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
		}
	} catch {
		console.log("无法加载进度文件，从头开始");
	}
	return { createdLists: [], categorizedRepos: {} };
}

function saveProgress(progress: Progress) {
	fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function createList(page: Page, listName: string): Promise<boolean> {
	try {
		console.log(`🔄 正在创建 List: ${listName}`);

		// Step 1: 点击第一个仓库的 "Add this repository to a list" 按钮
		const addToListBtn = page
			.getByRole("button", {
				name: "Add this repository to a list",
			})
			.first();

		await addToListBtn.waitFor({ state: "visible", timeout: 10000 });
		console.log(`  → 找到 "Add to list" 按钮`);
		await addToListBtn.click();
		await page.waitForTimeout(1500); // 增加等待时间让菜单加载

		// Step 2: 点击 "Create list" 按钮
		const createListBtn = page.getByRole("button", { name: "Create list" });

		try {
			await createListBtn.waitFor({ state: "visible", timeout: 5000 });
			console.log(`  → 找到 "Create list" 按钮`);
		} catch {
			await page.keyboard.press("Escape");
			console.log(`⚠️ ${listName}: Create list 按钮未找到`);
			return false;
		}

		await createListBtn.click();
		await page.waitForTimeout(1000); // 等待表单出现

		// Step 3: 填写 List 名称
		// 使用更精确的选择器：查找 placeholder 包含 "Name this list" 的输入框
		const nameInput = page.locator('input[placeholder*="Name this list"]');
		try {
			await nameInput.waitFor({ state: "visible", timeout: 5000 });
			console.log(`  → 找到名称输入框`);
		} catch {
			console.log(`⚠️ ${listName}: 名称输入框未找到`);
			await page.keyboard.press("Escape");
			return false;
		}

		await nameInput.fill(listName);
		await page.waitForTimeout(500);

		// Step 4: 点击 Create 按钮
		try {
			// 等待按钮变为可点击（不再 disabled）
			await page.waitForFunction(
				() => {
					const btns = document.querySelectorAll("button");
					for (const btn of btns) {
						if (btn.textContent?.trim() === "Create" && !btn.disabled) {
							return true;
						}
					}
					return false;
				},
				{ timeout: 5000 },
			);
			console.log(`  → Create 按钮已可用`);
		} catch {
			console.log(`⚠️ ${listName}: Create 按钮未变为可用状态`);
		}

		// 使用 JavaScript 点击以确保成功
		await page.evaluate(() => {
			const btns = document.querySelectorAll("button");
			for (const btn of btns) {
				if (btn.textContent?.trim() === "Create" && !btn.disabled) {
					(btn as HTMLButtonElement).click();
					return;
				}
			}
		});

		console.log(`  → 点击 Create 按钮`);
		await page.waitForTimeout(2000); // 等待创建完成

		// 验证创建成功：检查是否出现在菜单中
		console.log(`✅ 创建 List 完成: ${listName}`);
		return true;
	} catch (error) {
		console.error(`❌ 创建 List 失败: ${listName}`, (error as Error).message);
		try {
			await page.keyboard.press("Escape");
			await page.waitForTimeout(500);
		} catch {}
		return false;
	}
}

async function addRepoToList(
	page: Page,
	repoFullName: string,
	listName: string,
): Promise<boolean> {
	try {
		// 使用 URL 参数搜索仓库（只用仓库名，不带 owner）
		const [owner, repoName] = repoFullName.split("/");
		const searchUrl = `https://github.com/stars?q=${encodeURIComponent(repoName)}`;
		await page.goto(searchUrl);
		await page.waitForTimeout(1500); // 等待搜索结果加载

		// 找到仓库链接
		// 页面上显示格式是 "owner / repo"（有空格），所以分别匹配 owner 和 repoName
		const repoLink = page.locator(`a:has-text("${owner}"):has-text("${repoName}")`).first();

		if (!(await repoLink.isVisible({ timeout: 5000 }).catch(() => false))) {
			console.log(`⚠️ 未找到仓库: ${repoFullName}`);
			return false;
		}

		// 点击 "Add to list" 按钮
		const addButton = page
			.getByRole("button", {
				name: "Add this repository to a list",
			})
			.first();
		await addButton.click();
		await page.waitForTimeout(1000);

		// 选择对应的 List
		const listCheckbox = page.getByRole("checkbox", { name: listName });
		try {
			await listCheckbox.waitFor({ state: "visible", timeout: 3000 });
			const isChecked = await listCheckbox.isChecked();
			if (!isChecked) {
				await listCheckbox.click();
				await page.waitForTimeout(500);
				console.log(`✅ ${repoFullName} -> ${listName}`);
			} else {
				console.log(`⏭️ ${repoFullName} 已在 ${listName} 中`);
			}
		} catch {
			console.log(`⚠️ 找不到 List: ${listName}`);
		}

		// 关闭菜单
		await page.keyboard.press("Escape");
		await page.waitForTimeout(300);

		return true;
	} catch (error) {
		console.error(`❌ 添加仓库失败: ${repoFullName}`, (error as Error).message);
		try {
			await page.keyboard.press("Escape");
		} catch {}
		return false;
	}
}

async function main() {
	console.log("🚀 GitHub Stars Lists 增量同步开始");
	console.log("请确保已在浏览器中登录 GitHub");

	// 加载仓库数据
	const repoData: RepoData = JSON.parse(
		fs.readFileSync("public/data/repos.json", "utf-8"),
	);

	// 加载进度
	const progress = loadProgress();

	// 计算已同步的仓库集合
	const allSyncedRepos = new Set(
		Object.values(progress.categorizedRepos).flat(),
	);

	// 按分类分组仓库
	const reposByCategory: { [key: string]: string[] } = {};
	for (const repo of repoData.repos) {
		const category = repo.categories[0];
		if (!reposByCategory[category]) {
			reposByCategory[category] = [];
		}
		reposByCategory[category].push(repo.fullName);
	}

	// 计算需要同步的新仓库
	const newReposByCategory: { [key: string]: string[] } = {};
	let totalNewRepos = 0;
	for (const [category, repos] of Object.entries(reposByCategory)) {
		const newRepos = repos.filter((r) => !allSyncedRepos.has(r));
		if (newRepos.length > 0) {
			newReposByCategory[category] = newRepos;
			totalNewRepos += newRepos.length;
		}
	}

	// 检查是否有新仓库需要同步
	console.log(`📊 统计: 总共 ${repoData.repos.length} 个仓库，已同步 ${allSyncedRepos.size} 个`);

	if (totalNewRepos === 0) {
		console.log("✅ 没有新仓库需要同步，数据已是最新");
		process.exit(0);
	}

	console.log(`🆕 发现 ${totalNewRepos} 个新仓库需要同步`);

	// 检查是否有新分类需要创建
	const existingCategories = new Set(progress.createdLists);
	const newCategories = Object.keys(newReposByCategory).filter(
		(c) => !existingCategories.has(c),
	);

	if (newCategories.length > 0) {
		console.log(`📁 新分类: ${newCategories.join(", ")}`);
	}

	// 启动浏览器（有界面模式，方便调试和手动登录）
	const browser = await chromium.launch({
		headless: false,
		slowMo: 100,
	});

	const context = await browser.newContext({
		viewport: { width: 1280, height: 800 },
	});

	const page = await context.newPage();

	// 打开 GitHub Stars 页面
	await page.goto("https://github.com/stars");
	await page.waitForTimeout(2000);

	// 检查是否需要登录
	if (page.url().includes("login")) {
		console.log("⏳ 请在浏览器中登录 GitHub...");
		console.log("登录后脚本会自动继续（等待最多 2 分钟）");
		// 等待登录完成（URL 不再包含 login）
		await page.waitForURL("**/stars**", { timeout: 120000 });
		console.log("✅ 登录成功！");
		await page.waitForTimeout(2000);
	}

	// Phase 1: 创建新 Lists（只创建需要的）
	if (newCategories.length > 0) {
		console.log("\n📋 Phase 1: 创建新 Lists");
		for (const category of newCategories) {
			const created = await createList(page, category);
			if (created) {
				progress.createdLists.push(category);
				saveProgress(progress);
			}

			await page.waitForTimeout(1000);
			await page.reload();
			await page.waitForTimeout(2000);
		}
		console.log(`✅ Phase 1 完成，新创建 ${newCategories.length} 个 Lists`);
	} else {
		console.log("\n📋 Phase 1: 跳过（所有分类 Lists 已存在）");
	}

	// Phase 2: 只同步新仓库
	console.log("\n📦 Phase 2: 同步新仓库");

	let syncedCount = 0;
	for (const [category, newRepos] of Object.entries(newReposByCategory)) {
		console.log(`\n📂 ${category} (${newRepos.length} 个新仓库)`);

		if (!progress.categorizedRepos[category]) {
			progress.categorizedRepos[category] = [];
		}

		for (const repoFullName of newRepos) {
			const added = await addRepoToList(page, repoFullName, category);
			if (added) {
				progress.categorizedRepos[category].push(repoFullName);
				saveProgress(progress);
				syncedCount++;
			}

			// 每处理 10 个仓库暂停一下
			if (syncedCount % 10 === 0 && syncedCount > 0) {
				console.log("⏸️ 暂停 5 秒...");
				await page.waitForTimeout(5000);
			}
		}
	}

	console.log("\n🎉 增量同步完成！");
	console.log(`   新同步: ${syncedCount} 个仓库`);
	const totalCategorized = Object.values(progress.categorizedRepos).reduce(
		(sum, repos) => sum + repos.length,
		0,
	);
	console.log(`   总计: ${totalCategorized} 个仓库已同步`);

	await browser.close();
}

main().catch(console.error);
