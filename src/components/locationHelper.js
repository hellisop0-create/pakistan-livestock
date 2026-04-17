import locationData from '../data/locations.json';

export const getNestedLocations = () => {
  return locationData.reduce((acc, item) => {
    const { province, city, area } = item;
    
    // 1. Create province if it doesn't exist
    if (!acc[province]) {
      acc[province] = {};
    }
    
    // 2. Add city and its areas
    // Fallback to city name if area is missing (like in your "Dina city" entry)
    acc[province][city] = area || [city];
    
    return acc;
  }, {});
};