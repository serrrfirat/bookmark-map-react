# Firat's X Bookmarks

A curated, auto-updating archive of X/Twitter bookmarks with a bold editorial design.

![Preview](https://bookmark-map-react.vercel.app)

## Features

- 🎨 **Editorial Design** - B&W palette, asymmetric border radii, custom cursor
- 🔍 **Search** - Global and per-category search
- 📊 **Sort** - By date or popularity
- 📰 **Article Cards** - Author-focused display for long-form content
- 🖼️ **Grayscale → Color** - Images colorize on hover
- 📱 **Responsive** - Works on all devices
- ⚡ **Auto-updates** - Daily sync via cron job

## Tech Stack

- **React 18** + TypeScript
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Vercel** - Hosting

## Development

```bash
pnpm install
pnpm dev
```

## Deployment

Deployed automatically to Vercel. Updates daily at 8:30pm Dubai time.

## Data

Bookmarks are fetched from X using the `bird` CLI and categorized into:
- AI Tools
- LLMs & Prompts
- Crypto & Web3
- Design & UI
- Video & Media
- Business & SaaS
- And more...

## License

MIT
