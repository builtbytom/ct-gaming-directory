import { chromium } from 'playwright';

async function testGoogleMaps() {
  console.log('🧪 Testing Google Maps scraper...\n');
  
  const browser = await chromium.launch({
    headless: false, // Let's watch what happens
    slowMo: 1000 // Slow it down so we can see
  });
  
  const page = await browser.newPage();
  
  try {
    const query = 'game stores Hartford Connecticut';
    console.log(`Searching for: "${query}"`);
    
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
    
    // Wait for results to load
    console.log('Waiting for results...');
    await page.waitForTimeout(5000);
    
    // Try different selectors
    const selectors = [
      'a[aria-label][href*="maps/place"]', // Links to places
      'div[role="article"]', // Article containers
      'div[jsaction][jslog][data-value]', // Interactive divs
      'div.fontBodyMedium', // Text containers
      'h3.fontHeadlineSmall', // Heading elements
      'span[role="img"][aria-label*="stars"]', // Rating elements
    ];
    
    console.log('\nTesting selectors:');
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`  ${selector}: ${count} elements found`);
    }
    
    // Take a screenshot so we can see what loaded
    await page.screenshot({ path: 'scraper/google-maps-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to scraper/google-maps-test.png');
    
    // Try to extract any text we can find
    const allText = await page.evaluate(() => {
      const texts = [];
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 5 && text.length < 100 && !text.includes('function')) {
          texts.push(text);
        }
      });
      return texts.slice(0, 50); // First 50 text elements
    });
    
    console.log('\n📝 Sample text found on page:');
    allText.forEach((text, i) => {
      if (i < 10) console.log(`  ${i + 1}. ${text}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n⏸️  Browser will stay open for 30 seconds so you can inspect...');
  await page.waitForTimeout(30000);
  
  await browser.close();
}

testGoogleMaps();