import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  documentId 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Ad } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../contexts/LanguageContext';
import { Heart, List, Trash2, CheckCircle, LogOut, Loader2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Profile() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'listings' | 'favorites'>('listings');
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [favoriteAds, setFavoriteAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // 1. Fetch User's Own Listings (Real-time)
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    // FIXED: Changed 'userId' to 'sellerUid' to match your PostAd logic
    const q = query(
      collection(db, 'ads'),
      where('sellerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ads = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Ad));
      
      setMyAds(ads);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // 2. Fetch User's Favorites (Real-time)
  useEffect(() => {
    if (activeTab !== 'favorites' || !user?.favoriteAds || user.favoriteAds.length === 0) {
      setFavoriteAds([]);
      setLoadingFavs(false);
      return;
    }

    setLoadingFavs(true);

    try {
      const q = query(
        collection(db, 'ads'),
        where(documentId(), 'in', user.favoriteAds)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ads = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Ad));
        setFavoriteAds(ads);
        setLoadingFavs(false);
      }, (err) => {
        console.error("Favorites error:", err);
        setLoadingFavs(false);
      });

      return () => unsubscribe();
    } catch (error) {
      setLoadingFavs(false);
    }
  }, [activeTab, user?.favoriteAds]);

  if (!user) return null;

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    try {
      await deleteDoc(doc(db, 'ads', adId));
      toast.success('Ad deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="relative inline-block mb-4">
                <img
                  src={user.photoURL || 'https://picsum.photos/seed/user/100/100'}
                  alt={user.displayName || 'User'}
                  className="w-24 h-24 rounded-full border-4 border-green-100 mx-auto object-cover"
                />
                {user.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.displayName || 'User'}</h2>
              <p className="text-sm text-gray-500 mb-6">{user.email}</p>
              
              <button 
                onClick={logout} 
                className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg font-bold hover:bg-red-100 flex items-center justify-center space-x-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200 flex space-x-2">
              <button
                onClick={() => setActiveTab('listings')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all",
                  activeTab === 'listings' ? "bg-green-700 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <List className="w-5 h-5" />
                <span>{t('myAds')}</span>
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all",
                  activeTab === 'favorites' ? "bg-green-700 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Heart className="w-5 h-5" />
                <span>{t('favorites')}</span>
              </button>
            </div>

            <div className="mt-6">
              {activeTab === 'listings' ? (
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
                    </div>
                  ) : myAds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {myAds.map(ad => (
                        <div key={ad.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex space-x-4 relative">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                            <img 
                              src={ad.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-gray-900 truncate pr-2">{ad.title}</h4>
                                {ad.status === 'pending' && (
                                  <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded-full flex items-center font-medium border border-amber-100">
                                    <Clock className="w-3 h-3 mr-1" /> Pending
                                  </span>
                                )}
                              </div>
                              <p className="text-green-700 font-bold mt-1">
                                {ad.price ? `${ad.price.toLocaleString()} PKR` : 'Price on call'}
                              </p>
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <button 
                                onClick={() => handleDeleteAd(ad.id)} 
                                className="flex-1 bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                      <p className="text-gray-500">No ads found. Try posting one!</p>
                      <button onClick={() => navigate('/post')} className="mt-4 text-green-700 font-bold">
                        Go to Post Ad
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Favorites Tab stays the same */
                <div className="space-y-4">
                  {loadingFavs ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-green-700 animate-spin" /></div>
                  ) : favoriteAds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {favoriteAds.map(ad => (
                        <AdCard key={ad.id} ad={ad} isFavorite={true} onToggleFavorite={() => {}} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                      <p className="text-gray-500">No favorite ads yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}