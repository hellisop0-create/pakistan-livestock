import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, MapPin, Filter, Package } from 'lucide-react';

// ✅ OSM API for geographical intelligence
async function searchLocationOSM(queryTerm) {
  if (!queryTerm) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${queryTerm}, Pakistan&format=json`,
      {
        headers: { "User-Agent": "livestock-mandi-app (support@mandi.com)" }
      }
    );
    const data = await res.json();
    return data.map(item => item.display_name.toLowerCase());
  } catch (err) {
    console.error("OSM error:", err);
    return [];
  }
}

// ✅ Normalize strings for comparison
function normalizeLocation(str) {
  return str
    .toLowerCase()
    .replace(/[,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ✅ Tokenizer for partial matching
function getTokens(str) {
  return normalizeLocation(str).split(' ');
}

// ✅ Smart Logic to connect Search Terms to Ad Locations
function smartLocationMatch(adLoc, searchLoc, osmLocations) {
  const ad = normalizeLocation(adLoc);
  const search = normalizeLocation(searchLoc);

  // Direct containment
  if (ad.includes(search) || search.includes(ad)) return true;

  // Token matching (e.g., "DHA" matches "DHA Phase 1")
  const adTokens = getTokens(ad);
  const searchTokens = getTokens(search);
  const tokenMatch = searchTokens.some(token => adTokens.includes(token));
  if (tokenMatch) return true;

  // OSM matching for broader regions
  const osmMatch = osmLocations.some(loc => {
    const norm = normalizeLocation(loc);
    return norm.includes(ad) || ad.includes(norm);
  });

  return osmMatch;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const queryTerm = searchParams.get('q') || "";
  const locationTerm = searchParams.get('location') || "";

  useEffect(() => {
    setLoading(true);

    const q = query(collection(db, 'ads'), where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      
      let osmLocations = [];

      // Only fetch OSM intelligence if a specific location is selected
      if (locationTerm && locationTerm !== "All Pakistan") {
        osmLocations = await searchLocationOSM(locationTerm);
      }

      const filtered = allAds.filter(ad => {
        const adTitle = (ad.title || "").toLowerCase();
        const adLoc = (ad.location || "").toLowerCase();
        const searchQ = queryTerm.toLowerCase().trim();
        const searchLoc = locationTerm.toLowerCase().trim();

        const matchesSearch = adTitle.includes(searchQ);

        // REPLACED WITH SMART MATCHING LOGIC
        const matchesLocation =
          !locationTerm ||
          locationTerm === "All Pakistan" ||
          smartLocationMatch(adLoc, searchLoc, osmLocations);

        return matchesSearch && matchesLocation;
      });

      // FULL EDITED LOGIC: Sort featured ads to the top before setting state
      const sorted = filtered.sort((a, b) => {
        const aFeatured = a.isFeatured ? 1 : 0;
        const bFeatured = b.isFeatured ? 1 : 0;
        return bFeatured - aFeatured;
      });

      setAds(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [queryTerm, locationTerm]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Search Header Info */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Search className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {queryTerm ? `Results for "${queryTerm}"` : "Livestock Marketplace"}
              </h1>
              <div className="flex items-center text-sm text-gray-500 mt-0.5">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                {locationTerm || "All Pakistan"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full w-fit">
            <Package className="w-4 h-4" />
            {ads.length} Ads Found
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="h-[320px] bg-white border border-gray-100 animate-pulse rounded-2xl shadow-sm" />
                ))}
              </div>
            ) : (
              <>
                {ads.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {ads.map(ad => (
                      <div key={ad.id} className="transition-transform duration-300 hover:-translate-y-1">
                        <AdCard ad={ad} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm max-w-2xl mx-auto">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Filter className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No matching ads found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8">
                      Try searching in a different area or using broader keywords.
                    </p>
                    <button 
                      onClick={() => window.location.href = '/search'}
                      className="text-green-700 font-semibold hover:text-green-800 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}