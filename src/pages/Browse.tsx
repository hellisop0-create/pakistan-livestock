import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad, Category } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, SlidersHorizontal, MapPin, Package, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

const categories: Category[] = ['Cattle', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Others'];
const cities = ['All Pakistan', 'Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [exactAds, setExactAds] = useState<Ad[]>([]);
  const [otherAds, setOtherAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useLanguage();

  const categoryFilter = searchParams.get('category') as Category | null;
  const cityFilter = searchParams.get('city') || 'All Pakistan';
  const sortFilter = searchParams.get('sort') || 'latest';

  useEffect(() => {
    setLoading(true);
    // Base query: only filter by status and category in Firestore
    let q = query(collection(db, 'ads'), where('status', '==', 'active'));

    if (categoryFilter) {
      q = query(q, where('category', '==', categoryFilter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allFetchedAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      
      const localExact: Ad[] = [];
      const localOthers: Ad[] = [];

      allFetchedAds.forEach(ad => {
        // Strict location matching
        const isCityMatch = cityFilter === 'All Pakistan' || ad.city === cityFilter;
        
        if (isCityMatch) {
          localExact.push(ad);
        } else {
          localOthers.push(ad);
        }
      });

      // Sorting Logic
      const sortFunction = (a: Ad, b: Ad) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (sortFilter === 'price_asc') return a.price - b.price;
        if (sortFilter === 'price_desc') return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      };

      setExactAds(localExact.sort(sortFunction));
      setOtherAds(localOthers.sort(sortFunction));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [categoryFilter, cityFilter, sortFilter]);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Info */}
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
                {cityFilter}
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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={cn("w-full lg:w-64 space-y-8", showFilters ? "block" : "hidden lg:block")}>
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                {t('categories')}
                {categoryFilter && (
                  <button onClick={() => updateFilter('category', null)} className="text-xs text-red-500 font-normal underline">Clear</button>
                )}
              </h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => updateFilter('category', cat)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg transition-colors text-sm",
                      categoryFilter === cat ? "bg-green-700 text-white font-bold" : "bg-white text-gray-600 hover:bg-gray-100 border border-transparent"
                    )}
                  >
                    {t(cat.toLowerCase())}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center text-sm uppercase tracking-wider">
                <MapPin className="w-4 h-4 mr-2" /> {t('location')}
              </h3>
              <select
                value={cityFilter}
                onChange={(e) => updateFilter('city', e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Sort By</h3>
              <select
                value={sortFilter}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none"
              >
                <option value="latest">Latest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </aside>

          {/* Listings Main Section */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white animate-pulse rounded-2xl border border-gray-100" />)}
              </div>
            ) : (
              <div className="space-y-12">
                {/* 1. PRIMARY RESULTS (Selected Location) */}
                {exactAds.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {exactAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                  </div>
                ) : (
                  cityFilter !== 'All Pakistan' && (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center max-w-2xl mx-auto">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900">No ads in {cityFilter}</h3>
                      <p className="text-gray-500 mt-2">We couldn't find any listings for this location, but check out other options below.</p>
                    </div>
                  )
                )}

                {/* 2. GAP AND SECONDARY RESULTS (Across Pakistan) */}
                {otherAds.length > 0 && (
                  <div className="pt-10 border-t border-gray-200">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">More from Across Pakistan</h2>
                      <p className="text-gray-500">Other {categoryFilter || 'livestock'} ads you might like</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {otherAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                    </div>
                  </div>
                )}

                {/* 3. ABSOLUTE EMPTY STATE */}
                {exactAds.length === 0 && otherAds.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm max-w-2xl mx-auto">
                    <Filter className="w-10 h-10 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No matching ads found anywhere</h3>
                    <button onClick={() => setSearchParams({})} className="text-green-700 font-bold hover:underline">
                      Clear all filters
                    </button>
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