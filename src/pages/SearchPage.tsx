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
  if (!queryTerm || queryTerm === "All Pakistan") return [];
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
  return str ? str.toLowerCase().replace(/[,]/g, '').replace(/\s+/g, ' ').trim() : "";
}

// ✅ Tokenizer for partial matching
function getTokens(str) {
  return normalizeLocation(str).split(' ');
}

// ✅ Smart Logic to connect Search Terms to Ad Locations
function smartLocationMatch(adLoc, searchLoc, osmLocations) {
  const ad = normalizeLocation(adLoc);
  const search = normalizeLocation(searchLoc);
  
  if (ad.includes(search) || search.includes(ad)) return true;
  
  const adTokens = getTokens(ad);
  const searchTokens = getTokens(search);
  const tokenMatch = searchTokens.some(token => adTokens.includes(token));
  if (tokenMatch) return true;

  return osmLocations.some(loc => {
    const norm = normalizeLocation(loc);
    return norm.includes(ad) || ad.includes(norm);
  });
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [exactAds, setExactAds] = useState<Ad[]>([]);
  const [otherAds, setOtherAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const queryTerm = searchParams.get('q') || "";
  const locationTerm = searchParams.get('location') || "All Pakistan";

  useEffect(() => {
    setLoading(true);

    // Fetch all active ads (we filter by location in JS to allow fallback logic)
    const q = query(collection(db, 'ads'), where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      
      const isSpecificLocation = locationTerm && locationTerm !== "All Pakistan";
      let osmLocations = [];

      if (isSpecificLocation) {
        osmLocations = await searchLocationOSM(locationTerm);
      }

      const matches: Ad[] = [];
      const fallbacks: Ad[] = [];

      allAds.forEach(ad => {
        const adTitle = (ad.title || "").toLowerCase();
        const adLoc = (ad.location || "").toLowerCase();
        const searchQ = queryTerm.toLowerCase().trim();
        const searchLoc = locationTerm.toLowerCase().trim();

        const matchesSearch = adTitle.includes(searchQ);
        const matchesLocation = !isSpecificLocation || smartLocationMatch(adLoc, searchLoc, osmLocations);

        if (matchesSearch) {
          if (matchesLocation) {
            matches.push(ad);
          } else {
            fallbacks.push(ad);
          }
        }
      });

      const sortByFeatured = (a: Ad, b: Ad) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      
      setExactAds(matches.sort(sortByFeatured));
      setOtherAds(fallbacks.sort(sortByFeatured));
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
              <div className="flex items-center text-sm text-gray-500 mt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 mr-1 text-green-600" />
                {locationTerm}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full w-fit">
            <Package className="w-4 h-4" />
            {exactAds.length} Ads Found
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[320px] bg-white border border-gray-100 animate-pulse rounded-2xl shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            {/* 1. SECTION: Exact Location Results */}
            {exactAds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {exactAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
              </div>
            ) : (
              // 2. SECTION: If no matches for selected location
              locationTerm !== "All Pakistan" && (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 max-w-2xl mx-auto shadow-sm">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">No ads in {locationTerm}</h3>
                  <p className="text-gray-500 mt-2">
                    We couldn't find any results in this specific area. <br /> 
                    Check out listings from across Pakistan below.
                  </p>
                </div>
              )
            )}

            {/* 3. SECTION: Fallback Results with a gap */}
            {otherAds.length > 0 && (
              <div className="pt-10 border-t border-gray-200">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Featured from All Pakistan</h2>
                  <p className="text-gray-500">Other relevant ads related to your search</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {otherAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                </div>
              </div>
            )}

            {/* 4. SECTION: Complete zero results fallback */}
            {exactAds.length === 0 && otherAds.length === 0 && (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300 max-w-2xl mx-auto">
                <Filter className="w-10 h-10 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900">No matching ads found</h3>
                <button 
                  onClick={() => window.location.href = '/search'}
                  className="mt-4 text-green-700 font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}