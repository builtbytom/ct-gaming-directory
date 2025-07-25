# CT Gaming Directory - Project Notes

## 🎯 Project Overview
A directory for finding gaming stores, hobby shops, and places to play Pokemon, Magic, Warhammer, etc. in Connecticut. Built because of personal pain points finding stores during Pokemon hunting trips with kids.

## 🚀 Current Status (July 24, 2025)

### What's Built:
1. **Frontend (Astro + Tailwind)**
   - Gaming-themed dark UI with purple/blue gradients
   - Homepage with 373 stores (deduplicated to 340)
   - Store cards with game badges, ratings, open/closed status
   - Search functionality with filters (by game, open now, play space)
   - Store detail pages (basic and enhanced versions)
   - "Find Stores Near Me" geolocation feature

2. **Data Collection**
   - Automated scraper using Playwright
   - Searched 15 CT cities × 6 game types = 90 searches
   - Found 373 stores, deduplicated to 340 unique stores
   - **CRITICAL ISSUE**: No addresses captured, only city names

3. **Features Implemented**
   - Search by store name, city, or game type
   - Quick filters for Pokemon, Magic, Warhammer, etc.
   - Basic location services (city-level only)
   - Store detail pages with placeholder data
   - Enhanced detail pages for "claimed" stores (demo)

## 🔴 Critical Issues

### 1. **No Store Addresses**
- Scraper got store names and cities but NO street addresses
- Currently showing "Hartford, CT" instead of "123 Main St, Hartford, CT"
- Without addresses, can't provide directions (core functionality)
- City detection from store names is unreliable

### 2. **City Data Problems**
- Stores found in Hartford search might actually be in nearby cities
- Example: Dragon's Lair is in Wallingford but showed up in Hartford search
- Currently using name parsing (detects "Store - Wallingford" → Wallingford)
- But most stores don't have city in their name

## 📝 Technical Details

### File Structure:
```
ct-gaming-directory/
├── src/
│   ├── pages/
│   │   ├── index.astro (homepage)
│   │   ├── search.astro (search results)
│   │   └── store/[id].astro (store details)
│   ├── components/
│   │   ├── StoreCard.astro
│   │   ├── SearchBar.astro
│   │   ├── LocationButton.astro
│   │   ├── BasicStoreDetail.astro
│   │   └── EnhancedStoreDetail.astro
│   ├── data/
│   │   ├── stores.json (original scraped data)
│   │   └── stores-fixed.json (deduplicated with city fixes)
│   └── utils/
│       └── parseStoreName.js (extracts city from store names)
├── scraper/
│   ├── automated-scraper.js (main scraper)
│   ├── fixed-scraper.js (improved selectors)
│   └── get-store-details.js (for enriching with addresses - not run yet)
└── scripts/
    └── fix-store-cities.js (deduplication and city parsing)
```

### Data Format:
```json
{
  "name": "Dragon's Lair - Wallingford",
  "rating": null,
  "reviewCount": 0,
  "address": "",  // ← PROBLEM: Always empty
  "hoursStatus": "",
  "city": "Wallingford",  // ← Often wrong (search query city)
  "gamesFound": ["pokemon cards", "magic the gathering"],
  "foundInSearches": ["Hartford", "New Haven", "Middletown"]
}
```

## 🔧 Next Steps (Priority Order)

### 1. **Get Real Addresses** (CRITICAL)
- Run `get-store-details.js` to enrich stores with addresses
- Click into each Google Maps result to get full details
- Extract: street address, phone, website, hours
- Parse actual city from address
- Will take ~30 min for 50 stores, ~3 hours for all 340

### 2. **Fix Location Data**
- Replace guessed cities with parsed cities from addresses
- Update all components to show full addresses
- Make "Get Directions" actually work

### 3. **Map View**
- Interactive map showing all stores
- Filter by game type on map
- Cluster nearby stores
- Show route from user location

### 4. **Mobile Optimization**
- Critical for "Pokemon hunting in the car" use case
- Larger touch targets
- Simplified navigation
- Offline capability

### 5. **Store Claiming Process**
- Simple email verification
- Let owners update: hours, photos, events, exact address
- Unlock enhanced detail page

### 6. **N8N Automation**
- Weekly scraper runs
- Monitor for new stores
- Update hours/events from Facebook
- Email alerts for changes

## 💡 Lessons Learned

1. **Google Maps Scraping**
   - First few results have full details
   - Additional results have minimal data
   - Need to click into each result for addresses
   - Rate limiting is important

2. **City Detection**
   - Search results include nearby cities
   - Store names sometimes include city
   - Can't rely on search query city
   - Must get actual addresses

3. **Data Quality**
   - Start with less data but higher quality
   - 50 stores with full details > 340 with just names
   - Users need addresses for directions
   - Bad data undermines trust

## 🚦 Decision Point

Before continuing, we need to decide:

**Option A: Run Detail Enrichment**
- Pros: Real addresses, accurate cities, phone numbers
- Cons: Takes 3+ hours, might get rate limited
- Result: Fewer stores but all useful

**Option B: Launch As-Is**
- Pros: 340 stores, immediate launch
- Cons: No addresses, wrong cities, can't get directions
- Result: Looks impressive but not actually useful

**Option C: Hybrid Approach**
- Enrich top 50-100 stores with full details
- Launch with quality over quantity
- Let store owners add their details
- Gradually expand coverage

## 🎮 Original Vision
"I have two young kids, and there's been plenty of times where we'll have the day off and we're doing some daddy time, and we will actively try to go on a tour of different stores that sell Pokemon cards."

Without addresses, we can't fulfill this core use case of navigating store to store.

## 📊 Current Stats
- Total stores found: 373
- Unique stores: 340
- Stores with addresses: 0
- Stores with phone numbers: 0
- Stores with websites: 0
- Stores with hours: 0

## 🔗 Links
- GitHub: https://github.com/builtbytom/ct-gaming-directory
- Netlify: [Auto-deploys on push]
- Test stores:
  - Dragon's Lair - Wallingford (found in Hartford search)
  - Amato's Toy and Hobby Middletown (name includes city)
  - Back Again Board Game Cafe (Bristol, not Hartford)

---
Last Updated: July 24, 2025, 5:45 PM ET
Next Decision: Run address enrichment or launch without addresses?