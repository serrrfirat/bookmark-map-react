import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CustomCursor } from './components/CustomCursor';
import { 
  ArrowLeft, ArrowUpRight, Plus, X, Search
} from 'lucide-react';

interface Bookmark {
  id: string;
  text: string;
  author: string;
  url: string;
  likes: number;
  date: number;
  dateStr: string;
  mediaType: string | null;
  mediaUrl: string | null;
}

interface BookmarkData {
  [category: string]: Bookmark[];
}

type SortOption = 'date' | 'likes';

// Premium easing
const premiumEase = [0.16, 1, 0.3, 1];

// Border radius patterns for organic feel
const borderRadiusPatterns = [
  { borderRadius: '100px 8px 8px 8px' },      // Card A: top-left
  { borderRadius: '8px 100px 8px 40px' },     // Card B: top-right + bottom-left
  { borderRadius: '40px' },                    // Card C: uniform
  { borderRadius: '8px 8px 100px 8px' },      // Card D: bottom-right
  { borderRadius: '8px 40px 8px 100px' },     // Card E: variation
];

// Letter animation variants
const letterVariants = {
  hidden: { y: '100%' },
  visible: (i: number) => ({
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 1,
      ease: premiumEase,
    },
  }),
};

// Animated text component
function AnimatedText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`inline-flex overflow-hidden ${className}`}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={letterVariants}
          initial="hidden"
          animate="visible"
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

// Marquee component with asymmetric cards
function Marquee({ items, onClick }: { items: { id: string; img: string; title: string; categoryId?: string }[]; onClick?: (id: string) => void }) {
  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden py-16 group">
      <motion.div
        className="flex gap-8"
        animate={{ x: [0, -50 * items.length + '%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 40,
            ease: 'linear',
          },
        }}
        style={{ width: `${doubled.length * 300}px` }}
      >
        {doubled.map((item, index) => {
          const pattern = borderRadiusPatterns[index % borderRadiusPatterns.length];
          return (
            <div
              key={`${item.id}-${index}`}
              className="flex-shrink-0 w-[260px] cursor-none"
              data-cursor-hover
              onClick={() => onClick?.(item.categoryId || '')}
            >
              <div 
                className="aspect-[5/7] overflow-hidden relative"
                style={pattern}
              >
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
                />
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

function App() {
  const [data, setData] = useState<BookmarkData>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, []);

  const categories = Object.entries(data)
    .filter(([_, items]) => items.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  const selectedBookmarks = selectedCategory ? data[selectedCategory] || [] : [];

  // Get items with images for marquee
  const marqueeItems = useMemo(() => {
    return categories.flatMap(([cat, items]) => 
      items.filter(b => b.mediaUrl).slice(0, 3).map(b => ({
        id: b.id,
        img: b.mediaUrl!,
        title: b.text.slice(0, 40),
        categoryId: cat,
      }))
    ).slice(0, 15);
  }, [categories]);

  // Filter and sort bookmarks
  const sortedBookmarks = useMemo(() => {
    let filtered = [...selectedBookmarks];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.text?.toLowerCase().includes(q) || 
        b.author?.toLowerCase().includes(q)
      );
    }
    
    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'likes') return b.likes - a.likes;
      return b.date - a.date;
    });
  }, [selectedBookmarks, sortBy, searchQuery]);

  // Global search across all categories
  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();
    return Object.entries(data).flatMap(([category, bookmarks]) =>
      bookmarks
        .filter(b => b.text?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q))
        .map(b => ({ ...b, category }))
    ).slice(0, 20);
  }, [data, globalSearch]);

  const totalBookmarks = Object.values(data).reduce((acc, arr) => acc + arr.length, 0);

  // Category Detail View
  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-white text-black">
        <CustomCursor />
        
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-black/5">
          <div className="flex items-center justify-between p-6">
            <button 
              onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
              className="flex items-center gap-2 text-black text-sm tracking-tight transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-50"
              data-cursor-hover
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            {/* Search & Sort Controls */}
            <div className="flex items-center gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-black/5 border-0 rounded-full w-48 focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-black/30"
                />
              </div>
              
              {/* Sort */}
              <div className="flex items-center gap-4 text-black">
                <button
                  onClick={() => setSortBy('date')}
                  className={`text-[11px] uppercase tracking-[0.15em] font-mono transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${sortBy === 'date' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                  data-cursor-hover
                >
                  Recent
                </button>
                <button
                  onClick={() => setSortBy('likes')}
                  className={`text-[11px] uppercase tracking-[0.15em] font-mono transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${sortBy === 'likes' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                  data-cursor-hover
                >
                  Popular
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="min-h-[40vh] flex flex-col justify-end px-6 pb-12 pt-24">
          <h1 className="text-[10vw] md:text-[7vw] font-bold tracking-[-0.05em] leading-[0.85]">
            <AnimatedText text={selectedCategory} />
          </h1>
          <p className="text-[#525252] text-base mt-6 tracking-[-0.01em] font-mono text-[11px] uppercase tracking-[0.15em]">
            {selectedBookmarks.length} Bookmarks
          </p>
        </section>

        {/* Divider */}
        <div className="mx-6 border-t border-black/10" />

        {/* Grid */}
        <section className="px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {sortedBookmarks.map((bookmark, index) => {
              const pattern = borderRadiusPatterns[index % borderRadiusPatterns.length];
              
              return (
                <motion.a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.8, ease: premiumEase }}
                  className="group block"
                  data-cursor-hover
                >
                  {/* Image */}
                  <div 
                    className="aspect-[4/3] overflow-hidden relative bg-[#f5f5f5]"
                    style={pattern}
                  >
                    {bookmark.mediaUrl ? (
                      <img
                        src={bookmark.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                    ) : bookmark.text?.startsWith('https://') || bookmark.text?.length < 50 ? (
                      /* Article/Link card - author-focused */
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black text-white">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                          <span className="text-2xl font-bold">{bookmark.author?.charAt(0).toUpperCase()}</span>
                        </div>
                        <p className="text-lg font-medium">@{bookmark.author}</p>
                        <p className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/50 mt-2">Article</p>
                        <p className="text-xs text-white/40 mt-4 flex items-center gap-2">
                          <span>❤️ {bookmark.likes?.toLocaleString()}</span>
                          <span>🔁 {(bookmark as any).retweets?.toLocaleString() || 0}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-8 bg-black text-white">
                        <p className="text-sm leading-relaxed line-clamp-4 text-center">{bookmark.text}</p>
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                    
                    {/* Arrow icon */}
                    <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] translate-y-2 group-hover:translate-y-0">
                      <ArrowUpRight className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  
                  {/* Metadata */}
                  <div className="mt-5 pt-5 border-t border-black/10 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-medium tracking-[-0.02em] leading-snug line-clamp-2">
                        {bookmark.text.slice(0, 80)}
                      </h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] uppercase tracking-[0.15em] font-mono text-[#525252]">
                        @{bookmark.author}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.15em] font-mono text-[#999] mt-1">
                        {bookmark.dateStr}
                      </p>
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0A0A0A] text-white py-16 px-6">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.15em] font-mono opacity-40">
            <span>Firat's X Bookmarks</span>
            <span>© 2026</span>
          </div>
        </footer>
      </div>
    );
  }

  // Home View
  return (
    <div className="min-h-screen bg-white text-black">
      <CustomCursor />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 mix-blend-difference">
        <div className="flex items-center justify-between p-6">
          <a 
            href="/" 
            className="text-xl font-bold tracking-[-0.05em] text-white lowercase transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-50" 
            data-cursor-hover
          >
            fb
          </a>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:rotate-90"
              data-cursor-hover
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Global Search Bar */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
          <input
            type="text"
            placeholder="Search all bookmarks..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-black/10 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-black/20 placeholder:text-black/40"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {globalSearchResults.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto"
          >
            {globalSearchResults.map((result) => (
              <a
                key={result.id}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 hover:bg-black/5 transition-colors border-b border-black/5 last:border-0"
                data-cursor-hover
              >
                <p className="text-sm line-clamp-2">{result.text}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-[0.1em] font-mono text-black/40">
                  <span>@{result.author}</span>
                  <span>{result.category}</span>
                  <span>❤️ {result.likes}</span>
                </div>
              </a>
            ))}
          </motion.div>
        )}
      </div>

      {/* Menu Overlay */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: premiumEase }}
          className="fixed inset-0 z-30 bg-black text-white flex items-center justify-center"
        >
          <div className="text-center px-6">
            <p className="text-[11px] uppercase tracking-[0.15em] font-mono mb-12 opacity-40">Select Category</p>
            <div className="space-y-3">
              {categories.map(([cat, items], i) => (
                <motion.button
                  key={cat}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.6, ease: premiumEase }}
                  onClick={() => { setSelectedCategory(cat); setMenuOpen(false); }}
                  className="block w-full text-3xl md:text-5xl font-bold tracking-[-0.04em] transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-40"
                  data-cursor-hover
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center">
        <motion.h1 
          className="text-[14vw] md:text-[11vw] font-bold tracking-[-0.06em] leading-[0.85]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatedText text="Firat's" />
          <br />
          <span className="text-[#525252]">
            <AnimatedText text="Bookmarks" />
          </span>
        </motion.h1>
        
        <motion.p 
          className="text-[11px] uppercase tracking-[0.15em] font-mono text-[#525252] mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8, ease: premiumEase }}
        >
          {totalBookmarks} Curated · {categories.length} Categories
        </motion.p>
      </section>

      {/* Marquee */}
      {!loading && marqueeItems.length > 0 && (
        <section className="border-y border-black/10">
          <Marquee 
            items={marqueeItems}
            onClick={(catId) => catId && setSelectedCategory(catId)}
          />
        </section>
      )}

      {/* Categories Grid */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.15em] font-mono text-[#525252] mb-16">
            Browse Collection
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {categories.map(([category, items], index) => {
              const firstImage = items.find(b => b.mediaUrl)?.mediaUrl;
              const pattern = borderRadiusPatterns[index % borderRadiusPatterns.length];
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.8, ease: premiumEase }}
                  onClick={() => setSelectedCategory(category)}
                  className="group cursor-none"
                  data-cursor-hover
                >
                  {/* Image */}
                  <div 
                    className="aspect-[4/3] overflow-hidden relative bg-[#f5f5f5]"
                    style={pattern}
                  >
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={category}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <span className="text-white text-6xl font-bold tracking-[-0.05em]">{category.charAt(0)}</span>
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                    
                    {/* Arrow */}
                    <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] translate-y-2 group-hover:translate-y-0">
                      <ArrowUpRight className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="mt-5 pt-5 border-t border-black/10 flex items-center justify-between">
                    <h3 className="text-xl font-medium tracking-[-0.03em]">{category}</h3>
                    <span className="text-[11px] uppercase tracking-[0.15em] font-mono text-[#999]">
                      {items.length}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] text-white py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="md:col-span-2">
            <h2 className="text-4xl font-bold tracking-[-0.04em] mb-6">Firat's Bookmarks</h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              A curated archive of inspiration from X, automatically refreshed daily.
            </p>
          </div>
          
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40 mb-6">Connect</p>
            <ul className="space-y-3 text-sm">
              <li><a href="https://x.com/serrrfirat" target="_blank" className="transition-opacity duration-500 hover:opacity-50" data-cursor-hover>X / Twitter</a></li>
              <li><a href="https://github.com/serrrfirat" target="_blank" className="transition-opacity duration-500 hover:opacity-50" data-cursor-hover>GitHub</a></li>
            </ul>
          </div>
          
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40 mb-6">Details</p>
            <ul className="space-y-3 text-sm text-white/60">
              <li>Auto-synced daily</li>
              <li>{totalBookmarks} bookmarks</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/10 flex items-center justify-between text-[11px] uppercase tracking-[0.15em] font-mono text-white/30">
          <span>© 2026</span>
          <span>Built with Clawdbot</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
