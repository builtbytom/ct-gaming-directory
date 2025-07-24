# CT Gaming Directory - Automated Scraper

This scraper automatically finds ALL gaming stores in Connecticut with ZERO manual work required.

## What It Does

1. **Searches every major CT city** (25 cities)
2. **Searches for every game type** (Pokemon, Magic, Warhammer, etc.)
3. **Automatically deduplicates** stores found multiple times
4. **Extracts all available data**:
   - Store name and address
   - Ratings and review counts
   - Open/closed status
   - Which games they support
5. **Saves results in multiple formats** (JSON, CSV, summary)

## Installation

```bash
cd scraper
npm install
```

## Usage

Just run it and walk away:

```bash
npm run scrape:auto
```

This will:
- Search 150+ combinations (25 cities × 6 game types)
- Take about 30-45 minutes to complete
- Save all results to `scraper-output/` directory

## Output Files

- `ct-game-stores.json` - Full data for your website
- `ct-game-stores.csv` - Easy to view in Excel
- `summary.txt` - Statistics and top-rated stores

## Features

- **Fully automated** - No human input needed
- **Respectful rate limiting** - Won't get blocked
- **Smart deduplication** - Each store only appears once
- **Progress tracking** - Shows percentage complete
- **Error handling** - Continues even if some searches fail

## Advanced Options

To also get detailed info (phone, website, hours):

```javascript
// Uncomment line 367 in automated-scraper.js
const enhanced = await this.enhanceStoreData();
```

This adds ~2 minutes per store but gets complete data.