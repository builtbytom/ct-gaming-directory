// Parse store name to extract city if it's in the name
export function parseStoreName(storeName, defaultCity) {
  // Check if store name contains " - " followed by a city name
  const parts = storeName.split(' - ');
  if (parts.length > 1) {
    const potentialCity = parts[parts.length - 1].trim();
    // List of Connecticut cities
    const ctCities = [
      'Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Waterbury',
      'Norwalk', 'Danbury', 'New Britain', 'Meriden', 'Bristol',
      'West Haven', 'Milford', 'Middletown', 'Norwich', 'Shelton',
      'Wallingford', 'Groton', 'Fairfield', 'Enfield', 'Glastonbury',
      'Hamden', 'East Hartford', 'Southington', 'Torrington', 'Stratford'
    ];
    
    if (ctCities.includes(potentialCity)) {
      return potentialCity;
    }
  }
  
  return defaultCity;
}