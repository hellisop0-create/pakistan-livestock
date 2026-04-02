import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Ad } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../LanguageContext';
import { User as UserIcon, Settings, Heart, List, Trash2, Edit, CheckCircle, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';


export default function Profile() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'listings' | 'favorites'>('listings');
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // DEBUG:
  console.log("TReW3CIHUOPs54r5a0wF9WMQX6E2:", user?.uid);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'ads'), where('sellerUid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  const handleDeleteAd = async (adId: string) => {
  console.log("Delete button clicked for ID:", adId); // If this doesn't show up, the button isn't firing
  try {
    await deleteDoc(doc(db, 'ads', adId));
    toast.success('Ad deleted successfully');
  } catch (error: any) {
    console.error("Full Delete Error:", error);
    toast.error('Failed to delete: ' + error.message);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="relative inline-block mb-4">
                <img
                  src={user.photoURL || 'https://picsum.photos/seed/user/100/100'}
                  alt={user.displayName}
                  className="w-24 h-24 rounded-full border-4 border-green-100 mx-auto"
                />
                {user.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.displayName}</h2>
              <p className="text-sm text-gray-500 mb-6">{user.email}</p>
              
              <div className="flex flex-col space-y-2">
                <button className="w-full bg-gray-50 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-100 flex items-center justify-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
                <button onClick={logout} className="w-full bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center space-x-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Account Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Total Ads</span>
                  <span className="font-bold text-green-700">{myAds.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Active Ads</span>
                  <span className="font-bold text-green-700">{myAds.filter(a => a.status === 'active').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Total Views</span>
                  <span className="font-bold text-green-700">{myAds.reduce((acc, ad) => acc + (ad.viewCount || 0), 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
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

            {activeTab === 'listings' ? (
              <div className="space-y-4">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse"></div>)}
                  </div>
                ) : myAds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myAds.map(ad => (
                      <div key={ad.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex space-x-4">
                        <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-900 truncate">{ad.title}</h4>
                            <div className={cn(
                              "text-[10px] font-bold px-2 py-1 rounded uppercase",
                              ad.status === 'active' ? "bg-green-100 text-green-700" :
                              ad.status === 'pending' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                            )}>
                              {ad.status}
                            </div>
                          </div>
                          <p className="text-green-700 font-bold mt-1 text-lg">{ad.price.toLocaleString()} PKR</p>
                          <div className="flex items-center text-xs text-gray-400 mt-2">
                            <Clock className="w-3 h-3 mr-1" />
                            Posted {new Date(ad.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <Link to={`/ad/${ad.id}`} className="flex-1 bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteAd(ad.id)}
                              className="flex-1 bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 flex items-center justify-center"
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
                    <p className="text-gray-500">You haven't posted any ads yet.</p>
                    <button onClick={() => navigate('/post-ad')} className="mt-4 text-green-700 font-bold">Post your first ad</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                <p className="text-gray-500">Your favorite ads will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
