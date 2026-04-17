import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad, Category } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, MapPin, Package, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { LOCATION_DATA } from '../components/locations';

const categories: Category[] = ['Cattle', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Others'];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [exactAds, setExactAds] = useState<Ad[]>([]);
  const [otherAds, setOtherAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters] = useState(false);
  const { t } = useLanguage();

  const categoryFilter = searchParams.get('category') as Category | null;
  const provinceFilter = searchParams.get('province') || '';
  const cityFilter = searchParams.get('city') || '';
  const areaFilter = searchParams.get('area') || '';
  const sortFilter = searchParams.get('sort') || 'latest';

  useEffect(() => {
    setLoading(true);
    setExactAds([]);
    setOtherAds([]);

    let q = query(collection(db, 'ads'), where('status', '==', 'active'));
    if (categoryFilter) {
      q = query(q, where('category', '==', categoryFilter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allFetchedAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      const seenIds = new Set();
      const localExact: Ad[] = [];
      const localOthers: Ad[] = [];

      allFetchedAds.forEach(ad => {
        if (seenIds.has(ad.id)) return;
        seenIds.add(ad.id);

        // Inside onSnapshot -> allFetchedAds.forEach
        const matchesProvince = !provinceFilter ||
          ad.province?.toString().trim().toLowerCase() === provinceFilter.trim().toLowerCase();

        const matchesCity = !cityFilter ||
          ad.city?.toString().trim().toLowerCase() === cityFilter.trim().toLowerCase();

        const matchesArea = !areaFilter ||
          ad.area?.toString().trim().toLowerCase() === areaFilter.trim().toLowerCase();

        if (provinceFilter || cityFilter || areaFilter) {
          if (matchesProvince && matchesCity && matchesArea) {
            localExact.push(ad);
          } else {
            localOthers.push(ad);
          }
        } else {
          localExact.push(ad);
        }
      });

      const sortFunction = (a: Ad, b: Ad) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (sortFilter === 'price_asc') return a.price - b.price;
        if (sortFilter === 'price_desc') return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      };

      setExactAds([...localExact].sort(sortFunction));
      setOtherAds([...localOthers].sort(sortFunction));
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });

    console.log("Active Filters:", { provinceFilter, cityFilter, areaFilter });
    console.log("First Ad Data:", exactAds[0] || otherAds[0]);

    return () => unsubscribe();
  }, [categoryFilter, provinceFilter, cityFilter, areaFilter, sortFilter]);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key === 'province') {
      newParams.delete('city');
      newParams.delete('area');
    }
    if (key === 'city') {
      newParams.delete('area');
    }
    setSearchParams(newParams);
  };

  // --- STRICT FILTERING LOGIC START ---
  const uniqueProvinces = Array.from(new Set((LOCATION_DATA || []).map(item => item.province))).filter(Boolean).sort();

  const availableCities = provinceFilter
    ? Array.from(new Set(
      (LOCATION_DATA || [])
        .filter(item => item.province === provinceFilter)
        .map(item => item.city)
    )).filter(Boolean).sort()
    : [];

  const availableAreas = (provinceFilter && cityFilter)
    ? (LOCATION_DATA || []).find(item => item.province === provinceFilter && item.city === cityFilter)?.area || []
    : [];

  const locationText = areaFilter || cityFilter || provinceFilter || 'Pakistan';
  // --- STRICT FILTERING LOGIC END ---

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
                {categoryFilter ? t(categoryFilter.toLowerCase()) : t('latest')}
              </h1>
              <div className="flex items-center text-sm text-gray-500 mt-0.5">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                {areaFilter ? `${areaFilter}, ` : ''}{cityFilter ? `${cityFilter}, ` : ''}{provinceFilter || 'All Pakistan'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full w-fit">
            <Package className="w-4 h-4" />
            {exactAds.length} {t('ads')}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className={cn("w-full lg:w-64 space-y-8", showFilters ? "block" : "hidden lg:block")}>
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                {t('categories')}
                {categoryFilter && (
                  <button onClick={() => updateFilter('category', null)} className="text-xs text-red-500 font-normal underline">Clear</button>
                )}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {categories.map(cat => (
                  <button
                    key={`cat-${cat}`}
                    onClick={() => updateFilter('category', cat)}
                    className={cn(
                      "text-left px-3 py-2 rounded-lg transition-all text-sm border",
                      categoryFilter === cat
                        ? "bg-green-700 text-white border-green-700 font-bold"
                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-100"
                    )}
                  >
                    {t(cat.toLowerCase())}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center text-sm uppercase tracking-wider">
                <MapPin className="w-4 h-4 mr-2" /> {t('location')}
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-semibold ml-1">PROVINCE</label>
                <select
                  value={provinceFilter}
                  onChange={(e) => updateFilter('province', e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm"
                >
                  <option value="">All Pakistan</option>
                  {uniqueProvinces.map((province) => (
                    <option key={`prov-opt-${province}`} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-semibold ml-1">CITY</label>
                <select
                  value={cityFilter}
                  onChange={(e) => updateFilter('city', e.target.value)}
                  disabled={!provinceFilter}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm disabled:bg-gray-50"
                >
                  <option value="">All Cities</option>
                  {availableCities.map((city) => (
                    <option key={`city-opt-${city}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-semibold ml-1">AREA</label>
                <select
                  value={areaFilter}
                  onChange={(e) => updateFilter('area', e.target.value)}
                  disabled={!cityFilter || availableAreas.length === 0}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm disabled:bg-gray-50"
                >
                  <option value="">All Areas</option>
                  {availableAreas.map((area) => (
                    <option key={`area-opt-${area}`} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Sort By</h3>
              <select
                value={sortFilter}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm"
              >
                <option value="latest">Latest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </aside>

          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={`skeleton-${i}`} className="h-80 bg-white animate-pulse rounded-2xl border border-gray-100" />)}
              </div>
            ) : (
              <div className="space-y-12">
                {exactAds.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {exactAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center max-w-2xl mx-auto">
                    <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No ads found in {locationText}</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your filters or checking "Across Pakistan" below.</p>
                  </div>
                )}

                {(provinceFilter || cityFilter || areaFilter) && otherAds.length > 0 && (
                  <div className="pt-10 border-t border-gray-200">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Across Pakistan</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {otherAds.map(ad => <AdCard key={`other-${ad.id}`} ad={ad} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}