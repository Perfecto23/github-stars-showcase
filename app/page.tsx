"use client";

import { useEffect, useState } from "react";
import FilterBar from "./components/FilterBar";
import RepoCard from "./components/RepoCard";
import SearchBar from "./components/SearchBar";

interface Repo {
	id: number;
	name: string;
	fullName: string;
	description: string;
	url: string;
	stars: number;
	language: string;
	categories: string[];
	aiSummary: string;
}

interface Data {
	repos: Repo[];
	categories: string[];
	updatedAt: string;
}

export default function Home() {
	const [data, setData] = useState<Data | null>(null);
	const [filteredRepos, setFilteredRepos] = useState<Repo[]>([]);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		fetch("/data/repos.json")
			.then((res) => res.json())
			.then(setData)
			.catch((error) => console.error("加载数据失败:", error));
	}, []);

	useEffect(() => {
		if (!data) return;

		let filtered = data.repos;

		if (selectedCategories.length > 0) {
			filtered = filtered.filter((repo) =>
				repo.categories.some((cat) => selectedCategories.includes(cat)),
			);
		}

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(repo) =>
					repo.name.toLowerCase().includes(query) ||
					repo.description?.toLowerCase().includes(query) ||
					repo.aiSummary?.toLowerCase().includes(query),
			);
		}

		setFilteredRepos(filtered);
	}, [data, selectedCategories, searchQuery]);

	if (!data) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="relative w-16 h-16 mx-auto mb-6">
						<div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
						<div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
					</div>
					<p className="text-slate-400 text-lg">加载中...</p>
				</div>
			</div>
		);
	}

	return (
		<main className="min-h-screen">
			{/* Header */}
			<header className="sticky top-0 z-50 glass-card border-b border-slate-700/50 backdrop-blur-xl">
				<div className="max-w-7xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl md:text-3xl font-bold">
								<span className="gradient-text">GitHub Stars</span>
								<span className="text-slate-300 ml-2">Showcase</span>
							</h1>
						</div>
						<div className="flex items-center gap-4 text-sm text-slate-400">
							<span className="hidden md:inline-flex items-center gap-2">
								<svg
									className="w-4 h-4 text-emerald-500"
									fill="currentColor"
									viewBox="0 0 20 20"
									aria-hidden="true"
								>
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
								<span className="font-semibold text-white">
									{data.repos.length}
								</span>
								<span>repos</span>
							</span>
							<span className="text-slate-500">|</span>
							<span>
								{new Date(data.updatedAt).toLocaleDateString("zh-CN")}
							</span>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-6 py-8">
				<SearchBar value={searchQuery} onChange={setSearchQuery} />

				<FilterBar
					categories={data.categories}
					selectedCategories={selectedCategories}
					onCategoryChange={setSelectedCategories}
				/>

				{/* Results Count */}
				<div className="flex items-center justify-between mb-6">
					<p className="text-slate-400">
						显示{" "}
						<span className="text-white font-semibold">
							{filteredRepos.length}
						</span>{" "}
						个仓库
					</p>
					{(selectedCategories.length > 0 || searchQuery) && (
						<button
							type="button"
							onClick={() => {
								setSelectedCategories([]);
								setSearchQuery("");
							}}
							className="text-sm text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
						>
							清除筛选
						</button>
					)}
				</div>

				{/* Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
					{filteredRepos.map((repo) => (
						<RepoCard key={repo.id} repo={repo} />
					))}
				</div>

				{/* Empty State */}
				{filteredRepos.length === 0 && (
					<div className="text-center py-20">
						<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
							<svg
								className="w-10 h-10 text-slate-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-slate-300 mb-2">
							没有找到匹配的仓库
						</h3>
						<p className="text-slate-500">尝试调整筛选条件或搜索关键词</p>
					</div>
				)}
			</div>

			{/* Footer */}
			<footer className="border-t border-slate-800 mt-16">
				<div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
					<p>Powered by AI Analysis</p>
				</div>
			</footer>
		</main>
	);
}
