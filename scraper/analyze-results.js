import fs from 'fs/promises';

async function analyzeResults() {
  const data = JSON.parse(await fs.readFile('scraper-output/ct-game-stores.json', 'utf8'));
  
  console.log(`\n📊 SCRAPER RESULTS ANALYSIS`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Total stores found: ${data.length}`);
  
  // Stores with ratings
  const withRatings = data.filter(s => s.rating !== null);
  console.log(`\nStores with ratings: ${withRatings.length}`);
  
  // Top rated stores
  const topRated = withRatings.sort((a, b) => b.rating - a.rating).slice(0, 10);
  console.log(`\n🌟 TOP 10 HIGHEST RATED STORES:`);
  topRated.forEach((store, i) => {
    console.log(`${i + 1}. ${store.name} (${store.city}) - ${store.rating} stars (${store.reviewCount} reviews)`);
  });
  
  // Most reviewed stores
  const mostReviewed = data.filter(s => s.reviewCount > 0).sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 10);
  console.log(`\n💬 TOP 10 MOST REVIEWED STORES:`);
  mostReviewed.forEach((store, i) => {
    console.log(`${i + 1}. ${store.name} (${store.city}) - ${store.reviewCount} reviews`);
  });
  
  // Cities with most stores
  const cityCounts = {};
  data.forEach(store => {
    cityCounts[store.city] = (cityCounts[store.city] || 0) + 1;
  });
  
  console.log(`\n🏙️ STORES BY CITY:`);
  Object.entries(cityCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([city, count]) => {
      console.log(`${city}: ${count} stores`);
    });
  
  // Game type coverage
  const gameCounts = {};
  data.forEach(store => {
    store.gamesFound.forEach(game => {
      gameCounts[game] = (gameCounts[game] || 0) + 1;
    });
  });
  
  console.log(`\n🎮 STORES BY GAME TYPE:`);
  Object.entries(gameCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([game, count]) => {
      console.log(`${game}: ${count} stores`);
    });
  
  // Stores with hours status
  const withHours = data.filter(s => s.hoursStatus);
  console.log(`\n⏰ Stores with hours status: ${withHours.length}`);
  
  // Sample stores with complete data
  const complete = data.filter(s => s.rating && s.address && s.reviewCount > 10);
  console.log(`\n✅ STORES WITH COMPLETE DATA (${complete.length} total):`);
  complete.slice(0, 5).forEach(store => {
    console.log(`\n${store.name}`);
    console.log(`  📍 ${store.address || store.city}`);
    console.log(`  ⭐ ${store.rating} stars (${store.reviewCount} reviews)`);
    console.log(`  🎲 Games: ${store.gamesFound.join(', ')}`);
    if (store.hoursStatus) console.log(`  🕐 ${store.hoursStatus}`);
  });
}

analyzeResults();