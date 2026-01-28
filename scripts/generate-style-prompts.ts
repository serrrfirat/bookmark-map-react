#!/usr/bin/env npx tsx
/**
 * Script to generate style prompts for bookmarks in Art & Inspiration and Design & UI categories
 * Uses Kimi 2.5 Vision API to analyze images and generate copyable style prompts
 *
 * Usage:
 *   KIMI_API_KEY=your_key npx tsx scripts/generate-style-prompts.ts
 *
 * Or set the API key in a .env file:
 *   KIMI_API_KEY=sk-...
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Types
interface StyleAnalysis {
  prompt: string;
  style: string[];
  colorPalette: string[];
  technique: string;
  mood: string;
  movement: string;
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
const KIMI_API_KEY = process.env.KIMI_API_KEY;

// Build the analysis prompt
function buildStyleAnalysisPrompt(): string {
  return `Analyze this image and generate a detailed style prompt that could be used to recreate a similar visual. Your response must be valid JSON only, with no markdown formatting.

Return the analysis in this exact JSON format:
{
  "prompt": "A detailed, copyable prompt describing the visual style, composition, colors, technique, and mood. Should be 2-4 sentences that capture the essence of the image's aesthetic. Include specific details like color names with hex codes, art style, composition, lighting, and atmosphere.",
  "style": ["tag1", "tag2", "tag3"],
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "technique": "The primary technique used (e.g., digital painting, 3D render, pixel art, photography, vector art)",
  "mood": "The emotional atmosphere (e.g., dreamy, energetic, nostalgic, dark, serene)",
  "movement": "The art movement or aesthetic era it belongs to (e.g., vaporwave, brutalist, art deco, cyberpunk, minimalist)"
}

Guidelines:
- The "prompt" should be specific enough to generate similar imagery
- Include 3-5 style tags that describe the visual
- Extract 3-5 dominant colors as hex codes
- Be specific about technique, mood, and movement
- Focus on visual characteristics, not content/subject matter
- Return ONLY valid JSON, no markdown code blocks`;
}

// Call Kimi 2.5 Vision API
async function analyzeImageWithKimi(
  imageUrl: string,
  apiKey: string
): Promise<StyleAnalysis> {
  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-k2.5-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            },
            {
              type: 'text',
              text: buildStyleAnalysisPrompt()
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Kimi API error: ${(error as { message?: string }).message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Kimi API');
  }

  // Parse JSON response (remove any markdown if present)
  const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanContent) as StyleAnalysis;
}

// Delay helper for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Main function
async function main() {
  console.log('🎨 Style Prompt Generator for Bookmarks');
  console.log('========================================\n');

  if (!KIMI_API_KEY) {
    console.error('❌ Error: KIMI_API_KEY environment variable is not set');
    console.log('\nUsage: KIMI_API_KEY=your_key npx tsx scripts/generate-style-prompts.ts');
    process.exit(1);
  }

  // Load existing data
  console.log('📂 Loading data.json...');
  const rawData = readFileSync(DATA_FILE, 'utf-8');
  const data: BookmarkData = JSON.parse(rawData);

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const category of STYLE_ENABLED_CATEGORIES) {
    const bookmarks = data[category];
    if (!bookmarks || bookmarks.length === 0) {
      console.log(`\n⚠️ Category "${category}" not found or empty, skipping...`);
      continue;
    }

    console.log(`\n📁 Processing category: ${category} (${bookmarks.length} bookmarks)`);
    console.log('─'.repeat(50));

    for (let i = 0; i < bookmarks.length; i++) {
      const bookmark = bookmarks[i];

      // Skip if no media URL
      if (!bookmark.mediaUrl) {
        console.log(`  [${i + 1}/${bookmarks.length}] ⏭️ Skipping (no media): ${bookmark.text.slice(0, 40)}...`);
        totalSkipped++;
        continue;
      }

      // Skip if already has style analysis
      if (bookmark.styleAnalysis) {
        console.log(`  [${i + 1}/${bookmarks.length}] ✅ Already analyzed: ${bookmark.text.slice(0, 40)}...`);
        totalSkipped++;
        continue;
      }

      console.log(`  [${i + 1}/${bookmarks.length}] 🔍 Analyzing: ${bookmark.text.slice(0, 40)}...`);

      try {
        const analysis = await analyzeImageWithKimi(bookmark.mediaUrl, KIMI_API_KEY);
        bookmark.styleAnalysis = analysis;
        bookmark.stylePrompt = analysis.prompt;
        totalProcessed++;
        console.log(`    ✨ Generated: "${analysis.prompt.slice(0, 60)}..."`);
        console.log(`    🎨 Style: ${analysis.style.join(', ')}`);
        console.log(`    🎭 Mood: ${analysis.mood} | Movement: ${analysis.movement}`);
      } catch (error) {
        console.log(`    ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        totalErrors++;
      }

      // Rate limiting - wait 1 second between requests
      if (i < bookmarks.length - 1) {
        await delay(1000);
      }
    }
  }

  // Save updated data
  console.log('\n\n💾 Saving updated data.json...');
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  // Summary
  console.log('\n========================================');
  console.log('📊 Summary:');
  console.log(`   ✅ Processed: ${totalProcessed}`);
  console.log(`   ⏭️ Skipped: ${totalSkipped}`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log('========================================');
  console.log('\n✅ Done! Style prompts have been added to data.json');
}

main().catch(console.error);
