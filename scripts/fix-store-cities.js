import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Known store locations that were scraped incorrectly
const knownStoreLocations = {
  "Dragon's Lair - Wallingford": "Wallingford",
  "Back Again Board Game Cafe LLC": "Bristol", // They have their main location in Bristol
  "Elm City Games": "New Haven",
  "Fire & Dice": "Milford", 
  "The Portal": "Manchester",
  "Gaming Underground": "Stamford",
  "Wonderland Comics": "Torrington",
  "Time Zone Gaming": "Norwalk",
  "Gamer's Gambit": "Groton",
  "Card Citadel": "Waterbury"
};

async function fixStoreCities() {
  console.log('Fixing store city data...');
  
  // Read the current store data
  const storesPath = path.join(__dirname, '../src/data/stores.json');
  const stores = JSON.parse(await fs.readFile(storesPath, 'utf8'));
  
  // Create a deduplicated list with correct cities
  const seenStores = new Map();
  
  stores.forEach(store => {
    const knownCity = knownStoreLocations[store.name];
    const actualCity = knownCity || store.city;
    
    // Use store name + actual city as key for deduplication
    const key = `${store.name}-${actualCity}`;
    
    if (!seenStores.has(key)) {
      seenStores.set(key, {
        ...store,
        city: actualCity,
        actualCity: actualCity,
        foundInSearches: [store.city]
      });
    } else {
      // Add to the list of cities where this store was found
      const existing = seenStores.get(key);
      if (!existing.foundInSearches.includes(store.city)) {
        existing.foundInSearches.push(store.city);
      }
    }
  });
  
  // Convert back to array and sort
  const fixedStores = Array.from(seenStores.values())
    .sort((a, b) => {
      if (a.city !== b.city) return a.city.localeCompare(b.city);
      return a.name.localeCompare(b.name);
    });
  
  // Save the fixed data
  await fs.writeFile(
    path.join(__dirname, '../src/data/stores-fixed.json'),
    JSON.stringify(fixedStores, null, 2)
  );
  
  console.log(`Fixed ${fixedStores.length} stores (from ${stores.length} original entries)`);
  console.log('Saved to src/data/stores-fixed.json');
  
  // Show some examples
  console.log('\nExample fixes:');
  fixedStores
    .filter(s => knownStoreLocations[s.name])
    .slice(0, 5)
    .forEach(store => {
      console.log(`- ${store.name}: ${store.foundInSearches.join(', ')} → ${store.city}`);
    });
}

fixStoreCities().catch(console.error);