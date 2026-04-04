import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Ad, User, Transaction } from '../types';
import { CheckCircle, XCircle, Shield, Users, FileText, CreditCard, ExternalLink, ShieldCheck, AlertCircle, Lock, Calendar, Star } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ads' | 'users' | 'payments'>('ads');
  
  // State for pending approvals
  const [featuredSelections, setFeaturedSelections] = useState<{[key: string]: boolean}>({});
  const [timeFilter, setTimeFilter] = useState<'all' | '7days' | 'month'>('all');

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isUnlocked) return;

    let adsQuery = query(collection(db, 'ads'), where('status', '!=', 'rejected'));

    if (timeFilter !== 'all') {
      const now = new Date();
      const daysToSubtract = timeFilter === '7days' ? 7 : 30;
      const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));
      
      adsQuery = query(
        collection(db, 'ads'), 
        where('status', '!=', 'rejected'),
        where('createdAt', '>=', Timestamp.fromDate(cutoffDate))
      );
    }

    const unsubAds = onSnapshot(adsQuery, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
    });

    const unsubTrans = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    });

    return () => {
      unsubAds();
      unsubUsers();
      unsubTrans();
    };
  }, [isUnlocked, timeFilter]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "z@gmail.com" && password === "admin1234") {
      setIsUnlocked(true);
      setAuthError('');
      toast.success('Dashboard Unlocked');
    } else {
      setAuthError('Invalid administrator credentials');
      toast.error('Access Denied');
    }
  };

  // Toggle featured status for ads that are already ACTIVE
  const handleToggleFeatured = async (adId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { is_featured: !currentStatus });
      toast.success(!currentStatus ? 'Ad Promoted to Featured' : 'Featured Status Removed');
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleApproveAd = async (adId: string, isFeatured: boolean) => {
    try {
      const adRef = doc(db, 'ads', adId);
      await updateDoc(adRef, { 
        status: 'active',
        is_featured: isFeatured 
      });
      toast.success(isFeatured ? 'Ad Approved as Featured!' : 'Ad Approved!');
      setFeaturedSelections(prev => {
        const newState = {...prev};
        delete newState[adId];
        return newState;
      });
    } catch (error) {
      toast.error('Error approving ad');
    }
  };

  const handleRejectAd = async (adId: string) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { status: 'rejected' });
      toast.success('Ad removed from panel');
    } catch (error) {
      toast.error('Error rejecting ad');
    }
  };

  const handleVerifyUser = async (userId: string, isVerified: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isVerified: !isVerified });
      toast.success(isVerified ? 'Verification removed' : 'User verified');
    } catch (error) {
      toast.error('Error updating user');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-gray-900">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
           <div className="text-center mb-8">
            <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-700">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold">Admin Access</h2>
            <p className="text-gray-500 text-sm mt-2">Enter credentials to manage CITYCARE</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl border" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl border" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-green-700 text-white font-bold py-3 rounded-xl">Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold flex items-center">
            <Shield className="w-8 h-8 mr-3 text-green-700" /> Admin Dashboard
          </h1>
          <button onClick={() => setIsUnlocked(false)} className="text-xs bg-gray-200 px-3 py-1 rounded-full">Lock Panel</button>
        </div>

        <div className="flex space-x-4 mb-8">
          <button onClick={() => setActiveTab('ads')} className={cn("px-6 py-3 rounded-xl font-bold", activeTab === 'ads' ? "bg-green-700 text-white" : "bg-white")}>Ads</button>
          <button onClick={() => setActiveTab('users')} className={cn("px-6 py-3 rounded-xl font-bold", activeTab === 'users' ? "bg-green-700 text-white" : "bg-white")}>Users</button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === 'ads' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold">Ad Details</th>
                    <th className="px-6 py-4 text-sm font-bold">Seller</th>
                    <th className="px-6 py-4 text-sm font-bold text-center">Featured?</th>
                    <th className="px-6 py-4 text-sm font-bold">Status</th>
                    <th className="px-6 py-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ads.map(ad => (
                    <tr key={ad.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={ad.images?.[0]} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <div className="font-bold flex items-center gap-1">
                              {ad.title} {ad.is_featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="text-xs text-gray-500">{ad.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{ad.sellerName}</td>
                      
                      {/* --- FEATURED TOGGLE (WORKS FOR PENDING & ACTIVE) --- */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <input 
                            type="checkbox"
                            className="w-5 h-5 rounded text-green-600 cursor-pointer"
                            // If pending, use local state. If active, use Firestore data.
                            checked={ad.status === 'pending' ? !!featuredSelections[ad.id] : !!ad.is_featured}
                            onChange={(e) => {
                              if (ad.status === 'pending') {
                                setFeaturedSelections({...featuredSelections, [ad.id]: e.target.checked});
                              } else {
                                handleToggleFeatured(ad.id, !!ad.is_featured);
                              }
                            }}
                          />
                          <span className="text-[9px] font-bold mt-1 text-gray-500 uppercase">Featured</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={cn("text-[10px] font-bold px-2 py-1 rounded uppercase", ad.status === 'active' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {ad.status === 'pending' && (
                            <button onClick={() => handleApproveAd(ad.id, !!featuredSelections[ad.id])} className="p-2 text-green-600 hover:bg-green-100 rounded-lg border border-green-200">
                              <CheckCircle className="w-6 h-6" />
                            </button>
                          )}
                          <button onClick={() => handleRejectAd(ad.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><XCircle className="w-5 h-5" /></button>
                          <Link to={`/ad/${ad.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><ExternalLink className="w-5 h-5" /></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}