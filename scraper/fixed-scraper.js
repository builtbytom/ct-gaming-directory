import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// Connecticut cities to search
const CT_CITIES = [
  'Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Waterbury',
  'Norwalk', 'Danbury', 'New Britain', 'Meriden', 'Bristol',
  'West Haven', 'Milford', 'Middletown', 'Norwich', 'Shelton'
];

// Game types to search for
const GAME_TYPES = [
  'pokemon cards',
  'magic the gathering',
  'yugioh cards', 
  'warhammer 40k',
  'board games'
];

class FixedGameStoreScraper {
  constructor() {
    this.stores = new Map();
    this.browser = null;
  }

  async initialize() {
    console.log('🚀 Initializing scraper with correct selectors...');
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async searchGoogleMaps(query) {
    const page = await this.browser.newPage();
    const results = [];
    
    try {
      console.log(`  📍 Searching: "${query}"`);
      
      await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
      
      // Wait for results to load
      await page.waitForSelector('a[aria-label][href*="maps/place"]', { timeout: 10000 });
      await page.waitForTimeout(3000);
      
      // Scroll to load more results
      const scrollContainer = await page.$('div[role="feed"]') || await page.$('div[style*="overflow"]');
      if (scrollContainer) {
        await scrollContainer.evaluate(node => node.scrollTop = node.scrollHeight);
        await page.waitForTimeout(2000);
      }
      
      // Extract store data using the working selectors
      const stores = await page.evaluate(() => {
        const results = [];
        
        // Get all place links
        const placeLinks = document.querySelectorAll('a[aria-label][href*="maps/place"]');
        
        placeLinks.forEach(link => {
          const ariaLabel = link.getAttribute('aria-label');
          if (!ariaLabel) return;
          
          // Parse the aria-label which contains all the info
          // Format: "Store Name 4.5 stars 123 reviews Address"
          const parts = ariaLabel.split(/(\d\.\d)\s+stars?\s+(\d+)\s+reviews?/i);
          
          let name = '';
          let rating = null;
          let reviewCount = 0;
          let address = '';
          
          if (parts.length >= 3) {
            name = parts[0].trim();
            rating = parseFloat(parts[1]);
            reviewCount = parseInt(parts[2]);
            address = parts[3] ? parts[3].trim() : '';
          } else {
            // Fallback parsing
            name = ariaLabel.split(',')[0].trim();
            const ratingMatch = ariaLabel.match(/(\d\.\d)\s+star/);
            if (ratingMatch) rating = parseFloat(ratingMatch[1]);
            const reviewMatch = ariaLabel.match(/(\d+)\s+review/);
            if (reviewMatch) reviewCount = parseInt(reviewMatch[1]);
          }
          
          // Get parent container for additional info
          const container = link.closest('div[jsaction]');
          let hoursStatus = '';
          
          if (container) {
            // Look for open/closed status
            const statusEl = container.querySelector('span.fontBodyMedium');
            if (statusEl && (statusEl.textContent.includes('Open') || statusEl.textContent.includes('Closed'))) {
              hoursStatus = statusEl.textContent.trim();
            }
          }
          
          results.push({
            name,
            rating,
            reviewCount,
            address,
            hoursStatus,
            scrapedAt: new Date().toISOString()
          });
        });
        
        return results;
      });
      
      results.push(...stores);
      console.log(`    ✅ Found ${stores.length} results`);
      
    } catch (error) {
      console.error(`    ❌ Error searching: ${error.message}`);
    } finally {
      await page.close();
    }
    
    return results;
  }

  async searchAllCombinations() {
    console.log('\n🔍 Starting Connecticut game store search...\n');
    
    let totalSearches = CT_CITIES.length * GAME_TYPES.length;
    let currentSearch = 0;
    
    for (const city of CT_CITIES) {
      console.log(`\n📌 Searching ${city}, CT...`);
      
      for (const gameType of GAME_TYPES) {
        currentSearch++;
        const query = `${gameType} store ${city} Connecticut`;
        const progress = Math.round((currentSearch / totalSearches) * 100);
        
        console.log(`Progress: ${progress}% (${currentSearch}/${totalSearches})`);
        
        const results = await this.searchGoogleMaps(query);
        
        // Add results to our store map
        results.forEach(store => {
          if (!store.name) return;
          
          const key = `${store.name}-${store.address || city}`.toLowerCase();
          if (!this.stores.has(key)) {
            this.stores.set(key, {
              ...store,
              city,
              gamesFound: [gameType],
              searchQueries: [query]
            });
          } else {
            const existing = this.stores.get(key);
            if (!existing.gamesFound.includes(gameType)) {
              existing.gamesFound.push(gameType);
            }
            existing.searchQueries.push(query);
          }
        });
        
        // Rate limiting
        await this.wait(3000 + Math.random() * 2000);
      }
      
      // Show running total
      console.log(`  📊 Total unique stores so far: ${this.stores.size}`);
      
      // Extra delay between cities
      await this.wait(5000);
    }
  }

  async saveResults() {
    const stores = Array.from(this.stores.values());
    
    // Sort by city and name
    stores.sort((a, b) => {
      if (a.city !== b.city) return a.city.localeCompare(b.city);
      return a.name.localeCompare(b.name);
    });
    
    // Create output directory
    await fs.mkdir('scraper-output', { recursive: true });
    
    // Save raw data
    await fs.writeFile(
      path.join('scraper-output', 'ct-game-stores.json'),
      JSON.stringify(stores, null, 2)
    );
    
    // Save summary
    const summary = `Connecticut Game Store Scraping Summary
==========================================
Total stores found: ${stores.length}
Scraping completed: ${new Date().toLocaleString()}

Sample stores found:
${stores.slice(0, 10).map((s, i) => 
  `${i + 1}. ${s.name} (${s.city}) - ${s.rating ? s.rating + ' stars' : 'no rating'}`
).join('\n')}

Cities searched: ${CT_CITIES.join(', ')}
Game types searched: ${GAME_TYPES.join(', ')}
`;
    
    await fs.writeFile(
      path.join('scraper-output', 'summary.txt'),
      summary
    );
    
    console.log(`\n✅ Results saved to scraper-output/ directory`);
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.searchAllCombinations();
      await this.saveResults();
      
      console.log('\n🎉 Scraping complete!');
      console.log(`📊 Found ${this.stores.size} unique game stores in Connecticut`);
      
    } catch (error) {
      console.error('💥 Fatal error:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the scraper
const scraper = new FixedGameStoreScraper();
scraper.run();