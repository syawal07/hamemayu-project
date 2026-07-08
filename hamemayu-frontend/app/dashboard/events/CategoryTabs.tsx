'use client';

interface CategoryTab {
  key: string;
  label: string;
}

interface CategoryTabsProps {
  selected: string;
  onChange: (key: string) => void;
  categories?: CategoryTab[];
}

const DEFAULT_CATEGORIES: CategoryTab[] = [
  { key: 'all', label: '🌐 Semua' },
  { key: 'culture', label: '🎭 Budaya' },
  { key: 'concert', label: '🎵 Konser' },
  { key: 'sports', label: '⚽ Olahraga' },
  { key: 'exhibition', label: '🖼️ Pameran' },
  { key: 'festival', label: '🎉 Festival' },
  { key: 'social', label: '🤝 Sosial' },
];

export default function CategoryTabs({ 
  selected, 
  onChange, 
  categories = DEFAULT_CATEGORIES 
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => {
        const isActive = selected === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={`
              flex-shrink-0 px-4 py-2 font-mono font-bold text-xs uppercase rounded-xl 
              border transition-all duration-300 whitespace-nowrap
              ${isActive 
                ? 'bg-green-700 dark:bg-yellow-400 text-white dark:text-slate-900 border-transparent shadow-md' 
                : 'bg-white/40 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-white/60 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }
            `}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}