/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Editorial palette
        background: '#f7f6f2',
        foreground: '#1c1c1c',
        primary: '#3d7068', // forest green
        border: '#e5e4de',
        muted: 'rgba(28, 28, 28, 0.6)',
        secondary: '#B4B4B4',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        'editorial': '1000ms',
        'editorial-fast': '700ms',
      },
      borderRadius: {
        'editorial': '2px',
      },
      animation: {
        'scan-line': 'scan-line 2s cubic-bezier(0.8, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'scan-line': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
    },
  },
  plugins: [],
}