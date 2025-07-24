import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// Connecticut cities to search
const CT_CITIES = [
  'Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Waterbury',
  'Norwalk', 'Danbury', 'New Britain', 'Meriden', 'Bristol',
  'West Haven', 'Milford', 'Middletown', 'Norwich', 'Shelton',
  'Torrington', 'Groton', 'Stratford', 'East Hartford', 'Enfield',
  'Southington', 'Wallingford', 'Glastonbury', 'Hamden', 'Fairfield'
];

// Game types to search for
const GAME_TYPES = [
  'pokemon cards',
  'magic the gathering',
  'yugioh cards', 
  'warhammer 40k',
  'dungeons dragons',
  'board games'
];

class AutomatedGameStoreScraper {
  constructor() {
    this.stores = new Map();
    this.browser = null;
  }

  async initialize() {
    console.log('🚀 Initializing automated scraper...');
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
      
      // Wait for results
      await page.waitForSelector('div[role="feed"]', { timeout: 10000 });
      await page.waitForTimeout(3000);
      
      // Scroll to load more results
      await page.evaluate(() => {
        const feed = document.querySelector('div[role="feed"]');
        if (feed) {
          feed.scrollTop = feed.scrollHeight;
        }
      });
      await page.waitForTimeout(2000);
      
      // Extract all store data
      const stores = await page.evaluate(() => {
        const results = [];
        const articles = document.querySelectorAll('div[role="feed"] > div > div[jsaction]');
        
        articles.forEach(article => {
          // Get store name
          const nameEl = article.querySelector('div[role="heading"] span');
          if (!nameEl) return;
          
          const name = nameEl.textContent.trim();
          
          // Get address
          const addressSpans = article.querySelectorAll('span[role="img"]');
          let address = '';
          addressSpans.forEach(span => {
            const nextEl = span.nextElementSibling;
            if (nextEl && nextEl.textContent.includes(',')) {
              address = nextEl.textContent.trim();
            }
          });
          
          // Get rating
          const ratingEl = article.querySelector('span[role="img"][aria-label*="stars"]');
          let rating = null;
          if (ratingEl) {
            const match = ratingEl.getAttribute('aria-label').match(/(\d\.\d)/);
            if (match) rating = parseFloat(match[1]);
          }
          
          // Get review count
          const reviewEl = article.querySelector('span[aria-label*="reviews"]');
          let reviewCount = 0;
          if (reviewEl) {
            const match = reviewEl.getAttribute('aria-label').match(/(\d+)/);
            if (match) reviewCount = parseInt(match[1]);
          }
          
          // Get hours status
          const hoursEl = article.querySelector('div[jsaction] > div > div > div > div > span');
          let hoursStatus = '';
          if (hoursEl && (hoursEl.textContent.includes('Open') || hoursEl.textContent.includes('Closed'))) {
            hoursStatus = hoursEl.textContent.trim();
          }
          
          results.push({
            name,
            address,
            rating,
            reviewCount,
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
    console.log('\n🔍 Starting comprehensive Connecticut game store search...\n');
    
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
        
        // Add results to our store map (deduplicating by name+address)
        results.forEach(store => {
          const key = `${store.name}-${store.address}`.toLowerCase();
          if (!this.stores.has(key)) {
            this.stores.set(key, {
              ...store,
              city,
              gamesFound: [gameType],
              searchQueries: [query]
            });
          } else {
            // Update existing store with additional game types
            const existing = this.stores.get(key);
            if (!existing.gamesFound.includes(gameType)) {
              existing.gamesFound.push(gameType);
            }
            existing.searchQueries.push(query);
          }
        });
        
        // Rate limiting - be respectful to Google
        await this.wait(3000 + Math.random() * 2000);
      }
      
      // Extra delay between cities
      await this.wait(5000);
    }
  }

  async getDetailedInfo(storeName, storeAddress) {
    const page = await this.browser.newPage();
    
    try {
      // Search for specific store
      const query = `${storeName} ${storeAddress}`;
      await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
      
      // Click on the first result
      await page.waitForSelector('div[role="feed"] > div > div[jsaction]', { timeout: 10000 });
      await page.click('div[role="feed"] > div > div[jsaction]');
      
      // Wait for details panel
      await page.waitForTimeout(3000);
      
      // Extract detailed information
      const details = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };
        
        // Get phone number
        const phoneEl = Array.from(document.querySelectorAll('button[data-tooltip*="phone"]')).find(el => 
          el.textContent.match(/\(\d{3}\)/)
        );
        
        // Get website
        const websiteEl = document.querySelector('a[data-tooltip*="website"]');
        
        // Get hours
        const hoursButton = Array.from(document.querySelectorAll('div[role="button"]')).find(el =>
          el.getAttribute('aria-label')?.includes('Hours')
        );
        
        let hours = {};
        if (hoursButton) {
          hoursButton.click();
          // Wait a bit for hours to expand
          setTimeout(() => {
            const hoursTable = document.querySelector('table');
            if (hoursTable) {
              hoursTable.querySelectorAll('tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                  const day = cells[0].textContent.trim();
                  const time = cells[1].textContent.trim();
                  hours[day.toLowerCase()] = time;
                }
              });
            }
          }, 1000);
        }
        
        return {
          phone: phoneEl ? phoneEl.textContent.trim() : null,
          website: websiteEl ? websiteEl.href : null,
          hours
        };
      });
      
      return details;
      
    } catch (error) {
      console.error(`Error getting details for ${storeName}:`, error.message);
      return null;
    } finally {
      await page.close();
    }
  }

  async enhanceStoreData() {
    console.log('\n🔍 Enhancing store data with detailed information...\n');
    
    const stores = Array.from(this.stores.values());
    const enhancedStores = [];
    
    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];
      console.log(`Enhancing ${i + 1}/${stores.length}: ${store.name}`);
      
      const details = await this.getDetailedInfo(store.name, store.address);
      if (details) {
        enhancedStores.push({
          ...store,
          ...details
        });
      } else {
        enhancedStores.push(store);
      }
      
      // Rate limiting
      await this.wait(2000);
    }
    
    return enhancedStores;
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
    
    // Save CSV for easy viewing
    const csv = this.convertToCSV(stores);
    await fs.writeFile(
      path.join('scraper-output', 'ct-game-stores.csv'),
      csv
    );
    
    // Save summary
    const summary = this.generateSummary(stores);
    await fs.writeFile(
      path.join('scraper-output', 'summary.txt'),
      summary
    );
    
    console.log(`\n✅ Results saved to scraper-output/ directory`);
  }

  convertToCSV(stores) {
    const headers = ['Name', 'Address', 'City', 'Rating', 'Reviews', 'Games', 'Hours Status'];
    const rows = stores.map(store => [
      store.name,
      store.address,
      store.city,
      store.rating || '',
      store.reviewCount || '',
      store.gamesFound.join('; '),
      store.hoursStatus
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  generateSummary(stores) {
    const cityCounts = {};
    const gameCounts = {};
    
    stores.forEach(store => {
      cityCounts[store.city] = (cityCounts[store.city] || 0) + 1;
      store.gamesFound.forEach(game => {
        gameCounts[game] = (gameCounts[game] || 0) + 1;
      });
    });
    
    return `Connecticut Game Store Scraping Summary
==========================================
Total stores found: ${stores.length}
Scraping completed: ${new Date().toLocaleString()}

Stores by City:
${Object.entries(cityCounts)
  .sort(([,a], [,b]) => b - a)
  .map(([city, count]) => `  ${city}: ${count}`)
  .join('\n')}

Stores by Game Type:
${Object.entries(gameCounts)
  .sort(([,a], [,b]) => b - a)
  .map(([game, count]) => `  ${game}: ${count}`)
  .join('\n')}

Top Rated Stores:
${stores
  .filter(s => s.rating)
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 10)
  .map((s, i) => `  ${i + 1}. ${s.name} (${s.city}) - ${s.rating} stars`)
  .join('\n')}
`;
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
      
      // Optional: Enhance with detailed info (takes longer)
      // const enhanced = await this.enhanceStoreData();
      
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

// Run the automated scraper
const scraper = new AutomatedGameStoreScraper();
scraper.run();