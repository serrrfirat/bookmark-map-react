#!/usr/bin/env npx tsx
/**
 * Generate style prompts using Bird CLI + Kimi CLI
 *
 * Flow:
 *   1. Bird CLI fetches tweet data (including full-res media URLs)
 *   2. Kimi CLI analyzes the media with Kimi 2.5 vision
 *   3. For videos/animations: Generate React + Framer Motion implementation prompt
 *   4. For images: Generate style guide + React component prompt
 *
 * Prerequisites:
 *   1. Install Bird CLI: npm install -g @steipete/bird
 *   2. Install Kimi CLI: curl -LsSf https://code.kimi.com/install.sh | bash
 *   3. Authenticate both: bird whoami && kimi (then /login)
 *
 * Usage:
 *   npx tsx scripts/generate-style-prompts-kimi-cli.ts
 *   npx tsx scripts/generate-style-prompts-kimi-cli.ts --dry-run
 *   npx tsx scripts/generate-style-prompts-kimi-cli.ts --limit 5
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Types
interface StyleAnalysis {
  prompt: string;
  style: string[];
  colorPalette: string[];
  technique: string;
  mood: string;
  movement: string;
  reactImplementation?: string;
  styleGuide?: {
    colors: Record<string, string>;
    typography?: string;
    spacing?: string;
    animations?: string[];
  };
}

interface BirdMedia {
  type: string;
  url: string;
  videoUrl?: string;
  width?: number;
  height?: number;
}

interface BirdTweetResponse {
  id: string;
  text: string;
  media?: BirdMedia[];
}

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
  stylePrompt?: string;
  styleAnalysis?: StyleAnalysis;
}

interface BookmarkData {
  [category: string]: Bookmark[];
}

// Configuration
const STYLE_ENABLED_CATEGORIES = ['Art & Inspiration', 'Design & UI'];
const DATA_FILE = resolve(__dirname, '../public/data.json');

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : Infinity;

// Fetch tweet media using Bird CLI
function fetchTweetMedia(tweetUrl: string): { mediaUrl: string; isVideo: boolean } | null {
  try {
    const result = execSync(
      `bird read --json "${tweetUrl}" 2>/dev/null`,
      {
        encoding: 'utf-8',
        timeout: 30000,
      }
    );

    // Extract JSON (skip any warning lines)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const tweet: BirdTweetResponse = JSON.parse(jsonMatch[0]);

    if (!tweet.media || tweet.media.length === 0) return null;

    const media = tweet.media[0];
    const isVideo = media.type === 'video' || media.type === 'animated_gif';

    // For videos, use videoUrl; for images, use the full URL
    const mediaUrl = isVideo && media.videoUrl ? media.videoUrl : media.url;

    return { mediaUrl, isVideo };
  } catch (error) {
    return null;
  }
}

// Build prompt for VIDEO/ANIMATION analysis
function buildVideoPrompt(mediaUrl: string): string {
  return `I want you to analyze this video/animation and help me replicate it in a React project.

Video URL: ${mediaUrl}

Please use Bird CLI to fetch and analyze this video, then provide:

1. **Animation Analysis**: Describe exactly what's happening in the animation - timing, easing, transformations, etc.

2. **React Implementation Prompt**: A detailed prompt I can use to recreate this exact animation using React and Framer Motion.

Return ONLY valid JSON (no markdown code blocks):
{
  "prompt": "A detailed 2-4 sentence description of the visual style and animation",
  "style": ["tag1", "tag2", "tag3", "tag4"],
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "technique": "animation technique (e.g., keyframe animation, physics-based, particle system)",
  "mood": "emotional atmosphere",
  "movement": "art movement or aesthetic",
  "reactImplementation": "Detailed step-by-step prompt for implementing this animation in React with Framer Motion. Include specific motion values, easing functions, and component structure.",
  "styleGuide": {
    "colors": {"primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex"},
    "animations": ["animation1 description with timing", "animation2 description"]
  }
}`;
}

// Build prompt for IMAGE analysis
function buildImagePrompt(mediaUrl: string): string {
  return `I want you to analyze this image and help me replicate its style in a React project.

Image URL: ${mediaUrl}

Please use Bird CLI to fetch and analyze this image, then provide:

1. **Style Analysis**: Describe the visual style, colors, composition, and aesthetic.

2. **React Component Prompt**: A detailed prompt for creating a React component that captures this visual style.

3. **Style Guide**: A JSON style guide I can use in my project.

Return ONLY valid JSON (no markdown code blocks):
{
  "prompt": "A detailed 2-4 sentence style prompt describing colors (with hex codes), composition, technique, and aesthetic",
  "style": ["tag1", "tag2", "tag3", "tag4"],
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "technique": "primary technique (e.g., digital painting, 3D render, pixel art)",
  "mood": "emotional atmosphere",
  "movement": "art movement or aesthetic",
  "reactImplementation": "Detailed prompt for creating a React component that captures this visual style. Include CSS/Tailwind classes, gradients, shadows, and any visual effects.",
  "styleGuide": {
    "colors": {"primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex"},
    "typography": "font recommendations and sizing",
    "spacing": "spacing scale recommendations"
  }
}`;
}

// Call Kimi CLI to analyze media
function analyzeWithKimiCLI(mediaUrl: string, isVideo: boolean): StyleAnalysis | null {
  const prompt = isVideo ? buildVideoPrompt(mediaUrl) : buildImagePrompt(mediaUrl);

  try {
    // Write prompt to temp file to avoid shell escaping issues
    const tempFile = `/tmp/kimi-prompt-${Date.now()}.txt`;
    writeFileSync(tempFile, prompt);

    const result = execSync(
      `cat "${tempFile}" | kimi --quiet -p "$(cat)"`,
      {
        encoding: 'utf-8',
        timeout: 180000, // 3 minute timeout for video analysis
        maxBuffer: 10 * 1024 * 1024,
        shell: '/bin/bash',
      }
    );

    // Clean up temp file
    try { execSync(`rm "${tempFile}"`); } catch {}

    // Extract JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('    ⚠️ No JSON found in response');
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]) as StyleAnalysis;
    return analysis;
  } catch (error) {
    if (error instanceof Error) {
      console.log(`    ❌ Kimi CLI error: ${error.message.slice(0, 100)}`);
    }
    return null;
  }
}

// Direct Kimi call using temp file to avoid shell escaping issues
function analyzeWithKimiCLIDirect(mediaUrl: string, isVideo: boolean, fallbackUrl?: string): StyleAnalysis | null {
  const mediaType = isVideo ? 'video/animation' : 'image';
  const urlToUse = mediaUrl || fallbackUrl;

  if (!urlToUse) return null;

  const prompt = isVideo
    ? `Analyze this ${mediaType} and provide a React + Framer Motion implementation prompt.

Media URL: ${urlToUse}

Return ONLY valid JSON:
{
  "prompt": "2-4 sentence description of the visual style and animation",
  "style": ["tag1", "tag2", "tag3"],
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "technique": "animation technique",
  "mood": "emotional atmosphere",
  "movement": "art movement/aesthetic",
  "reactImplementation": "Step-by-step React + Framer Motion implementation guide with specific motion values, easing, and component structure"
}`
    : `Analyze this ${mediaType} and provide a style guide for React implementation.

Media URL: ${urlToUse}

Return ONLY valid JSON:
{
  "prompt": "2-4 sentence style prompt with hex colors, composition, technique",
  "style": ["tag1", "tag2", "tag3"],
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "technique": "primary technique",
  "mood": "emotional atmosphere",
  "movement": "art movement/aesthetic",
  "reactImplementation": "React component implementation guide with Tailwind/CSS classes, gradients, shadows, visual effects"
}`;

  try {
    // Write prompt to temp file to avoid shell escaping issues
    const tempFile = `/tmp/kimi-prompt-${Date.now()}.txt`;
    writeFileSync(tempFile, prompt);

    const result = execSync(
      `kimi --quiet -p "$(cat '${tempFile}')"`,
      {
        encoding: 'utf-8',
        timeout: 180000,
        maxBuffer: 10 * 1024 * 1024,
        shell: '/bin/bash',
      }
    );

    // Clean up temp file
    try { execSync(`rm '${tempFile}'`, { stdio: 'pipe' }); } catch {}

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('    ⚠️ No JSON found in response');
      return null;
    }

    return JSON.parse(jsonMatch[0]) as StyleAnalysis;
  } catch (error) {
    if (error instanceof Error) {
      console.log(`    ❌ Kimi error: ${error.message.slice(0, 80)}`);
    }
    return null;
  }
}

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Concurrency limit for parallel processing
const CONCURRENCY = 5;

// Process a single bookmark
async function processBookmark(
  bookmark: Bookmark,
  category: string,
  index: number,
  total: number
): Promise<{ success: boolean; bookmark: Bookmark }> {
  const shortText = bookmark.text.slice(0, 40).replace(/\n/g, ' ');
  const isVideo = bookmark.mediaType === 'video' || bookmark.mediaType === 'animated_gif';

  console.log(`[${index + 1}/${total}] ${isVideo ? '🎬' : '🖼️'} ${shortText}...`);

  // Step 1: Try to get full media URL from Bird CLI
  const birdResult = fetchTweetMedia(bookmark.url);

  let mediaUrl = bookmark.mediaUrl!;
  let mediaIsVideo = isVideo;

  if (birdResult) {
    mediaUrl = birdResult.mediaUrl;
    mediaIsVideo = birdResult.isVideo;
  }

  // Step 2: Analyze with Kimi CLI
  const analysis = analyzeWithKimiCLIDirect(mediaUrl, mediaIsVideo, bookmark.mediaUrl!);

  if (analysis) {
    bookmark.styleAnalysis = analysis;
    bookmark.stylePrompt = analysis.prompt;
    console.log(`  ✅ [${index + 1}] ${analysis.style.slice(0, 3).join(', ')}`);
    return { success: true, bookmark };
  } else {
    console.log(`  ❌ [${index + 1}] Failed`);
    return { success: false, bookmark };
  }
}

// Process bookmarks in parallel with concurrency limit
async function processInParallel(
  bookmarks: Array<{ category: string; index: number; bookmark: Bookmark }>,
  concurrency: number
): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;
  const total = bookmarks.length;

  // Process in batches
  for (let i = 0; i < bookmarks.length; i += concurrency) {
    const batch = bookmarks.slice(i, i + concurrency);
    console.log(`\n📦 Batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(bookmarks.length / concurrency)} (${batch.length} items)`);

    const promises = batch.map((item, batchIndex) =>
      processBookmark(item.bookmark, item.category, i + batchIndex, total)
    );

    const results = await Promise.all(promises);

    for (const result of results) {
      if (result.success) {
        processed++;
      } else {
        errors++;
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + concurrency < bookmarks.length) {
      console.log(`⏳ Waiting 2s before next batch...`);
      await delay(2000);
    }
  }

  return { processed, errors };
}

// Main
async function main() {
  console.log('🎨 Style Prompt Generator (Bird CLI + Kimi CLI)');
  console.log('================================================\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Check Bird CLI
  try {
    execSync('bird --version', { encoding: 'utf-8', stdio: 'pipe' });
    console.log('✅ Bird CLI found');
  } catch {
    console.error('❌ Bird CLI not found. Install with: npm install -g @steipete/bird');
    process.exit(1);
  }

  // Check Kimi CLI
  try {
    const version = execSync('kimi --version', { encoding: 'utf-8' }).trim();
    console.log(`✅ Kimi CLI found: ${version}`);
  } catch {
    console.error('❌ Kimi CLI not found. Install with:');
    console.log('   curl -LsSf https://code.kimi.com/install.sh | bash');
    process.exit(1);
  }

  // Load data
  console.log('\n📂 Loading data.json...');
  const rawData = readFileSync(DATA_FILE, 'utf-8');
  const data: BookmarkData = JSON.parse(rawData);

  // Collect bookmarks to process
  const toProcess: Array<{ category: string; index: number; bookmark: Bookmark }> = [];

  for (const category of STYLE_ENABLED_CATEGORIES) {
    const bookmarks = data[category];
    if (!bookmarks) continue;

    for (let i = 0; i < bookmarks.length; i++) {
      const bookmark = bookmarks[i];
      if (bookmark.mediaUrl && !bookmark.styleAnalysis) {
        toProcess.push({ category, index: i, bookmark });
      }
    }
  }

  console.log(`\n📊 Found ${toProcess.length} bookmarks to process`);

  if (toProcess.length === 0) {
    console.log('✅ All bookmarks already have style analysis!');
    return;
  }

  const processCount = Math.min(toProcess.length, LIMIT);
  const itemsToProcess = toProcess.slice(0, processCount);
  console.log(`   Processing: ${processCount}${LIMIT < Infinity ? ` (limited)` : ''}`);
  console.log(`   Concurrency: ${CONCURRENCY} parallel requests\n`);

  let processed = 0;
  let errors = 0;

  if (DRY_RUN) {
    for (const { bookmark } of itemsToProcess) {
      const isVideo = bookmark.mediaType === 'video' || bookmark.mediaType === 'animated_gif';
      console.log(`   ⏭️ Would process: ${isVideo ? '🎬' : '🖼️'} ${bookmark.text.slice(0, 40)}...`);
    }
  } else {
    const result = await processInParallel(itemsToProcess, CONCURRENCY);
    processed = result.processed;
    errors = result.errors;
  }

  // Save
  if (!DRY_RUN && processed > 0) {
    console.log('\n\n💾 Saving data.json...');
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }

  // Summary
  console.log('\n================================================');
  console.log('📊 Summary:');
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ❌ Errors: ${errors}`);
  if (DRY_RUN) {
    console.log('   🔍 (Dry run - no changes saved)');
  }
  console.log('================================================\n');
}

main().catch(console.error);
