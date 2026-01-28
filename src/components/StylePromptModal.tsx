import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Palette, Sparkles, Wand2 } from 'lucide-react';
import { copyToClipboard, type StyleAnalysis } from '../utils/styleAnalyzer';

interface StylePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleAnalysis: StyleAnalysis | null;
  bookmarkTitle: string;
  colors: {
    bg: string;
    fg: string;
    primary: string;
    border: string;
    muted: string;
    mutedAlt: string;
    overlay: string;
  };
  darkMode: boolean;
}

const editorialEase = [0.16, 1, 0.3, 1];

export function StylePromptModal({
  isOpen,
  onClose,
  styleAnalysis,
  bookmarkTitle,
  colors,
  darkMode,
}: StylePromptModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!styleAnalysis) return;
    const success = await copyToClipboard(styleAnalysis.prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!styleAnalysis) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: editorialEase }}
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={onClose}
          />

          {/* Modal Container - Centers the modal */}
          <div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: editorialEase }}
              className="w-full max-w-lg max-h-[85vh] flex flex-col pointer-events-auto"
              style={{
                backgroundColor: colors.bg,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex-shrink-0 p-6 border-b"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center border"
                      style={{ borderColor: colors.border }}
                    >
                      <Wand2 className="w-5 h-5" style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <h2 className="text-lg font-serif">Style Prompt</h2>
                      <p
                        className="text-[10px] font-mono uppercase tracking-[0.2em] truncate max-w-[200px]"
                        style={{ color: colors.mutedAlt }}
                      >
                        {bookmarkTitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 transition-opacity hover:opacity-60"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                {/* Main Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.3em]"
                      style={{ color: colors.muted }}
                    >
                      Copyable Prompt
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] border transition-all duration-300"
                      style={{
                        borderColor: copied ? colors.primary : colors.border,
                        color: copied ? colors.primary : colors.fg,
                        backgroundColor: copied
                          ? darkMode
                            ? 'rgba(90, 154, 138, 0.1)'
                            : 'rgba(61, 112, 104, 0.05)'
                          : 'transparent',
                      }}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div
                    className="p-4 border text-sm leading-relaxed"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    }}
                  >
                    {styleAnalysis.prompt}
                  </div>
                </div>

                {/* Style Tags */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" style={{ color: colors.mutedAlt }} />
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.3em]"
                      style={{ color: colors.muted }}
                    >
                      Style Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {styleAnalysis.style.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 text-xs border"
                        style={{ borderColor: colors.border, color: colors.muted }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4" style={{ color: colors.mutedAlt }} />
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.3em]"
                      style={{ color: colors.muted }}
                    >
                      Color Palette
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {styleAnalysis.colorPalette.map((color) => (
                      <div key={color} className="flex flex-col items-center gap-1">
                        <div
                          className="w-10 h-10 border"
                          style={{
                            backgroundColor: color,
                            borderColor: colors.border,
                          }}
                        />
                        <span
                          className="text-[8px] font-mono uppercase"
                          style={{ color: colors.mutedAlt }}
                        >
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details Grid */}
                <div
                  className="grid grid-cols-3 gap-3 p-4 border"
                  style={{ borderColor: colors.border }}
                >
                  <div>
                    <span
                      className="block text-[9px] font-mono uppercase tracking-[0.2em] mb-1"
                      style={{ color: colors.mutedAlt }}
                    >
                      Technique
                    </span>
                    <span className="text-xs">{styleAnalysis.technique}</span>
                  </div>
                  <div>
                    <span
                      className="block text-[9px] font-mono uppercase tracking-[0.2em] mb-1"
                      style={{ color: colors.mutedAlt }}
                    >
                      Mood
                    </span>
                    <span className="text-xs">{styleAnalysis.mood}</span>
                  </div>
                  <div>
                    <span
                      className="block text-[9px] font-mono uppercase tracking-[0.2em] mb-1"
                      style={{ color: colors.mutedAlt }}
                    >
                      Movement
                    </span>
                    <span className="text-xs">{styleAnalysis.movement}</span>
                  </div>
                </div>
              </div>

              {/* Footer with Button - Fixed at bottom */}
              <div
                className="flex-shrink-0 p-4 border-t"
                style={{ borderColor: colors.border }}
              >
                <button
                  onClick={handleCopy}
                  className="w-full py-3 text-sm font-mono uppercase tracking-[0.2em] transition-all duration-300 hover:opacity-90"
                  style={{ backgroundColor: colors.primary, color: '#fff' }}
                >
                  {copied ? 'Copied to Clipboard!' : 'Use This Prompt'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
