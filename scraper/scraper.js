import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import pLimit from 'p-limit';

// Limit concurrent requests to be respectful
const limit = pLimit(2);

// Known gaming store websites in Connecticut
const STORE_WEBSITES = [
  {
    name: "Gamer's Gambit",
    url: "https://www.gamersgambit.com",
    selectors: {
      hours: '.store-hours',
      events: '.events-calendar',
      games: '.product-categories'
    }
  },
  {
    name: "Board Game Paradise",
    url: "https://www.boardgameparadise.com",
    selectors: {
      hours: '.hours-section',
      events: '.calendar',
      games: '.game-list'
    }
  }
  // Add more stores as we find them
];

// Search terms to find gaming stores
const SEARCH_QUERIES = [
  'game store connecticut',
  'pokemon cards connecticut',
  'magic the gathering store ct',
  'warhammer store connecticut',
  'board game cafe ct',
  'tabletop gaming connecticut',
  'yu-gi-oh store ct',
  'd&d store connecticut'
];

async function scrapeStoreWebsite(browser, store) {
  console.log(`📊 Scraping ${store.name}...`);
  
  try {
    const page = await browser.newPage();
    await page.goto(store.url, { waitUntil: 'networkidle' });
    
    const data = await page.evaluate((selectors) => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };
      
      return {
        hours: getText(selectors.hours),
        events: getText(selectors.events),
        games: getText(selectors.games)
      };
    }, store.selectors);
    
    await page.close();
    
    return {
      ...store,
      ...data,
      lastScraped: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Error scraping ${store.name}:`, error.message);
    return null;
  }
}

async function findStoresOnGoogle(browser, query) {
  console.log(`🔍 Searching Google for: ${query}`);
  
  const page = await browser.newPage();
  const stores = [];
  
  try {
    // Search Google
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    await page.waitForSelector('.g', { timeout: 5000 });
    
    // Extract search results
    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.g').forEach(result => {
        const titleEl = result.querySelector('h3');
        const linkEl = result.querySelector('a');
        const snippetEl = result.querySelector('.VwiC3b');
        
        if (titleEl && linkEl) {
          items.push({
            title: titleEl.textContent,
            url: linkEl.href,
            snippet: snippetEl ? snippetEl.textContent : ''
          });
        }
      });
      return items.slice(0, 10); // Top 10 results
    });
    
    // Filter for actual store websites (not aggregators)
    const storeResults = results.filter(r => 
      !r.url.includes('yelp.com') &&
      !r.url.includes('yellowpages.com') &&
      !r.url.includes('facebook.com') &&
      !r.url.includes('tripadvisor.com')
    );
    
    stores.push(...storeResults);
    await page.close();
  } catch (error) {
    console.error(`❌ Error searching Google:`, error.message);
    await page.close();
  }
  
  return stores;
}

async function findStoresOnGoogleMaps(browser, query) {
  console.log(`📍 Searching Google Maps for: ${query}`);
  
  const page = await browser.newPage();
  const stores = [];
  
  try {
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
    
    // Wait for results to load
    await page.waitForSelector('[role="article"]', { timeout: 10000 });
    await page.waitForTimeout(2000); // Let results fully load
    
    // Extract store information
    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('[role="article"]').forEach(article => {
        const nameEl = article.querySelector('h3');
        const addressEl = article.querySelector('[data-tooltip="Copy address"]');
        const ratingEl = article.querySelector('[role="img"][aria-label*="stars"]');
        const websiteEl = article.querySelector('a[data-value="Website"]');
        
        if (nameEl) {
          const ratingMatch = ratingEl?.getAttribute('aria-label')?.match(/(\d\.?\d?)/);
          
          items.push({
            name: nameEl.textContent.trim(),
            address: addressEl ? addressEl.getAttribute('aria-label') : null,
            rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
            hasWebsite: !!websiteEl
          });
        }
      });
      return items;
    });
    
    stores.push(...results);
    await page.close();
  } catch (error) {
    console.error(`❌ Error searching Google Maps:`, error.message);
    await page.close();
  }
  
  return stores;
}

async function findFacebookPages(browser, storeName, city) {
  console.log(`📘 Looking for Facebook page: ${storeName} in ${city}`);
  
  const page = await browser.newPage();
  
  try {
    const searchQuery = `${storeName} ${city} Connecticut`;
    await page.goto(`https://www.facebook.com/search/pages?q=${encodeURIComponent(searchQuery)}`);
    
    // Note: Facebook requires login for most data
    // This is a simplified example - in production you'd need authentication
    
    await page.close();
    return null;
  } catch (error) {
    console.error(`❌ Error searching Facebook:`, error.message);
    await page.close();
    return null;
  }
}

async function scrapeWizardsEventLocator(browser) {
  console.log(`🎮 Checking Wizards Event Locator for Magic stores...`);
  
  const page = await browser.newPage();
  const stores = [];
  
  try {
    await page.goto('https://locator.wizards.com/?searchType=stores&query=Connecticut&distance=100&page=1&sort=name&sortDirection=asc');
    await page.waitForSelector('.store-list', { timeout: 10000 });
    
    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.store-result').forEach(store => {
        const name = store.querySelector('.store-name')?.textContent;
        const address = store.querySelector('.store-address')?.textContent;
        const phone = store.querySelector('.store-phone')?.textContent;
        
        if (name) {
          items.push({
            name: name.trim(),
            address: address?.trim(),
            phone: phone?.trim(),
            games: ['Magic: The Gathering']
          });
        }
      });
      return items;
    });
    
    stores.push(...results);
    await page.close();
  } catch (error) {
    console.error(`❌ Error scraping Wizards Event Locator:`, error.message);
    await page.close();
  }
  
  return stores;
}

async function main() {
  console.log('🎲 Starting Connecticut Gaming Store Scraper...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const allStores = [];
  
  try {
    // 1. Scrape known store websites
    console.log('📋 Phase 1: Scraping known store websites...');
    const knownStoreData = await Promise.all(
      STORE_WEBSITES.map(store => limit(() => scrapeStoreWebsite(browser, store)))
    );
    allStores.push(...knownStoreData.filter(Boolean));
    
    // 2. Find new stores via Google
    console.log('\n📋 Phase 2: Finding new stores via Google...');
    for (const query of SEARCH_QUERIES) {
      const googleStores = await findStoresOnGoogle(browser, query);
      const mapStores = await findStoresOnGoogleMaps(browser, query);
      
      allStores.push(...googleStores);
      allStores.push(...mapStores);
      
      // Be respectful - wait between searches
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 3. Check gaming-specific directories
    console.log('\n📋 Phase 3: Checking gaming directories...');
    const wizardStores = await scrapeWizardsEventLocator(browser);
    allStores.push(...wizardStores);
    
    // 4. Deduplicate and save results
    console.log('\n📋 Phase 4: Processing results...');
    const uniqueStores = deduplicateStores(allStores);
    
    // Save to JSON file
    await fs.writeFile(
      'scraped-stores.json',
      JSON.stringify(uniqueStores, null, 2)
    );
    
    console.log(`\n✅ Scraping complete! Found ${uniqueStores.length} unique stores.`);
    console.log('📁 Results saved to scraped-stores.json');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await browser.close();
  }
}

function deduplicateStores(stores) {
  const seen = new Map();
  
  stores.forEach(store => {
    if (store && store.name) {
      const key = store.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(key) || (store.address && !seen.get(key).address)) {
        seen.set(key, store);
      }
    }
  });
  
  return Array.from(seen.values());
}

// Alternative: Use Puppeteer with stealth plugin
async function scrapeWithPuppeteerStealth() {
  // npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  
  puppeteer.use(StealthPlugin());
  
  const browser = await puppeteer.launch({ headless: true });
  // ... rest of scraping logic
}

// Run the scraper
main().catch(console.error);