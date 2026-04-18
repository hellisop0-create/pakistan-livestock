import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AdCard from '../components/AdCard';
import AdBanner from '../components/AdBanner'; // Added import
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AllListings() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.favoriteAds) setFavorites(user.favoriteAds);
    else setFavorites([]);
  }, [user?.favoriteAds]);

  useEffect(() => {
    const adsQuery = query(
      collection(db, 'ads'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(adsQuery, (snapshot) => {
      const fetchedAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));

      const sortedAds = fetchedAds.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });

      setAds(sortedAds);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleFavorite = async (adId: string) => {
    if (!user) return toast.error('Please login to favorite ads');
    const userRef = doc(db, 'users', user.uid);
    const isCurrentlyFavorite = favorites.includes(adId);
    try {
      await updateDoc(userRef, { favoriteAds: isCurrentlyFavorite ? arrayRemove(adId) : arrayUnion(adId) });
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors bg-white shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Listings</h1>
            <p className="text-gray-500">Showing {ads.length} active ads</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl h-40 animate-pulse border border-gray-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {ads.map((ad, index) => (
              <React.Fragment key={ad.id}>
                <div className="w-full">
                  <AdCard
                    ad={ad}
                    isFavorite={favorites.includes(ad.id)}
                    onToggleFavorite={() => toggleFavorite(ad.id)}
                    isHorizontal={true}
                  />
                </div>

                {/* FIXED SIZE BANNER AFTER 5TH AD (index 4) */}
                {index === 4 && (
                  /* 1. h-32 md:h-40 (128px/160px)
                     2. flex items-center justify-center (Centers the image)
                  */
                  <div className="w-full h-32 md:h-40 overflow-hidden rounded-xl my-4 shadow-sm border border-gray-100 bg-white flex items-center justify-center">
                    <AdBanner location="listings_page" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {!loading && ads.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">No ads available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}