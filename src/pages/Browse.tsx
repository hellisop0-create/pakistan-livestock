import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, MapPin, Filter, Package } from 'lucide-react';

// ✅ 100% FREE Geographical Lookup (OpenStreetMap)
async function getProvinceFromOSM(cityName) {
  if (!cityName || cityName === "all pakistan") return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}, Pakistan&format=json&addressdetails=1&limit=1`,
      {
        headers: { "User-Agent": "livestock-mandi-app-free-v1" }
      }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const addr = data[0].address;
      // In Pakistan, OSM usually returns province in 'state' or 'region'
      return (addr.state || addr.region || addr.province || "").toLowerCase();
    }
  } catch (err) {
    console.error("OSM Lookup Error:", err);
  }
  return null;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [exactAds, setExactAds] = useState<Ad[]>([]);
  const [otherAds, setOtherAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const queryTerm = (searchParams.get('q') || "").toLowerCase().trim();
  const province = (searchParams.get('province') || "").toLowerCase().trim();
  const city = (searchParams.get('city') || "").toLowerCase().trim();
  const area = (searchParams.get('area') || "").toLowerCase().trim();
  
  const locationTerm = [area, city, province].filter(Boolean).join(', ') || "All Pakistan";

  useEffect(() => {
    setLoading(true);

    const q = query(collection(db, 'ads'), where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      
      const matchedList: Ad[] = [];
      const fallbackList: Ad[] = [];

      // Process geographical hierarchy for each ad
      const processedAds = await Promise.all(allAds.map(async (ad) => {
        const adTitle = (ad.title || "").toLowerCase();
        const adCity = (ad.city || "").toLowerCase();
        const adProvince = (ad.province || "").toLowerCase();

        // 1. Check Search Query
        const matchesSearch = adTitle.includes(queryTerm) || queryTerm === "";

        // 2. Check Location Hierarchy
        let matchesLocation = false;

        if (locationTerm === "All Pakistan") {
          matchesLocation = true;
        } else {
          // Direct Check: Ad city/province matches the filter text exactly
          if (adProvince === province || adCity === city || adCity === province) {
            matchesLocation = true;
          } 
          // Smart Check: Is the Ad's city (Jamshoro) inside the filtered province (Sindh)?
          else if (province !== "" && adCity !== "") {
            const parentProvince = await getProvinceFromOSM(adCity);
            if (parentProvince && parentProvince.includes(province)) {
              matchesLocation = true;
            }
          }
        }

        return { ad, matchesSearch, matchesLocation };
      }));

      processedAds.forEach(({ ad, matchesSearch, matchesLocation }) => {
        if (matchesSearch) {
          if (matchesLocation) {
            matchedList.push(ad);
          } else {
            fallbackList.push(ad);
          }
        }
      });

      const sortByFeatured = (a: Ad, b: Ad) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      
      setExactAds(matchedList.sort(sortByFeatured));
      setOtherAds(fallbackList.sort(sortByFeatured));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [queryTerm, province, city, area]);

  return (
    <div className="min-h-screen bg-gray-50/50">
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
                <span className="capitalize">{locationTerm}</span>
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
            {/* Exact matches based on province/city hierarchy */}
            {exactAds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {exactAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
              </div>
            ) : (
              locationTerm !== "All Pakistan" && (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 max-w-2xl mx-auto">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">No ads found in {locationTerm}</h3>
                  <p className="text-gray-500 mt-2">Check out results from all over Pakistan below.</p>
                </div>
              )
            )}

            {/* Fallback results */}
            {otherAds.length > 0 && (
              <div className="pt-10 border-t border-gray-200">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Featured from All Pakistan</h2>
                  <p className="text-gray-500">Other relevant ads from different locations</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {otherAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                </div>
              </div>
            )}

            {exactAds.length === 0 && otherAds.length === 0 && (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300 max-w-2xl mx-auto">
                <Filter className="w-10 h-10 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900">No matching ads found</h3>
                <button onClick={() => window.location.href = '/search'} className="mt-4 text-green-700 font-bold hover:underline">
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