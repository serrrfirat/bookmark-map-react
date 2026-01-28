// Style Analyzer utility for generating copyable style prompts using Kimi 2.5
// Inspired by Superdesign.dev's prompt library

// Categories that support style prompt extraction
export const STYLE_ENABLED_CATEGORIES = ['Art & Inspiration', 'Design & UI'];

export interface StyleAnalysis {
  prompt: string;           // Full copyable style prompt
  style: string[];          // Style tags (e.g., "pixel art", "minimalist")
  colorPalette: string[];   // Hex color codes
  technique: string;        // (e.g., "digital painting", "3D render")
  mood: string;             // (e.g., "dreamy", "energetic", "nostalgic")
  movement: string;         // Art movement/era (e.g., "vaporwave", "brutalist")
}

export function isStyleEnabledCategory(category: string | undefined): boolean {
  if (!category) return false;
  return STYLE_ENABLED_CATEGORIES.some(
    c => c.toLowerCase() === category.toLowerCase()
  );
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

// Build the prompt for Kimi 2.5 Vision API to analyze an image
export function buildStyleAnalysisPrompt(): string {
  return `Analyze this image and generate a detailed style prompt that could be used to recreate a similar visual. Your response must be valid JSON.

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
- Focus on visual characteristics, not content/subject matter`;
}

// Call Kimi 2.5 Vision API to analyze an image
export async function analyzeImageWithKimi(
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

  // Parse JSON response
  const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
  const analysis = JSON.parse(cleanContent) as StyleAnalysis;

  return analysis;
}

// Generate a fallback/placeholder style analysis for demo purposes
export function generatePlaceholderAnalysis(mediaUrl: string): StyleAnalysis {
  // Simple hash-based deterministic placeholders
  const hash = mediaUrl.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  const abs = Math.abs(hash);

  const styles = [
    ['pixel art', 'retro', 'nostalgic'],
    ['minimalist', 'clean', 'modern'],
    ['cyberpunk', 'neon', 'futuristic'],
    ['organic', 'natural', 'flowing'],
    ['brutalist', 'bold', 'geometric'],
  ];

  const techniques = ['digital painting', '3D render', 'pixel art', 'vector illustration', 'photography'];
  const moods = ['dreamy', 'energetic', 'nostalgic', 'dark', 'serene'];
  const movements = ['vaporwave', 'minimalism', 'cyberpunk', 'art deco', 'neo-brutalism'];

  const palettes = [
    ['#2D1B4E', '#00FFFF', '#FF00FF', '#1a1a2e'],
    ['#f5f5f5', '#2d2d2d', '#ff6b6b', '#4ecdc4'],
    ['#0f0f0f', '#ff3366', '#33ff66', '#3366ff'],
    ['#ffeaa7', '#dfe6e9', '#74b9ff', '#a29bfe'],
    ['#2c3e50', '#e74c3c', '#ecf0f1', '#3498db'],
  ];

  const idx = abs % 5;

  return {
    prompt: `A ${movements[idx]} style composition featuring ${styles[idx].join(' and ')} aesthetics. ${moods[idx].charAt(0).toUpperCase() + moods[idx].slice(1)} atmosphere with a color palette dominated by ${palettes[idx].slice(0, 2).join(' and ')}. Created using ${techniques[idx]} techniques with attention to detail and composition.`,
    style: styles[idx],
    colorPalette: palettes[idx],
    technique: techniques[idx],
    mood: moods[idx],
    movement: movements[idx],
  };
}
