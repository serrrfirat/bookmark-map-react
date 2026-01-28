# Generate Style Prompts

Generate style prompts for bookmarks using Kimi K2.5 Vision.

## Description

Analyzes images and videos from bookmarks in "Art & Inspiration" and "Design & UI" categories, generating detailed copyable style prompts using Kimi K2.5's multimodal capabilities.

## Usage

Invoke with: `/generate-style-prompts`

## Instructions

When this skill is invoked:

### 1. Check Kimi CLI

```bash
kimi --version
```

If not installed:
```bash
curl -LsSf https://code.kimi.com/install.sh | bash
```

If not authenticated, tell the user to run `kimi` interactively and use `/login`.

### 2. Load Data

Read `public/data.json` and find bookmarks in "Art & Inspiration" or "Design & UI" that:
- Have a `mediaUrl`
- Don't have `styleAnalysis` yet

### 3. Process Each Bookmark

For each bookmark, run:

```bash
kimi --quiet -p "Analyze this image and generate a detailed style prompt for recreating similar visuals.

Image URL: {mediaUrl}

Return ONLY valid JSON (no markdown):
{
  \"prompt\": \"2-4 sentence detailed style prompt with specific colors (hex codes), composition, technique\",
  \"style\": [\"tag1\", \"tag2\", \"tag3\"],
  \"colorPalette\": [\"#hex1\", \"#hex2\", \"#hex3\", \"#hex4\"],
  \"technique\": \"primary technique (digital painting, 3D render, pixel art, etc)\",
  \"mood\": \"emotional atmosphere\",
  \"movement\": \"art movement or aesthetic era\"
}"
```

### 4. Parse & Update

Parse the JSON response and add to bookmark:
- `styleAnalysis`: full object
- `stylePrompt`: the prompt string

### 5. Save

Write updated data to `public/data.json`.

### 6. Report

Show summary: processed count, skipped count, errors.
