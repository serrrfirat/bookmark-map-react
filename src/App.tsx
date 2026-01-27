import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowUpRight, X, Search, ChevronDown, Sun, Moon
} from 'lucide-react';

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

// Theme configuration
const themes = {
  light: {
    bg: '#f7f6f2',
    fg: '#1c1c1c',
    primary: '#3d7068',
    border: '#e5e4de',
    muted: 'rgba(28, 28, 28, 0.6)',
    mutedAlt: 'rgba(28, 28, 28, 0.4)',
    overlay: 'rgba(247, 246, 242, 0.95)',
  },
  dark: {
    bg: '#1a1a1a',
    fg: '#f7f6f2',
    primary: '#5a9a8a',
    border: '#333333',
    muted: 'rgba(247, 246, 242, 0.6)',
    mutedAlt: 'rgba(247, 246, 242, 0.4)',
    overlay: 'rgba(26, 26, 26, 0.95)',
  },
};

// Scroll down indicator
function ScrollIndicator({ colors }: { colors: typeof themes.light }) {
  return (
    <motion.div
      className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.8, ease: editorialEase }}
    >
      <span className="text-[10px] font-mono uppercase tracking-[0.3em]" style={{ color: colors.mutedAlt }}>
        Scroll
      </span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: editorialEase }}
      >
        <ChevronDown className="w-5 h-5" style={{ color: colors.mutedAlt }} />
      </motion.div>
    </motion.div>
  );
}

// CTA Button component
function CtaButton({ children, onClick, colors }: { children: React.ReactNode; onClick?: () => void; colors: typeof themes.light }) {
  return (
    <motion.button
      onClick={onClick}
      className="relative overflow-hidden font-mono text-[10px] uppercase tracking-[0.25em] px-8 py-4"
      style={{ backgroundColor: colors.primary, color: '#fff' }}
      initial={false}
      whileHover={{
        letterSpacing: '0.4em',
        transition: { duration: 0.4, ease: editorialEase },
      }}
    >
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ y: '100%' }}
        whileHover={{ y: '0%' }}
        transition={{ duration: 0.4, ease: editorialEase }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

// Theme Toggle Switch
function ThemeToggle({ darkMode, setDarkMode, colors }: { darkMode: boolean; setDarkMode: (v: boolean) => void; colors: typeof themes.light }) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="relative w-12 h-6 rounded-full border transition-all duration-500 ease-editorial"
      style={{ 
        backgroundColor: darkMode ? colors.primary : colors.border,
        borderColor: colors.border
      }}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ backgroundColor: darkMode ? '#1a1a1a' : '#f7f6f2' }}
        animate={{ x: darkMode ? 26 : 0 }}
        transition={{ duration: 0.3, ease: editorialEase }}
      >
        {darkMode ? (
          <Moon className="w-3 h-3" style={{ color: colors.primary }} />
        ) : (
          <Sun className="w-3 h-3" style={{ color: colors.fg }} />
        )}
      </motion.div>
    </button>
  );
}

function App() {
  const [data, setData] = useState<BookmarkData>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllBookmarks, setShowAllBookmarks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const colors = darkMode ? themes.dark : themes.light;

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

  // All bookmarks for "view all" mode
  const allBookmarks = useMemo(() => {
    return Object.entries(data).flatMap(([category, bookmarks]) =>
      bookmarks.map(b => ({ ...b, category }))
    );
  }, [data]);

  // Current bookmarks based on view mode
  const currentBookmarks = showAllBookmarks ? allBookmarks : selectedBookmarks;

  // Filter and sort bookmarks
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

  const totalBookmarks = Object.values(data).reduce((acc, arr) => acc + arr.length, 0);

  // Category/All Bookmarks Detail View
  if (selectedCategory || showAllBookmarks) {
    return (
      <div 
        className="min-h-screen transition-colors duration-700 ease-editorial"
        style={{ backgroundColor: colors.bg, color: colors.fg }}
      >
        {/* Background Grid */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0">
            {[25, 50, 75].map((pos) => (
              <div
                key={pos}
                className="absolute top-0 bottom-0 w-px"
                style={{ left: `${pos}%`, backgroundColor: colors.border }}
              />
            ))}
          </div>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, ${colors.fg} 1px, transparent 1px),
                linear-gradient(to bottom, ${colors.fg} 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              mask: 'radial-gradient(circle at center, black 40%, transparent 100%)',
              WebkitMask: 'radial-gradient(circle at center, black 40%, transparent 100%)',
            }}
          />
        </div>

        {/* Fixed Header */}
        <header 
          className="fixed top-0 left-0 right-0 z-40 pt-8 px-6 backdrop-blur-sm border-b transition-colors duration-700 ease-editorial"
          style={{ backgroundColor: `${colors.bg}cc`, borderColor: colors.border }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowAllBookmarks(false);
                setSearchQuery('');
              }}
              className="flex items-center gap-2 text-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-60"
              style={{ color: colors.fg }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Back</span>
            </button>

            {/* Search & Sort Controls */}
            <div className="flex items-center gap-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.mutedAlt }} />
                <input
                  type="text"
                  placeholder=""
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-sm bg-transparent border-b w-48 focus:outline-none transition-colors duration-700 ease-editorial"
                  style={{ 
                    borderColor: colors.border, 
                    color: colors.fg,
                    '--tw-placeholder-color': colors.mutedAlt,
                  } as React.CSSProperties}
                />
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => setSortBy('date')}
                  className={`text-[10px] uppercase font-mono tracking-[0.3em] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${sortBy === 'date' ? 'opacity-100' : 'opacity-40 hover:opacity-60'}`}
                  style={{ color: colors.fg }}
                >
                  Recent
                </button>
                <button
                  onClick={() => setSortBy('likes')}
                  className={`text-[10px] uppercase font-mono tracking-[0.3em] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${sortBy === 'likes' ? 'opacity-100' : 'opacity-40 hover:opacity-60'}`}
                  style={{ color: colors.fg }}
                >
                  Popular
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="pt-40 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="w-2 h-2 rounded-full animate-pulse mr-3" style={{ backgroundColor: colors.primary }} />
              <span className="text-[10px] uppercase font-mono tracking-[0.3em]" style={{ color: colors.muted }}>
                Collection
              </span>
            </div>

            <h1 className="text-[9vw] font-serif font-light tracking-tight text-center uppercase leading-[0.9]">
              {showAllBookmarks ? (
                <>
                  All
                  <br />
                  <span style={{ color: darkMode ? '#666' : '#b4b4b4' }} className="italic">Bookmarks</span>
                </>
              ) : (
                selectedCategory.split(' ').map((word, i) => (
                  <span key={i} className={i % 2 === 1 ? 'italic' : ''} style={{ color: i % 2 === 1 ? (darkMode ? '#666' : '#b4b4b4') : 'inherit' }}>
                    {word}{' '}
                  </span>
                ))
              )}
            </h1>

            <p className="text-center mt-8 text-[10px] uppercase font-mono tracking-[0.3em]" style={{ color: colors.muted }}>
              {sortedBookmarks.length} Bookmarks
            </p>
          </div>
        </section>

        <div className="border-t mx-6 transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }} />

        {/* Grid */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-r transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
            {sortedBookmarks.map((bookmark, index) => (
              <motion.a
                key={bookmark.id}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.8, ease: editorialEase }}
                className="group relative p-8 border-b transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ borderColor: colors.border }}
              >
                {bookmark.mediaUrl ? (
                  <div className="mb-6 aspect-square overflow-hidden border p-1 transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
                    <img
                      src={bookmark.mediaUrl}
                      alt=""
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    />
                  </div>
                ) : (
                  <div className="mb-6 aspect-[4/3] border p-6 flex items-center justify-center transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border, backgroundColor: darkMode ? '#222' : '#f7f6f2' }}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: colors.mutedAlt }}>
                      Article
                    </span>
                  </div>
                )}

                <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-3" style={{ color: colors.muted }}>
                  {bookmark.dateStr} · @{bookmark.author}
                  {!showAllBookmarks && bookmark.category && <span> · {bookmark.category}</span>}
                </div>

                <p className="text-sm leading-relaxed line-clamp-3">
                  {bookmark.text}
                </p>

                <div className="flex items-center gap-4 mt-4 text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: colors.mutedAlt }}>
                  <span>❤️ {bookmark.likes.toLocaleString()}</span>
                </div>

                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <ArrowUpRight className="w-4 h-4" style={{ color: colors.primary }} />
                </div>
              </motion.a>
            ))}
          </div>
        </section>

        <footer className="py-16 px-6 border-t transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: colors.mutedAlt }}>
              Firat&apos;s X Bookmarks
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: colors.mutedAlt }}>
              © 2026
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // Home View
  return (
    <div 
      className="min-h-screen transition-colors duration-700 ease-editorial"
      style={{ backgroundColor: colors.bg, color: colors.fg }}
    >
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0">
          {[25, 50, 75].map((pos) => (
            <div
              key={pos}
              className="absolute top-0 bottom-0 w-px"
              style={{ left: `${pos}%`, backgroundColor: colors.border }}
            />
          ))}
        </div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${colors.fg} 1px, transparent 1px),
              linear-gradient(to bottom, ${colors.fg} 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            mask: 'radial-gradient(circle at center, black 40%, transparent 100%)',
            WebkitMask: 'radial-gradient(circle at center, black 40%, transparent 100%)',
          }}
        />
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 pt-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-8">
            <a
              href="https://x.com/serrrfirat"
              target="_blank"
              className="text-[10px] font-mono uppercase tracking-[0.3em] transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-60"
              style={{ color: colors.fg }}
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-6">
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} colors={colors} />
            
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:rotate-90"
              style={{ color: colors.fg }}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Menu</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Menu Overlay */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: editorialEase }}
          className="fixed inset-0 z-30 flex items-center justify-center"
          style={{ backgroundColor: colors.overlay }}
        >
          <div className="text-center px-6 max-w-3xl">
            <p className="text-[10px] uppercase font-mono tracking-[0.3em] mb-16" style={{ color: colors.muted }}>
              Select Category
            </p>
            <div className="space-y-4">
              {categories.map(([cat, items], i) => (
                <motion.button
                  key={cat}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.6, ease: editorialEase }}
                  onClick={() => { setSelectedCategory(cat); setMenuOpen(false); }}
                  className="block w-full text-4xl md:text-6xl font-serif font-light tracking-tight uppercase transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-40"
                  style={{ color: colors.fg }}
                >
                  {cat}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categories.length * 0.04, duration: 0.6, ease: editorialEase }}
                onClick={() => { setShowAllBookmarks(true); setMenuOpen(false); }}
                className="block w-full text-4xl md:text-6xl font-serif font-light tracking-tight uppercase transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-40 mt-8 pt-8 border-t"
                style={{ color: colors.fg, borderColor: colors.border }}
              >
                View All Bookmarks
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center pt-32" ref={heroRef}>
        <div className="flex items-center justify-center mb-8">
          <div className="w-2 h-2 rounded-full animate-pulse mr-3" style={{ backgroundColor: colors.primary }} />
          <span className="text-[10px] uppercase font-mono tracking-[0.3em]" style={{ color: colors.muted }}>
            Curated Collection
          </span>
        </div>

        <h1 className="text-[9vw] font-serif font-light tracking-tight uppercase leading-[0.9]">
          Firat&apos;s
          <br />
          <span style={{ color: darkMode ? '#666' : '#b4b4b4' }} className="italic">Bookmarks</span>
        </h1>

        <motion.p
          className="text-[10px] uppercase font-mono tracking-[0.3em] mt-12"
          style={{ color: colors.muted }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8, ease: editorialEase }}
        >
          {totalBookmarks} Curated · {categories.length} Categories
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex items-center gap-6 mt-12 pb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: editorialEase }}
        >
          <CtaButton onClick={() => setMenuOpen(true)} colors={colors}>
            Browse Categories
          </CtaButton>
          <CtaButton onClick={() => setShowAllBookmarks(true)} colors={colors}>
            View All Bookmarks
          </CtaButton>
        </motion.div>

        <ScrollIndicator colors={colors} />
      </section>

      {/* Statistics Grid */}
      <section className="py-20 px-6 border-t transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
        <div className="max-w-7xl mx-auto grid grid-cols-3 divide-x transition-colors duration-700 ease-editorial" style={{ divideColor: colors.border }}>
          <div className="p-10 text-center transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-opacity-50" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <div className="w-12 h-12 border mx-auto mb-4 flex items-center justify-center transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
              <span className="text-xl">🔖</span>
            </div>
            <div className="text-4xl font-serif font-light">{totalBookmarks}</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] mt-2" style={{ color: colors.muted }}>
              Total Bookmarks
            </div>
          </div>
          <div className="p-10 text-center transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-opacity-50" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <div className="w-12 h-12 border mx-auto mb-4 flex items-center justify-center transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
              <span className="text-xl">📂</span>
            </div>
            <div className="text-4xl font-serif font-light">{categories.length}</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] mt-2" style={{ color: colors.muted }}>
              Categories
            </div>
          </div>
          <div className="p-10 text-center transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-opacity-50" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <div className="w-12 h-12 border mx-auto mb-4 flex items-center justify-center transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
              <span className="text-xl">📅</span>
            </div>
            <div className="text-4xl font-serif font-light">Daily</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] mt-2" style={{ color: colors.muted }}>
              Auto-Synced
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 px-6 border-t transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] mb-16" style={{ color: colors.muted }}>
            Browse Collection
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-r transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
            {categories.map(([category, items], index) => {
              const firstImage = items.find(b => b.mediaUrl)?.mediaUrl;

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.8, ease: editorialEase }}
                  onClick={() => setSelectedCategory(category)}
                  className="group relative p-8 border-b cursor-pointer transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ borderColor: colors.border }}
                >
                  {firstImage ? (
                    <div className="mb-6 aspect-square overflow-hidden border p-1 transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
                      <img
                        src={firstImage}
                        alt={category}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                    </div>
                  ) : (
                    <div className="mb-6 aspect-square border flex items-center justify-center transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border, backgroundColor: darkMode ? '#222' : '#f7f6f2' }}>
                      <span className="font-serif text-6xl font-light opacity-30" style={{ color: colors.fg }}>
                        {category.charAt(0)}
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-serif font-light tracking-tight mb-2">
                    {category}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: colors.muted }}>
                      {items.length} items
                    </span>
                  </div>

                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <ArrowUpRight className="w-4 h-4" style={{ color: colors.primary }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="py-24 px-6 border-t transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border, backgroundColor: darkMode ? '#151515' : colors.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
            <div>
              <h2 className="text-4xl font-serif font-light tracking-tight mb-6">
                FIRAT&apos;S BOOKMARKS
              </h2>
              <p className="text-sm leading-relaxed max-w-md" style={{ color: colors.muted }}>
                A curated archive of inspiration from X, automatically refreshed daily.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] mb-6" style={{ color: colors.muted }}>
                Connect
              </p>
              <div className="space-y-3 text-sm">
                <a
                  href="https://x.com/serrrfirat"
                  target="_blank"
                  className="block transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-60"
                  style={{ color: colors.fg }}
                >
                  X / Twitter
                </a>
                <a
                  href="https://github.com/serrrfirat"
                  target="_blank"
                  className="block transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-60"
                  style={{ color: colors.fg }}
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-8 border-t transition-colors duration-700 ease-editorial" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: colors.mutedAlt }}>
              © 2026
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: colors.mutedAlt }}>
              Built with Clawdbot
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;