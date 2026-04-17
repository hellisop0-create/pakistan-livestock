import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, MapPin, Filter, Package } from 'lucide-react';

// ✅ Comprehensive LOCATION_DATA for lookup
const LOCATION_DATA = {
  "Sindh": {
    "Karachi": ["DHA", "Clifton", "Gulshan-e-Iqbal", "Gulistan-e-Johar", "North Nazimabad", "Malir", "Saddar", "Scheme 33"],
    "Hyderabad": ["Latifabad","Jamshoro", "Qasimabad", "Tando Allahyar Road", "Hyder Chowk", "Heerabaad", "Pathan Colony", "Citizen Colony", "Autobahn", "Tandojam"],
    "Sukkur": ["Military Road", "Barrage Road", "Rohri"],
    "Larkana": ["VIP Road", "Station Road"],
    "Mirpur Khas": ["Satellite Town", "Digri Road"]
  },
  "Punjab": {
    "Lahore": ["DHA", "Bahria Town", "Gulberg", "Johar Town", "Model Town", "Cantt"],
    "Faisalabad": ["Madina Town", "People's Colony", "D Ground"],
    "Rawalpindi": ["Bahria Town", "Saddar", "Chaklala", "Adiala Road"],
    "Multan": ["Bosan Road", "Gulgasht Colony", "Cantt"],
    "Gujranwala": ["Model Town", "DC Colony"],
    "Sialkot": ["Cantt", "Sialkot City"]
  }
};

function normalize(str: any) {
  return str ? str.toString().toLowerCase().trim() : "";
}

// ✅ This version checks both Cities AND Areas to find the Province
const getAdProvince = (ad: any) => {
  if (ad.province) return normalize(ad.province);
  
  const city = normalize(ad.city);
  const area = normalize(ad.area);

  for (const [provinceName, cities] of Object.entries(LOCATION_DATA)) {
    const provinceNorm = normalize(provinceName);
    
    // 1. Check if the ad's city is listed as a City in this province
    if (Object.keys(cities).some(c => normalize(c) === city)) return provinceNorm;
    
    // 2. Check if the ad's city is listed as an Area in this province
    if (Object.values(cities).flat().some(a => normalize(a) === city)) return provinceNorm;

    // 3. Check if the ad's area is listed as an Area in this province
    if (Object.values(cities).flat().some(a => normalize(a) === area)) return provinceNorm;
  }
  return "";
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [exactAds, setExactAds] = useState<Ad[]>([]);
  const [otherAds, setOtherAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const queryTerm = searchParams.get('q') || "";
  const provinceParam = searchParams.get('province') || "";
  const cityParam = searchParams.get('city') || "";
  const areaParam = searchParams.get('area') || "";
  
  const locationDisplay = [areaParam, cityParam, provinceParam].filter(Boolean).join(', ') || "All Pakistan";

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'ads'), where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      
      const matches: Ad[] = [];
      const fallbacks: Ad[] = [];

      allAds.forEach(ad => {
        const adTitle = normalize(ad.title);
        const adBreed = normalize(ad.breed);
        const adCategory = normalize(ad.category);
        const searchQ = normalize(queryTerm);

        // 1. Keyword Match (Title, Breed, or Category)
        const matchesSearch = !searchQ || 
                             adTitle.includes(searchQ) || 
                             adBreed.includes(searchQ) || 
                             adCategory.includes(searchQ);

        // 2. Hierarchical Location Logic
        let matchesLocation = true;
        const adProvince = getAdProvince(ad);
        const adCity = normalize(ad.city);
        const adArea = normalize(ad.area);

        if (areaParam) {
          matchesLocation = adArea === normalize(areaParam);
        } else if (cityParam) {
          // If searching Hyderabad, show ads in Hyderabad OR sub-areas like Tandojam
          matchesLocation = adCity === normalize(cityParam) || adArea === normalize(cityParam);
        } else if (provinceParam) {
          // If searching Sindh, show anything that maps to Sindh
          matchesLocation = adProvince === normalize(provinceParam) || 
                            adCity === normalize(provinceParam) || 
                            adArea === normalize(provinceParam);
        }

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
    }, (error) => {
      console.error("Firebase error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [queryTerm, provinceParam, cityParam, areaParam]);

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
                {locationDisplay}
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
            {exactAds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {exactAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
              </div>
            ) : (
              (provinceParam || cityParam || areaParam) && (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 max-w-2xl mx-auto shadow-sm">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">No ads in {locationDisplay}</h3>
                  <p className="text-gray-500 mt-2">
                    We couldn't find any results in this area. <br /> 
                    Check out listings from across Pakistan below.
                  </p>
                </div>
              )
            )}

            {otherAds.length > 0 && (
              <div className="pt-10 border-t border-gray-200">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Featured from All Pakistan</h2>
                  <p className="text-gray-500">Other listings related to your search</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {otherAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}