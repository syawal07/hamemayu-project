import { Category } from '../types';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (categorySlug: string) => void;
}

export default function CategoryTabs({ categories, activeCategory, onSelect }: CategoryTabsProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide pb-4 -mb-4">
      <div className="flex items-center gap-3 w-max px-1 pb-1">
        <button
          onClick={() => onSelect('all')}
          className={`px-6 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
            activeCategory === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-lg scale-100 border border-transparent'
              : 'bg-white/60 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-white/40 dark:border-white/10 hover:border-slate-400 backdrop-blur-xl scale-95'
          }`}
        >
          Semua Agenda
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.slug)}
            className={`px-6 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
              activeCategory === category.slug
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-lg scale-100 border border-transparent'
                : 'bg-white/60 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-white/40 dark:border-white/10 hover:border-slate-400 backdrop-blur-xl scale-95'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}