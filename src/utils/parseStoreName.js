// Parse store name to extract city if it's in the name
export function parseStoreName(storeName, defaultCity) {
  // List of Connecticut cities
  const ctCities = [
    'Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Waterbury',
    'Norwalk', 'Danbury', 'New Britain', 'Meriden', 'Bristol',
    'West Haven', 'Milford', 'Middletown', 'Norwich', 'Shelton',
    'Wallingford', 'Groton', 'Fairfield', 'Enfield', 'Glastonbury',
    'Hamden', 'East Hartford', 'Southington', 'Torrington', 'Stratford',
    'Manchester', 'Vernon', 'Windham', 'Bloomfield', 'Windsor',
    'Wethersfield', 'Rocky Hill', 'Cromwell', 'Durham', 'Guilford',
    'Madison', 'Clinton', 'Westbrook', 'Old Saybrook', 'Essex',
    'Chester', 'Deep River', 'Haddam', 'East Haddam', 'Portland'
  ];
  
  // First check if store name contains " - " followed by a city name
  const dashParts = storeName.split(' - ');
  if (dashParts.length > 1) {
    const potentialCity = dashParts[dashParts.length - 1].trim();
    if (ctCities.includes(potentialCity)) {
      return potentialCity;
    }
  }
  
  // Check if any city name appears at the end of the store name
  // This catches cases like "Amato's Toy and Hobby Middletown"
  for (const city of ctCities) {
    if (storeName.endsWith(city) || storeName.endsWith(city.toUpperCase()) || storeName.endsWith(city.toLowerCase())) {
      return city;
    }
  }
  
  // Check if any city name appears anywhere in the store name (last resort)
  // Split by common separators and check each part
  const words = storeName.split(/[\s,\-]+/);
  for (const word of words) {
    const normalizedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    if (ctCities.includes(normalizedWord)) {
      return normalizedWord;
    }
  }
  
  return defaultCity;
}