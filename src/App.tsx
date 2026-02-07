import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, X, Search, ChevronDown, Menu, Sun, Moon } from 'lucide-react';

interface Bookmark {
  id: string;
  text: string;
  fullText?: string;
  author: string;
  authorName?: string;
  url: string;
  likes: number;
  date: number;
  dateStr: string;
  mediaType: string | null;
  mediaUrl: string | null;
  category?: string;
}

interface BookmarkData {
  [category: string]: Bookmark[];
}

type SortOption = 'date' | 'likes';

// Editorial easing
const editorialEase = [0.16, 1, 0.3, 1];

// Clean, minimal theme
const theme = {
  bg: '#fafafa',
  fg: '#111111',
  muted: '#888888',
  mutedAlt: '#cccccc',
  accent: '#ff3333',
};

function App() {
  const [data, setData] = useState<BookmarkData>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllBookmarks, setShowAllBookmarks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  
  const colors = darkMode 
    ? { bg: '#0a0a0a', fg: '#fafafa', muted: '#666666', mutedAlt: '#333333' }
    : theme;

  // Load data
  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = Object.entries(data)
    .filter(([_, items]) => items.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  const totalBookmarks = Object.values(data).reduce((acc, arr) => acc + arr.length, 0);

  const selectedBookmarks = selectedCategory ? data[selectedCategory] || [] : [];

  const allBookmarks = useMemo(() => {
    return Object.entries(data).flatMap(([category, bookmarks]) =>
      bookmarks.map(b => ({ ...b, category }))
    );
  }, [data]);

  const currentBookmarks = showAllBookmarks ? allBookmarks : selectedBookmarks;

  const sortedBookmarks = useMemo(() => {
    let filtered = [...currentBookmarks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.text?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'likes') return b.likes - a.likes;
      return b.date - a.date;
    });
  }, [currentBookmarks, sortBy, searchQuery]);

  // Category View
  if (selectedCategory || showAllBookmarks) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.fg }}>
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex items-center justify-between" 
          style={{ backgroundColor: `${colors.bg}ee` }}>
          <button
            onClick={() => { setSelectedCategory(null); setShowAllBookmarks(false); setSearchQuery(''); }}
            className="flex items-center gap-2 text-sm hover:opacity-50 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.muted }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-transparent border text-sm focus:outline-none"
                style={{ borderColor: colors.mutedAlt, borderRadius: 0 }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('date')}
                className={`text-xs uppercase tracking-wider px-3 py-2 ${sortBy === 'date' ? '' : 'opacity-40'}`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('likes')}
                className={`text-xs uppercase tracking-wider px-3 py-2 ${sortBy === 'likes' ? '' : 'opacity-40'}`}
              >
                Popular
              </button>
            </div>
          </div>
        </header>

        {/* Title */}
        <section className="pt-32 pb-12 px-6 text-center">
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: colors.muted }}>
            {sortedBookmarks.length} bookmarks
          </p>
          <h1 className="text-5xl font-light font-serif tracking-tight uppercase">
            {showAllBookmarks ? 'All Bookmarks' : selectedCategory}
          </h1>
        </section>

        {/* Grid */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBookmarks.map((bookmark, i) => (
              <motion.a
                key={bookmark.id}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.4 }}
                className="group block"
              >
                <div className="border p-4 h-full transition-all duration-300 hover:bg-gray-50" style={{ borderColor: colors.mutedAlt, borderRadius: 0 }}>
                  {/* Media */}
                  {bookmark.mediaUrl && (
                    <div className="mb-4 aspect-[4/3] overflow-hidden" style={{ borderColor: colors.mutedAlt }}>
                      <img
                        src={bookmark.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs mb-3" style={{ color: colors.muted }}>
                    <span>{bookmark.dateStr}</span>
                    <span>@{bookmark.author}</span>
                  </div>

                  {/* Text */}
                  <p className="text-sm leading-relaxed line-clamp-3 mb-4">
                    {bookmark.text}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: colors.muted }}>
                      {bookmark.likes.toLocaleString()} likes
                    </span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 border-t text-center" style={{ borderColor: colors.mutedAlt }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: colors.muted }}>
            © 2026 Firat's Bookmarks
          </p>
        </footer>
      </div>
    );
  }

  // Home View
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.fg }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex items-center justify-between"
        style={{ backgroundColor: `${colors.bg}ee` }}>
        <span className="text-sm font-medium uppercase tracking-wider">Firat's Bookmarks</span>
        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center gap-2 text-sm uppercase tracking-wider hover:opacity-50 transition-opacity"
        >
          <Menu className="w-4 h-4" />
          Menu
        </button>
      </header>

      {/* Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: colors.bg }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-6 right-6 p-2 hover:opacity-50 transition-opacity"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center space-y-6">
              {categories.map(([cat, items], i) => (
                <motion.button
                  key={cat}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { setSelectedCategory(cat); setMenuOpen(false); }}
                  className="block text-4xl font-light font-serif uppercase hover:opacity-40 transition-opacity"
                >
                  {cat} <span className="text-lg opacity-40">({items.length})</span>
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categories.length * 0.05 }}
                onClick={() => { setShowAllBookmarks(true); setMenuOpen(false); }}
                className="block text-4xl font-light font-serif uppercase pt-8 border-t mt-8 hover:opacity-40 transition-opacity"
                style={{ borderColor: colors.mutedAlt }}
              >
                All Bookmarks
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <p className="text-xs uppercase tracking-widest mb-6" style={{ color: colors.muted }}>
          Curated Collection
        </p>
        
        <h1 className="text-6xl md:text-8xl font-light font-serif text-center leading-tight">
          Bookmarks
          <span className="block italic opacity-40">Archive</span>
        </h1>

        <p className="text-sm mt-8" style={{ color: colors.muted }}>
          {totalBookmarks} items · {categories.length} categories
        </p>

        <motion.button
          onClick={() => setShowAllBookmarks(true)}
          className="mt-12 px-8 py-4 text-xs uppercase tracking-widest border transition-all hover:bg-gray-100"
          style={{ borderColor: colors.fg, borderRadius: 0 }}
          whileHover={{ scale: 1.02 }}
        >
          View All
        </motion.button>
      </section>

      {/* Categories Preview */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map(([cat, items], i) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedCategory(cat)}
              className="p-6 text-left border hover:bg-gray-50 transition-all group"
              style={{ borderColor: colors.mutedAlt, borderRadius: 0 }}
            >
              <h3 className="text-xl font-serif font-light uppercase mb-2 group-hover:opacity-60 transition-opacity">
                {cat}
              </h3>
              <p className="text-sm" style={{ color: colors.muted }}>
                {items.length} items
              </p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t text-center" style={{ borderColor: colors.mutedAlt }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: colors.muted }}>
          Auto-synced daily from X
        </p>
      </footer>
    </div>
  );
}

export default App;
