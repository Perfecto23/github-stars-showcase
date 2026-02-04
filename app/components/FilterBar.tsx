interface FilterBarProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export default function FilterBar({
  categories,
  selectedCategories,
  onCategoryChange,
}: FilterBarProps) {
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      onCategoryChange(selectedCategories.filter((c) => c !== cat));
    } else {
      onCategoryChange([...selectedCategories, cat]);
    }
  };

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">分类筛选</h3>
        {selectedCategories.length > 0 && (
          <span className="ml-auto text-xs text-emerald-400">{selectedCategories.length} 已选</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isSelected = selectedCategories.includes(cat);
          return (
            <button
              type="button"
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`tag cursor-pointer ${
                isSelected ? 'tag-category-active' : 'tag-category'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
