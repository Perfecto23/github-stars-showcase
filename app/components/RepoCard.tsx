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

interface RepoCardProps {
  repo: Repo;
}

// Language colors mapping
const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-500',
  Python: 'bg-green-500',
  Rust: 'bg-orange-600',
  Go: 'bg-cyan-500',
  Java: 'bg-red-500',
  'C++': 'bg-pink-500',
  C: 'bg-slate-500',
  Ruby: 'bg-red-600',
  Swift: 'bg-orange-500',
  Kotlin: 'bg-purple-500',
  PHP: 'bg-indigo-500',
  Shell: 'bg-emerald-600',
  Markdown: 'bg-slate-400',
  HTML: 'bg-orange-600',
  CSS: 'bg-blue-400',
  Vue: 'bg-emerald-500',
  Jupyter: 'bg-orange-500',
};

export default function RepoCard({ repo }: RepoCardProps) {
  const languageColor = languageColors[repo.language] || 'bg-slate-500';

  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group glass-card p-6 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer block"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
          {repo.name}
        </h3>
        <div className="flex items-center gap-1.5 text-amber-400 shrink-0">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-medium">{repo.stars.toLocaleString()}</span>
        </div>
      </div>

      {/* AI Summary */}
      <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
        {repo.aiSummary}
      </p>

      {/* Language & Category */}
      <div className="flex items-center flex-wrap gap-3">
        {repo.language && (
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className={`w-2.5 h-2.5 rounded-full ${languageColor}`}></span>
            {repo.language}
          </span>
        )}
        {repo.categories[0] && (
          <span className="px-2 py-0.5 text-xs rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {repo.categories[0]}
          </span>
        )}
      </div>

      {/* Hover Arrow */}
      <div className="mt-4 flex items-center gap-1 text-sm text-slate-500 group-hover:text-emerald-400 transition-colors">
        <span>查看详情</span>
        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </a>
  );
}
